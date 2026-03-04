const crypto = require("crypto");
const Razorpay = require("razorpay");
const sequelize = require("../database/db-connection");
const Order = require("../model/Order");
const OrderItem = require("../model/OrderItem");
const PaymentGateway = require("../model/PaymentGateway");
const Product = require("../model/Product");
const Customer = require("../model/Customer");
const { sendMail } = require("../utils/Helper");
const TrackProductStock = require("../model/TrackProductStock");
const CompanyManagementModel = require("../model/Company");
const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const { toWords } = require('number-to-words');
const { Op, fn, col, literal } = require("sequelize");

const htmlPdf = require('html-pdf-node');
const generateUniqueReferenceNumber = require("../utils/generateReferenceNumber");
const { Purchase, PurchaseProduct } = require("../model/Sales");

exports.verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    custom_order_id,
  } = req.body;

  try {
    const key_secret = (
      await PaymentGateway.findOne({
        where: { gatewayname: "razorpay" },
      })
    ).keysecret;

    const hmac = crypto.createHmac("sha256", key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    await Order.update(
      {
        payment_status: "Paid",
        payment_id: razorpay_payment_id,
      },
      {
        where: { custom_order_id },
      }
    );
    const paidOrder = await Order.findOne({ where: { custom_order_id } });
    const company = await CompanyManagementModel.findOne({ where: { id: req.user.company_id } });


  if (company && Number(company.pos_link_with_sales) === 1) {

      const salesOrder = await this.AddSalesOrderFromPOS(paidOrder.id, req.user);
    }

    res.status(200).json({ message: "Payment verified and order updated" });
  } catch (err) {
    console.error("Payment verification failed:", err);
    res
      .status(500)
      .json({ message: "Payment verification failed", error: err.message });
  }
};
exports.placeOrder = async (req, res) => {
  const {
    customer_id,
    products,
    shipping,
    discount,
    subtotal,
    taxes,
    grandTotal,
    shipping_address,
    payment_type,
  } = req.body;

  const t = await sequelize.transaction();

  try {
    if (!customer_id || !products?.length || !grandTotal) {
      throw new Error("Missing required fields in order request");
    }

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const customOrderId = `ORD-${dateStr}-${randomNum}`;

    const order = await Order.create({
      custom_order_id: customOrderId,
      customer_id,
      company_id: req.user.company_id,
      shipping,
      discount,
      subtotal,
      sgst: taxes?.sgst || 0,
      cgst: taxes?.cgst || 0,
      igst: taxes?.igst || 0,
      grand_total: grandTotal,
      shipping_address,
      payment_type,
      payment_status: "Pending",
    }, { transaction: t });

    for (const item of products) {
      //  Create order item
      await OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        remarks: item.remarks || null,
      }, { transaction: t });

      //  Get current stock: stock-in - stock-out
      const stockIn = await TrackProductStock.sum('quantity_changed', {
        where: {
          product_id: item.product_id,
          store_id: item.store_id,
          status_in_out: 1,
        },
        transaction: t,
      });

      const stockOut = await TrackProductStock.sum('quantity_changed', {
        where: {
          product_id: item.product_id,
          store_id: item.store_id,
          status_in_out: 0,
        },
        transaction: t,
      });

      const currentStock = (stockIn || 0) - (stockOut || 0);
       const chkSettings = await CompanyManagementModel.findOne({
            where: {
                id: req.user.company_id
            }
        });
      if (chkSettings && chkSettings.low_stock_order !== 1) {
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for product ID ${item.product_id} in store ${item.store_id}`);
      }
    }

      //  Fetch product details
      const productData = await Product.findByPk(item.product_id);
      if (!productData) {
        throw new Error(`Product ID ${item.product_id} not found`);
      }

      //  Generate reference and barcode
      const generatedReferenceNumber = `INV${Math.floor(1000000 + Math.random() * 9000000)}`;
      const generatedBarcode = Math.floor(1e15 + Math.random() * 9e15).toString();

      const updatedQty = currentStock - item.quantity;

      // Log deduction
      await TrackProductStock.create({
        product_id: item.product_id,
        store_id: item.store_id,
        quantity_changed: item.quantity,
        final_quantity: updatedQty,
        adjustmentType: 'Deduction POS',
        status_in_out: 0,
        comment: `POS Order #${customOrderId}`,
        reference_number: generatedReferenceNumber,
        barcode_number: generatedBarcode,
        item_name: productData.product_name,
        default_price: productData.product_price,
        item_unit: productData.unit || null,
        user_id: req.user?.id || null,
        company_id: req.user?.company_id || null,
      }, { transaction: t });
    }

    const customer = await Customer.findByPk(customer_id);

    if (payment_type === "online") {
      const gateway = await PaymentGateway.findOne({
        where: {
          gatewayname: 'razorpay',
          company_id: req.user.company_id,
        },
        attributes: ['keyid', 'keysecret'],
      });

      if (!gateway) throw new Error('Razorpay gateway not configured.');

      const razorpay = new Razorpay({
        key_id: gateway.keyid,
        key_secret: gateway.keysecret,
      });

      const payment = await razorpay.orders.create({
        amount: Math.round(grandTotal * 100),
        currency: "INR",
        receipt: `receipt_order_${customOrderId}`,
        payment_capture: 1,
      });

      if (customer?.email) {
        await sendMail(
          customer.email,
          `Order Confirmation - ${customOrderId}`,
          `
            <h2>Thank you for your order, ${customer.name}!</h2>
            <p>Your order <strong>${customOrderId}</strong> has been placed successfully.</p>
            <p><strong>Amount:</strong> ₹${grandTotal}</p>
            <p><strong>Payment Status:</strong> Pending</p>
            <p><strong>Shipping Address:</strong> ${shipping_address}</p>
            <br/>
            <p>- Growthh</p>
          `
        );
      }

      await t.commit();

      return res.status(200).json({
        orderId: customOrderId,
        razorpayOrderId: payment.id,
        key_id: gateway.keyid,
      });
    }

    // Offline flow
    if (customer?.email) {
      await sendMail(
        customer.email,
        `Order Confirmation - ${customOrderId}`,
        `
          <h2>Thank you for your order, ${customer.name}!</h2>
          <p>Your order <strong>${customOrderId}</strong> has been placed successfully.</p>
          <p><strong>Amount:</strong> ₹${grandTotal}</p>
          <p><strong>Payment Type:</strong> ${payment_type}</p>
          <p><strong>Shipping Address:</strong> ${shipping_address}</p>
          <br/>
          <p>- Growthh</p>
        `
      );
    }

    await t.commit();

    return res.status(200).json({
      message: "Order placed successfully via offline payment.",
      orderId: customOrderId,
      redirectUrl: `/pos/thank-you?order_id=${customOrderId}`,
    });

  } catch (err) {
    await t.rollback();
    console.error("Order placement failed:", err);
    return res.status(500).json({
      message: "Order placement failed",
      error: err.message,
    });
  }
};


exports.getOrderDetails = async (req, res) => {
  const { order_id } = req.params;

  try {
    console.log("➡️  Looking for order_id:", order_id);

    // Fetch order and customer info
    const orderRows = await sequelize.query(
      `
      SELECT 
        o.custom_order_id,
        o.payment_id,
        o.payment_status,
        o.payment_type,
        o.shipping_address,
        o.subtotal,
        o.sgst,
        o.cgst,
        o.igst,
        o.discount,
        o.shipping,
        o.grand_total,
        o.created_at,
        c.name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        c.address AS customer_address,
        c.city,
        c.state,
        c.country,
        c.zip
      FROM orders o
      JOIN customer c ON c.id = o.customer_id
      WHERE LOWER(o.custom_order_id) = LOWER(:order_id)
      LIMIT 1
      `,
      {
        replacements: { order_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const order = orderRows[0];

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Fetch ordered products
    const products = await sequelize.query(
      `
      SELECT 
        oi.product_id,
        p.product_name,
        p.product_code,
        p.product_price,
        p.sku_description,
        p.attachment_file,
        oi.quantity,
        oi.price AS ordered_price,
        oi.remarks
      FROM order_items oi
      JOIN product p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE LOWER(o.custom_order_id) = LOWER(:order_id)
      `,
      {
        replacements: { order_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return res.status(200).json({
      data: {
        order,
        products,
      },
    });
  } catch (err) {
    console.error(" Failed to fetch order:", err);
    return res.status(500).json({
      message: "Failed to fetch order",
      error: err.message,
    });
  }
};

exports.getOrderItemWiseDetails = async (req, res) => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        o.*, -- all order fields
        c.name AS customer_name,
        c.phone AS customer_phone,

        oi.id AS order_item_id,
        oi.product_id,
        oi.quantity,
        oi.price,
        oi.remarks,
        oi.status AS item_status,

        p.product_name,
        p.product_code,
        p.attachment_file AS product_image,

        (oi.quantity * oi.price) AS item_total

      FROM orders o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id 
      LEFT JOIN product p ON oi.product_id = p.id
      ORDER BY o.created_at DESC;
    `);

    res.json(results);
  } catch (error) {
    console.error("Error fetching full order details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};





exports.markOrderItemDelivered = async (req, res) => {
  try {
    const { order_item_id, order_id } = req.body; 
    const companyId = req.user.company_id;

    //  Find the OrderItem by item ID
    const orderItem = await OrderItem.findOne({
      where: { id: order_item_id }
    });

    if (!orderItem) {
      return res.status(404).json({ message: "Order item not found." });
    }

    //  Validate order_id exists
    if (!order_id) {
      return res.status(400).json({ message: "Missing order ID." });
    }

    // Fetch the parent Order (by ID & company)
    const order = await Order.findOne({
      where: {
        id: order_id,
        company_id: companyId
      }
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found or not authorized." });
    }

    //  Update the OrderItem's status to Delivered (status = 1)
    orderItem.status = 1;
    await orderItem.save();

    //  If Order is not already paid online, update the order payment status to "Paid"
    if (!(order.payment_status === "Paid" && order.payment_type === "Online")) {
      order.payment_status = "Paid";
      await order.save();
    }

    //  Fetch customer details from Order and send email notification
    const customer = await Customer.findOne({
      where: { id: order.customer_id }
    });

    await sendOrderStatusMail({
      customer,
      customOrderId: order.custom_order_id,
      statusLabel: 'Delivered'
    });

    return res.status(200).json({
      message: "Order item marked as delivered and order updated accordingly."
    });

  } catch (err) {
    console.error("Delivery update failed:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.cancelOrderItem = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { order_item_id } = req.body;
    const companyId = req.user.company_id;

    
    const orderItem = await OrderItem.findOne({ where: { id: order_item_id }, transaction: t });
    if (!orderItem) {
      return res.status(404).json({ message: "Order item not found." });
    }


    const order = await Order.findOne({
      where: { id: orderItem.order_id, company_id: companyId },
      transaction: t
    });
    if (!order) {
      return res.status(403).json({ message: "Unauthorized or order not found." });
    }

    const productData = await Product.findByPk(orderItem.product_id, { transaction: t });
    if (!productData) {
      throw new Error(`Product ID ${orderItem.product_id} not found`);
    }
    const storeId = productData.store_id;
    if (!storeId) {
      throw new Error(`Product ID ${orderItem.product_id} has no store_id set`);
    }

 
    const stockIn = await TrackProductStock.sum('quantity_changed', {
      where: {
        product_id: orderItem.product_id,
        store_id: storeId,
        status_in_out: 1
      },
      transaction: t
    });

    const stockOut = await TrackProductStock.sum('quantity_changed', {
      where: {
        product_id: orderItem.product_id,
        store_id: storeId,
        status_in_out: 0
      },
      transaction: t
    });

    const currentStock = (stockIn || 0) - (stockOut || 0);

    

    const updatedQty = currentStock + orderItem.quantity;


    orderItem.status = 2; // Cancelled
    await orderItem.save({ transaction: t });

 
    const generatedReferenceNumber = `INV${Math.floor(1000000 + Math.random() * 9000000)}`;
    const generatedBarcode = Math.floor(1e15 + Math.random() * 9e15).toString();

    await TrackProductStock.create({
      product_id: orderItem.product_id,
      store_id: storeId,
      quantity_changed: orderItem.quantity,
      final_quantity: updatedQty,
      adjustmentType: 'Cancelled Item from POS',
      status_in_out: 1, // 1 = Stock In
      comment: `POS Order #${order.custom_order_id} Cancelled`,
      reference_number: generatedReferenceNumber,
      barcode_number: generatedBarcode,
      item_name: productData.product_name,
      default_price: productData.product_price,
      item_unit: productData.unit || null,
      user_id: req.user?.id || null,
      company_id: companyId
    }, { transaction: t });


    const customer = await Customer.findOne({
      where: { id: order.customer_id },
      transaction: t
    });

    if (customer?.email) {
      await sendOrderStatusMail({
        customer,
        customOrderId: order.custom_order_id,
        statusLabel: 'Cancelled'
      });
    }

    await t.commit();
    return res.status(200).json({ message: "Order item cancelled and stock updated successfully." });

  } catch (err) {
    await t.rollback();
    console.error("❌ Cancel failed:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


const sendOrderStatusMail = async ({ customer, customOrderId, statusLabel }) => {
  if (!customer?.email) return;

  const subject = `Order ${statusLabel} - ${customOrderId}`;
  const htmlBody = `
    <h2>Hi ${customer.name},</h2>
    <p>Your order <strong>${customOrderId}</strong> has been <strong>${statusLabel.toLowerCase()}</strong>.</p>
    <br/>
    <p>Thank you for shopping with us.</p>
    <p>- Growthh</p>
  `;

  await sendMail(customer.email, subject, htmlBody);
};


function generateProductRows(items) {
  return items.map(item => `
    <tr>
      <td>${item.product_name} <br/> Code: ${item.product_code}</td>
      <td style="text-align:center;">${item.quantity}</td>
      <td style="text-align:right;">${(item.price).toFixed(2)}</td>
      <td style="text-align:right;">${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');
}
function getStatusLabel(status) {
  if (status === 0) return 'Inprogress';
  if (status === 1) return 'Delivered';
  if (status === 2) return 'Cancelled';
  return 'Unknown';
}
// Fill the HTML template
// Generate product rows
function generateProductRows(items) {
  return items.map(item => `
    <tr>
      <td><b>${item.product_name || 'N/A'}</b> <br/> Code: ${item.product_code || 'N/A'}</td>
      <td style="text-align:center;">${getStatusLabel(item.status)}</td>
      <td style="text-align:center;">${item.quantity || 0}</td>
      <td style="text-align:right;">${(item.price || 0).toFixed(2)}</td>
      <td style="text-align:right;">${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
    </tr>
  `).join('');
}

// Fill HTML template with data
async function generateInvoiceHtml(order, items, customer, company) {
  const templatePath = path.join(__dirname, '../templates/posinvoice.html');
  let html = await fs.readFile(templatePath, 'utf8');
const total = parseFloat(order.grand_total || 0);
const whole = Math.floor(total);
const fraction = Math.round((total - whole) * 100);

let amountInWords = `${toWords(whole)} Rupees`;
if (fraction > 0) {
  amountInWords += ` and ${toWords(fraction)} Paise`;
}
amountInWords += ' Only';

  html = html.replace(/{{INVOICE_NUMBER}}/g, order.custom_order_id);
  html = html.replace(/{{ORDER_ID}}/g, order.custom_order_id);
  html = html.replace(/{{ORDER_DATE}}/g, new Date(order.created_at).toLocaleDateString());
  html = html.replace(/{{INVOICE_DATE}}/g, new Date(order.created_at).toLocaleDateString());

  html = html.replace(/{{BILLING_NAME}}/g, customer?.name || 'N/A');
  html = html.replace(/{{BILLING_ADDRESS_LINE1}}/g, order.shipping_address || '');
  html = html.replace(/{{BILLING_ADDRESS_LINE2}}/g, '');
  html = html.replace(/{{BILLING_PHONE}}/g, customer?.phone || '');

  html = html.replace(/{{SHIPPING_NAME}}/g, customer?.name || 'N/A');
  html = html.replace(/{{SHIPPING_ADDRESS_LINE1}}/g, order.shipping_address || '');
  html = html.replace(/{{SHIPPING_ADDRESS_LINE2}}/g, '');
  html = html.replace(/{{SHIPPING_PHONE}}/g, customer?.phone || '');

  html = html.replace(/{{PAYMENT_METHOD}}/g, order.payment_type || 'N/A');
  html = html.replace(/{{PAYMENT_STATUS}}/g, order.payment_status || 'N/A');

  html = html.replace(/{{SHIPPING}}/g, order.shipping?.toFixed(2) || '0.00');
  html = html.replace(/{{CGST}}/g, (order.cgst || 0).toFixed(2));
  html = html.replace(/{{SGST}}/g, (order.sgst || 0).toFixed(2));
  html = html.replace(/{{DISCOUNT}}/g, order.discount?.toFixed(2) || '0.00');
  html = html.replace(/{{GRAND_TOTAL}}/g, order.grand_total?.toFixed(2) || '0.00');

  html = html.replace(/{{PRODUCT_ROWS}}/g, generateProductRows(items));
html = html.replace(/{{COMPANY_NAME}}/g, company?.company_name || 'N/A');
html = html.replace(/{{COMPANY_ADDRESS}}/g, company?.address || 'N/A');
html = html.replace(/{{COMPANY_GSTIN}}/g, company?.gst || 'N/A');
html = html.replace(/{{COMPANY_PHONE}}/g, company?.company_phone || 'N/A');
html = html.replace(/{{AMOUNT_IN_WORDS}}/g, amountInWords);


  return html;
}

// Generate PDF from HTML
async function generatePdf(html, fileName) {
  try {
    const file = { content: html };
    const options = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      },
    };

    const outputDir = path.join(__dirname, '../invoices');
    const outputPath = path.join(outputDir, fileName);
    await fs.ensureDir(outputDir);

    const pdfBuffer = await htmlPdf.generatePdf(file, options); 
    await fs.writeFile(outputPath, pdfBuffer);                  

    return { status: true, data: outputPath };
  } catch (error) {
    console.error('PDF generation failed:', error);
    return { status: false, error: error.message };
  }
}



// Main controller
exports.downloadInvoice = async (req, res) => {
  try {
    const { order_item_id } = req.body;

    if (!order_item_id) {
      return res.status(400).json({ message: 'order_item_id is required' });
    }
 
    // Step 1: Get the item and order
    const selectedItem = await OrderItem.findOne({ where: { id: order_item_id } });
    if (!selectedItem) return res.status(404).json({ message: 'Order item not found' });

    const order_id = selectedItem.order_id;
    const order = await Order.findOne({ where: { id: order_id } });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const items = await OrderItem.findAll({ where: { order_id } });

    // Fetch product name/code from Product table
    for (const item of items) {
      const product = await Product.findByPk(item.product_id);
      item.product_name = product?.product_name || 'N/A';
      item.product_code = product?.product_code || 'N/A';
    }

    const customer = await Customer.findOne({ where: { id: order.customer_id } });
    const company = await CompanyManagementModel.findOne({ where: { id: order.company_id } });

    // Step 2: Generate invoice HTML and PDF
    const html = await generateInvoiceHtml(order, items, customer, company);
    const fileName = `invoice-${order.custom_order_id}.pdf`;
   const { status, data: pdfPath } = await generatePdf(html, fileName);

	 // const pdfPath = await generatePdf(html, fileName);

	  
    // Step 3: Email the invoice to customer
    if (customer?.email) {
      await sendMail(
        customer.email,
        `Invoice for Order #${order.custom_order_id}`,
        `
          <h2>Hello ${customer.name},</h2>
          <p>Thank you for your order. Please find attached your invoice.</p>
          <p><strong>Order:</strong> ${order.custom_order_id}</p>
          <p><strong>Total:</strong> ₹${order.grand_total?.toFixed(2)}</p>
          <p><strong>Payment Status:</strong> ${order.payment_status}</p>
          <br/>
          <p>- ${company?.name || 'Your Company'}</p>
        `,
        [
          {
            filename: fileName,
            path: pdfPath,
            contentType: 'application/pdf'
          }
        ]
      );
    }

    // Step 4: Send PDF for download
    return res.download(pdfPath, fileName);

  } catch (error) {
    console.error('Invoice PDF generation failed:', error);
    return res.status(500).json({ message: 'Server error', error: error });
  }
};

exports.getCancelledOrders = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const cancelledItems = await OrderItem.findAll({
      where: { status: 2 },
      include: [
        {
          model: Order,
          as: 'order',
          where: { company_id: companyId },
          include: [
            { model: Customer, as: 'customer' }
          ]
        },
        { model: Product, as: 'product' }
      ]
    });

    return res.status(200).json(cancelledItems);
  } catch (err) {
    console.error('❌ Failed to fetch cancelled orders:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};


  exports.getMonthlyOrderSummary = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // ===== CURRENT MONTH =====
    const currentMonthOrders = await Order.findAll({
      attributes: ["id"],
      where: {
        company_id: companyId,
        created_at: {
          [Op.between]: [currentMonthStart, currentMonthEnd],
        },
      },
    });
    const currentOrderIds = currentMonthOrders.map(o => o.id);

    const currentSummary = await OrderItem.findOne({
      attributes: [
        [fn("SUM", col("quantity")), "total_quantity"],
        [fn("SUM", col("price")), "total_order_amount"]
      ],
      where: {
        order_id: {
          [Op.in]: currentOrderIds,
        },
      },
      raw: true,
    });

    const currentTotal = parseFloat(currentSummary?.total_order_amount || 0);
    const currentQty = parseInt(currentSummary?.total_quantity || 0);

    // ===== LAST MONTH =====
    const lastMonthOrders = await Order.findAll({
      attributes: ["id"],
      where: {
        company_id: companyId,
        created_at: {
          [Op.between]: [lastMonthStart, lastMonthEnd],
        },
      },
    });
    const lastOrderIds = lastMonthOrders.map(o => o.id);

    const lastSummary = await OrderItem.findOne({
      attributes: [[fn("SUM", col("price")), "total_order_amount"]],
      where: {
        order_id: {
          [Op.in]: lastOrderIds,
        },
      },
      raw: true,
    });

    const lastTotal = parseFloat(lastSummary?.total_order_amount || 0);

    // ===== PERCENTAGE INCREASE =====
    let percentageIncrease = 0;
    if (lastTotal > 0) {
      percentageIncrease = ((currentTotal - lastTotal) / lastTotal) * 100;
    } else if (currentTotal > 0) {
      percentageIncrease = 100;
    }

    res.status(200).json({
      total_quantity: currentQty,
      total_order_amount: currentTotal,
      last_month_order_amount: lastTotal,
      sales_increase_percentage: parseFloat(percentageIncrease.toFixed(2)),
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Failed to get order summary", error: error.message });
  }
};

exports.getCustomerCountByCompany = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const totalCustomers = await Customer.count({
      where: {
        company_id: companyId,
        status: 1, // only active customers
      },
    });

    res.status(200).json({ totalCustomers });
  } catch (error) {
    console.error("Error fetching customer count:", error);
    res.status(500).json({
      message: "Failed to fetch customer count",
      error: error.message,
    });
  }
};

exports.getOrderStatusSummary = async (req, res) => {
    try {
        const results = await OrderItem.findAll({
            include: [
                {
                    model: Order,
                    as: 'order',
                    attributes: []
                }
            ],
            attributes: [
                [fn('MONTH', col('order.created_at')), 'month'],
                'status',
                [fn('COUNT', col('OrderItem.id')), 'count']
            ],
            group: ['month', 'status'],
            raw: true
        });

        res.status(200).json(results);
    } catch (error) {
        console.error("Error generating order status summary:", error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
};

exports.getOrderItemReport = async (req, res) => {
    try {
        const results = await OrderItem.findAll({
            include: [
                {
                    model: Order,
                    as: 'order',
                    attributes: ['created_at', 'custom_order_id', 'payment_type', 'payment_status'],
                    include: [
                        {
                            model: Customer,
                            as: 'customer',
                            attributes: ['name']
                        }
                    ]
                },
                {
                    model: Product,
                    as: 'product',
                    attributes: ['product_name', 'product_code']
                }
            ]
        });

        const formatted = results.map(item => ({
            customerName: item.order.customer?.name || '-',
            item: item.product?.product_name || '-',
            code: item.product?.product_code || '-',
            purchaseDate: item.order?.created_at?.toISOString().split('T')[0],
            quantity: item.quantity,
            amount: item.price,
            paymentStatus: item.order?.payment_status || '-',
            transactionId: item.order?.custom_order_id,
            transactionDetails: item.order?.payment_type || '-',
            orderNo: item.order?.custom_order_id,
            orderDate: item.order?.created_at?.toISOString().split('T')[0],
        }));

        res.json(formatted);
    } catch (error) {
        console.error("Failed to fetch report:", error);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
};



exports.AddSalesOrderFromPOS = async (orderId, user) => {
  const transaction = await sequelize.transaction();
  try {
    const referenceNumber = await generateUniqueReferenceNumber();

    const order = await Order.findOne({ where: { id: orderId }, transaction });
    const orderItems = await OrderItem.findAll({ where: { order_id: orderId }, transaction });
    const customer = await Customer.findByPk(order.customer_id, { transaction });
    if (!order || !orderItems.length) throw new Error('Invalid POS order data');

    const purchase = await Purchase.create({
      reference_number: "S" + referenceNumber,
      customer_id: order.customer_id,
      customer_reference: order.custom_order_id,
      expiration: null,
      dalivery_date: null,
      buyer: user.name,
      source_document: "POS",
      payment_terms: null,
      total_amount: order.grand_total,
      untaxed_amount: order.subtotal,
      is_parent: 0,
      is_parent_id: null,
      user_id: user.id,
      company_id: user.company_id,
      mailsend_status: "0",
    }, { transaction });

    for (const item of orderItems) {
      await PurchaseProduct.create({
        sales_id: purchase.id,
        product_id: item.product_id,
        description: "",
        qty: item.quantity,
        unit_price: item.price,
        tax: 0,
        taxExcl: item.price * item.quantity,
        taxIncl: item.price * item.quantity,
        vendor_id: null,
        taxAmount: 0,
        user_id: user.id,
        company_id: user.company_id,
      }, { transaction });
    }

    await transaction.commit();
    return purchase;
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Failed to generate sales order from POS:", err);
    return null;
  }
};
