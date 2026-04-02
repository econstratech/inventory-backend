const { Sequelize, Op, QueryTypes, fn, col } = require("sequelize");
const sequelize = require("../database/db-connection");

const htmlPdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');
const numberToWords = require('number-to-words');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');
const moment = require("moment");

const {
  Product, 
  Vendor,
  Purchase,
  PurchaseProduct,
  Remarks,
  Followup,
  AdvancePayment,
  ProductStockEntry,
  ReceiveProductBatch,
  Recv,
  RecvProduct,
  Company
} = require("../model");
// const puppeteer = require('puppeteer');

// const wkhtmltopdf = require('wkhtmltopdf');

const generateUniqueReferenceNumber = require("../utils/generateReferenceNumber");



const { TrackProductStock } = require("../model");
const Bill = require("../model/Bill");
const BillProduct = require("../model/BillProduct");
const Payment = require("../model/Payment");
// const { required } = require("joi");
// const { sendMail, GreenApiWhatsappNotification, MaytapiWhatsappNotification, MaytapiWhatsappNotificationmedia } = require("../utils/Helper");

// Adjust the path as necessary

const { GeneralSettings } = require("../model/CompanyModel");
// const Warehouse = require("../model/Warehouse");

const CommonHelper = require("../helpers/commonHelper");

/**
 * Create a new purchase with one or more products
 * @param {*} req 
 * @param {*} res 
 */
exports.AddPurchase = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const referenceNumber = await generateUniqueReferenceNumber();
    let totalPurchaseAmount = 0;

    const purchaseData = await Purchase.create(
      {
        user_id: req.user.id,
        company_id: req.user.company_id,
        reference_number: "P" + referenceNumber,
        vendor_id: req.body.vendor_id,
        vendor_reference: req.body.vendor_reference,
        // order_dateline: req.body.order_dateline,
        expected_arrival: req.body.expected_arrival,
        buyer: req.body.buyer ?? null,
        // source_document: req.body.source_document,
        // payment_terms: req.body.payment_terms,
        total_amount: req.body.total_amount,
        untaxed_amount: req.body.untaxed_amount,
        is_parent: req.body.is_parent,
        is_parent_id: req.body.is_parent_id,
        warehouse_id: req.body.warehouse_id ?? null,
        mailsend_status: req.body.mailsend_status || '0',
        sale_id: req.body.sales_quotation_id || null,
        status: req.body.send_to_management ? 3 : req.body.send_to_vendor ? 5 : 2
      },
      { transaction }
    );

    const productPromises = [];
    const purchasedProducts = [];

    if (req.body.products && req.body.products.length > 0) {
      req.body.products.forEach((product) => {
        // Calculate product total including tax
        const productTotal = product.qty * product.unit_price;
        const taxAmount = (product.tax / 100) * productTotal;
        const totalWithTax = productTotal + taxAmount;
        totalPurchaseAmount += totalWithTax;

        const purchaseProductData = {
          purchase_id: purchaseData.id,
          product_id: product.product_id,
          product_variant_id: product.product_variant_id,
          description: product.description,
          qty: product.qty,
          unit_price: product.unit_price,
          tax: product.tax,
          taxExcl: productTotal,
          taxIncl: totalWithTax, // Store total including tax
          total_amount: totalWithTax,
          vendor_id: req.body.vendor_id,
          tax_amount: taxAmount,
          user_id: req.user.id,
          company_id: req.user.company_id,
        }
        purchasedProducts.push(purchaseProductData);


        // Create PurchaseProduct record
        productPromises.push(
          PurchaseProduct.create(purchaseProductData, { transaction })
        );
      });

      // Update the purchase record with total amount
      productPromises.push(
        Purchase.update({
          total_amount: totalPurchaseAmount,
        },
        { where: { id: purchaseData.id }, transaction }
      ));
      // Create all purchase products and update the purchase record with total amount
      await Promise.all(productPromises);
    }

    // If send_to_vendor is true, add to inventory at transaction
    if (req.body.send_to_vendor) {
      await addToInventoryAtTransaction(purchasedProducts, purchaseData.warehouse_id, transaction);
    }

    // Commit the transaction
    await transaction.commit();
    // Fetch the updated purchase data to respond with
    // const updatedPurchase = await Purchase.findByPk(purchaseData.id);

    // Return the updated purchase data including total amount to the client
    return res.status(201).json({
      status: true,
      message: "Purchase created successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", error);
    res.status(500).json({
      error: "An error occurred while creating the purchase and products",
    });
  }
};

exports.AddPurchaseadditi = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const referenceNumber = await generateUniqueReferenceNumber();

    const purchaseData = await Purchase.create(
      {
        reference_number: referenceNumber,
        vendor_id: req.body.vendor_id,
        vendor_reference: req.body.vendor_reference,
        order_dateline: req.body.order_dateline,
        expected_arrival: req.body.expected_arrival,
        buyer: req.body.buyer,
        source_document: req.body.source_document,
        payment_terms: req.body.payment_terms,
        total_amount: req.body.total_amount,
        untaxed_amount: req.body.untaxed_amount,
        is_parent: req.body.is_parent,
        is_parent_id: req.body.is_parent_id,
        parent_recd_id: req.body.parent_recd_id,
        user_id: req.user.id,
        company_id: req.user.company_id,
        mailsend_status: req.body.mailsend_status || '0'
      },
      { transaction }
    );

    if (req.body.products && req.body.products.length > 0) {

      const productPromises = req.body.products.map(async (product) => {
        // Calculate product total including tax
        const productTotal = product.qty * product.unit_price;
        const taxAmount = (product.tax / 100) * productTotal;
        const totalWithTax = productTotal + taxAmount;

        // Create PurchaseProduct record
        await PurchaseProduct.create(
          {
            purchase_id: purchaseData.id,
            product_id: product.product_id,
            description: product.description,
            qty: product.qty,
            unit_price: product.unit_price,
            tax: product.tax,
            taxExcl: productTotal,
            taxIncl: totalWithTax,
            taxAmount: product.taxAmount,
            vendor_id: req.body.vendor_id,
            user_id: req.user.id,
            company_id: req.user.company_id,
          },
          { transaction }
        );
      });

      await Promise.all(productPromises);

      // Calculate total purchase amount including tax
      const totalPurchaseAmount = req.body.products.reduce((total, product) => {
        const productTotal = product.qty * product.unit_price;
        const taxAmount = (product.tax / 100) * productTotal;
        const totalWithTax = productTotal + taxAmount;
        return total + totalWithTax;
      }, 0);

      // Update the purchase record with total amount
      await Purchase.update(
        {
          total_amount: totalPurchaseAmount,
        },
        {
          where: { id: purchaseData.id },
          transaction,
        }
      );

      // Update PurchaseProduct with total amount (if needed)
      await PurchaseProduct.update(
        {
          total_amount: totalPurchaseAmount,
        },
        {
          where: { purchase_id: purchaseData.id },
          transaction,
        }
      );
    }

    await transaction.commit();

    // Fetch the updated purchase data to respond with
    const updatedPurchase = await Purchase.findByPk(purchaseData.id);

    // Return the updated purchase data including total amount to the client
    res.status(201).json({
      ...updatedPurchase.toJSON(),
      total_amount: updatedPurchase.total_amount,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", error);
    res.status(500).json({
      error: "An error occurred while creating the purchase and products",
    });
  }
};

exports.UpdatePurchase = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Purchase ID is required" });
  }

  let transaction = null;

  try {
    // Validate the request body
    if (
      !req.body.vendor_id ||
      !req.body.products ||
      req.body.products.length === 0
    ) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    // Verify the purchase exists before updating
    const purchaseExists = await Purchase.findOne({
      attributes: ['id'],
      where: { id },
      raw: true,
    });

    // Throw error if the purchase is not found
    if (!purchaseExists) {
      return res.status(404).json({ status: false, message: "Purchase not found" });
    }

    // Start a new transaction
    transaction = await sequelize.transaction();
    // Update the purchase record

    if (req.body.expected_arrival && req.body.total_amount && req.body.untaxed_amount) {
      await Purchase.update(
        {
          // vendor_id: req.body.vendor_id,
          // vendor_reference: req.body.vendor_reference,
          // order_dateline: req.body.order_dateline,
          expected_arrival: req.body.expected_arrival,
          total_amount: req.body.total_amount,
          untaxed_amount: req.body.untaxed_amount,
          warehouse_id: req.body.warehouse_id ?? null,
          sale_id: req.body.sale_id ?? null,
        },
        {
          where: { id },
          transaction,
        }
      );
    }


    // Delete existing PurchaseProducts
    // await PurchaseProduct.destroy({
    //   where: { purchase_id: id },
    //   transaction,
    // });

    let totalPurchaseAmount = 0;

    // Create new PurchaseProducts
    const productPromises = req.body.products.map(async (product) => {
      const qty = parseFloat(product.qty) || 0;
      const unitPrice = parseFloat(product.unit_price) || 0;
      const taxRate = parseFloat(product.tax) || 0;

      const productTotal = qty * unitPrice;
      const taxAmount = (taxRate / 100) * productTotal;
      const totalWithTax = productTotal + taxAmount;

      totalPurchaseAmount += totalWithTax;

      await PurchaseProduct.update(
        {
          // purchase_id: id,
          product_id: product.product_id,
          product_variant_id: product.product_variant_id || null,
          description: product.description,
          qty,
          unit_price: unitPrice,
          tax: taxRate,
          taxExcl: productTotal,
          tax_amount: taxAmount,
          taxIncl: totalWithTax,
          vendor_id: product.vendor_id,
          user_id: req.user.id,
          // company_id: req.user.company_id,
        },
        { 
          where: { id: product.id },
          transaction,
          validate: true
        }
      );
    });

    await Promise.all(productPromises);

    // Update total amount in Purchase
    await Purchase.update(
      {
        total_amount: totalPurchaseAmount,
      },
      {
        where: { id },
        transaction,
      }
    );

    // Commit the transaction
    await transaction.commit();

    // Return the success response
    return res.status(200).json({ status: true, message: "Purchase order has been updated successfully" });

  } catch (error) {
    // Rollback the transaction if it exists
    if(transaction) {
      await transaction.rollback();
    }
    console.error("Transaction rolled back due to error:", error);
    res.status(500).json({
      error: "An error occurred while updating the purchase and products",
    });
  }
};



exports.GetAllPurchase = async (req, res) => {
  try {
    const products = await Purchase.findAll({
      where: {
        company_id: req.user.company_id,

        status: {
          [Op.and]: [
            { [Op.ne]: 0 },
            {
              [Op.or]: [
                { [Op.lt]: 5 },
              ]
            }
          ]
        }
      },
      include: [
        {
          model: PurchaseProduct,
          as: "products",
        },
        {
          model: Vendor,
          as: "vendor",
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching the products" });
  }
};

/**
 * Get all purchase records with RFQ status
 * @param {page} req 
 * @param {object} res - The response object
 * @param {number} req.query.page - The page number
 * @param {number} req.query.limit - The number of records per page
 * @returns 
 */
exports.GetAllPurchaseRfqStatus = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = null, 
      reference_number = null, 
      expected_arrival_start = null, 
      expected_arrival_end = null 
    } = req.query;
    // validate page and limit
    if (page < 1) {
      return res.status(400).json({ error: "Page number must be greater than 0" });
    }
    if (limit < 1) {
      return res.status(400).json({ error: "Limit must be greater than 0" });
    }

    // validate expected arrival start and end
    if (expected_arrival_start && expected_arrival_end) {
      if (expected_arrival_start > expected_arrival_end) {
        return res.status(400).json({ error: "Expected arrival start date must be before expected arrival end date" });
      }
    }

    // Set offset to calculate the number of records to skip
    const offset = (page - 1) * limit;

    // where condition
    const whereCondition = {
      company_id: req.user.company_id,
      status: {
        [Op.in]: [2, 3, 4, 5],
      }
    };

    // add status condition
    if (status) {
      whereCondition.status = {
        [Op.eq]: parseInt(status, 10),
      };
    }

    // add reference number condition
    if (reference_number) {
      whereCondition.reference_number = {
        [Op.eq]: reference_number,
      };
    }

    // add expected arrival start and end condition
    if (expected_arrival_start && expected_arrival_end) {
      whereCondition.expected_arrival = {
        [Op.between]: [expected_arrival_start, expected_arrival_end],
      };
    }

    // Get all purchase records with pagination
    const purchaseRecords = await Purchase.findAndCountAll({
      attributes: [
        'id',
        'reference_number',
        'vendor_id',
        'vendor_reference',
        'expected_arrival',
        'total_amount',
        'is_parent',
        'warehouse_id',
        'status',
        'created_at',
        'updated_at',
      ],
      where: whereCondition,
      distinct: true,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit, 10),
      offset,
      include: [
        {
          association: 'products',
        },
        {
          association: 'vendor',
          attributes: ['id', 'vendor_name'],
        },
        {
          association: 'warehouse',
          attributes: ['id', 'name'],
        },
        {
          association: 'createdBy',
          attributes: ['id', 'name'],
        },
      ],
    });

    // Get paginated data
    const paginatedPurchaseData = CommonHelper.paginate(purchaseRecords, page, limit);

    return res.status(200).json({ 
      status: true, 
      message: "Purchase records fetched successfully", 
      data: paginatedPurchaseData 
    });
  } catch (error) {
    console.error("Error fetching purchase records:", error);
    return res.status(500).json({ 
      status: false, 
      message: "An error occurred while fetching the purchase records", 
      error: error.message 
    });
  }
};

exports.GetAllPurchasereviewdone = async (req, res) => {
  try {
    const products = await Purchase.findAll({
      where: {
        company_id: req.user.company_id,

        status: {
          [Op.and]: [
            { [Op.ne]: 0 },
            {
              [Op.or]: [
                { [Op.eq]: 4 },

              ]
            }
          ]
        }
      },
      include: [
        {
          model: PurchaseProduct,
          as: "products",
        },
        {
          model: Vendor,
          as: "vendor",
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching the products" });
  }
};
exports.GetAllPurchaseBilled = async (req, res) => {
  try {
    const products = await Purchase.findAll({
      where: {
        company_id: req.user.company_id,

        status: {
          [Op.and]: [
            { [Op.ne]: 0 },
            {
              [Op.or]: [
                { [Op.eq]: 6 },

              ]
            }
          ]
        }
      },
      include: [
        {
          model: PurchaseProduct,
          as: "products",
        },
        {
          model: Vendor,
          as: "vendor",
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching the products" });
  }
};

exports.GetAllPurchaseRfqReview = async (req, res) => {
  try {
    const products = await Purchase.findAll({
      where: {
        company_id: req.user.company_id,

        status: {
          [Op.and]: [
            { [Op.ne]: 0 },
            {
              [Op.or]: [
                { [Op.eq]: 3 },

              ]
            }
          ]
        }
      },
      include: [
        {
          model: PurchaseProduct,
          as: "products",
        },
        {
          model: Vendor,
          as: "vendor",
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching the products" });
  }
};
//show all reject
exports.GetAllPurchaseReject = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = null, 
      reference_number = null, 
      expected_arrival_start = null, 
      expected_arrival_end = null 
    } = req.query;
    // validate page and limit
    if (page < 1) {
      return res.status(400).json({ error: "Page number must be greater than 0" });
    }
    if (limit < 1) {
      return res.status(400).json({ error: "Limit must be greater than 0" });
    }

    // validate expected arrival start and end
    if (expected_arrival_start && expected_arrival_end) {
      if (expected_arrival_start > expected_arrival_end) {
        return res.status(400).json({ error: "Expected arrival start date must be before expected arrival end date" });
      }
    }

    // Set offset to calculate the number of records to skip
    const offset = (page - 1) * limit;

    // where condition
    const whereCondition = {
      company_id: req.user.company_id,
      status: {
        [Op.in]: [8],
      }
    };

    // add status condition
    if (status) {
      whereCondition.status = {
        [Op.eq]: parseInt(status, 10),
      };
    }

    // add reference number condition
    if (reference_number) {
      whereCondition.reference_number = {
        [Op.like]: `%${reference_number}%`,
      };
    }

    // add expected arrival start and end condition
    if (expected_arrival_start && expected_arrival_end) {
      whereCondition.expected_arrival = {
        [Op.between]: [expected_arrival_start, expected_arrival_end],
      };
    }

    // Get all purchase records with pagination
    const purchaseRecords = await Purchase.findAndCountAll({
      attributes: [
        'id',
        'reference_number',
        'vendor_id',
        'vendor_reference',
        'expected_arrival',
        'total_amount',
        'is_parent',
        'warehouse_id',
        'status',
        'created_at',
        'updated_at',
      ],
      where: whereCondition,
      distinct: true,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit, 10),
      offset,
      include: [
        {
          association: 'products',
        },
        {
          association: 'vendor',
          attributes: ['id', 'vendor_name'],
        },
        {
          association: 'warehouse',
          attributes: ['id', 'name'],
        },
        {
          association: 'createdBy',
          attributes: ['id', 'name'],
        },
      ],
    });

    // Get paginated data
    const paginatedPurchaseData = CommonHelper.paginate(purchaseRecords, page, limit);

    res.status(200).json({
      status: true,
      message: "List of all rejected purchase records fetched successfully",
      data: paginatedPurchaseData,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      status: false,
      message: error.message || "An error occurred while fetching the rejected purchase records",
    });
  }
};

exports.getPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;

    const purchaseData = await Purchase.findOne({
      attributes: [
        'id',
        'reference_number',
        'total_amount',
        'status',
        'vendor_id',
        'sale_id',
        'expected_arrival',
        'warehouse_id',
        'created_at',
      ],
      where: { id, company_id },
      include: [
        {
          association: "recv",
          attributes: ['id', 'bill_number', 'bill_reference', 'bill_date', 'untaxed_amount', 'total_amount'],
          include: [
            {
              association: "receivedProducts",
              attributes: ['id', 'product_id', 'qty', 'unit_price', 'tax', 'taxExcl', 'taxIncl'],
              include: [
                {
                  association: "product",
                  attributes: ['id', 'product_code', 'product_name', 'sku_product'],
                }
              ],
            },
            {
              association: "receivedBy",
              attributes: ['id', 'name'],
            }
          ]
        },
        {
          association: "products",
          attributes: ['id', 'product_id', 'qty', 'unit_price', 'tax', 'tax_amount', 'taxExcl', 'taxIncl'],
          include: [
            {
              association: "productVariant",
              attributes: ['id', 'weight_per_unit', 'price_per_unit'],
              include: [
                {
                  association: 'masterUOM',
                  attributes: ['name', 'label'],
                }
              ]
            },
            { 
              association: 'batches', 
              attributes: ['id', 'batch_no', 'manufacture_date', 'expiry_date', 'quantity','returned_quantity'],
              include: [
                {
                  association: 'productVariant',
                  attributes: ['id', 'weight_per_unit', 'price_per_unit'],
                  include: [
                    {
                      association: 'masterUOM',
                      attributes: ['name', 'label'],
                    }
                  ]
                }
              ]
            },
            {
              association: "ProductsItem",
              attributes: [
                'id',
                'product_code',
                'product_name',
                'sku_product',
                'buffer_size',
                'is_batch_applicable'
              ],
              include: [
                { association: 'masterProductType', attributes: ['name'] },
                { association: 'masterBrand', attributes: ['name'] },
                { association: 'productCategory', attributes: ['title'] },
                {
                  association: 'productAttributeValues',
                  attributes: ['id', 'product_attribute_id', 'value'],
                  include: [
                    {
                      association: 'productAttribute',
                      attributes: ['id', 'name', 'is_required']
                    }
                  ]
                }, 
                {
                  association: 'productVariants',
                  attributes: ['id', 'weight_per_unit', 'price_per_unit'],
                  include: [
                    {
                      association: 'masterUOM',
                      attributes: ['name', 'label']
                    }
                  ]
                }
              ]
            }
          ]
        },
        { association: 'vendor', attributes: ['id', 'vendor_name', 'phone'] },
        { association: 'createdBy', attributes: ['name'] },
        // { model: AdvancePayment, as: "advance" },
        { association: 'warehouse', attributes: ['id', 'name'] }
      ]
    });

    if (!purchaseData) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    const finalData = purchaseData.toJSON();

    // Ensure recv is always an array (Purchase hasMany Recv)
    const recvList = Array.isArray(finalData.recv) ? finalData.recv : (finalData.recv ? [finalData.recv] : []);

    // Sum received quantity per product_id across all recv batches and their receivedProducts
    const receivedMap = {};
    for (const recv of recvList) {
      const receivedProducts = recv.receivedProducts || [];
      for (const rp of receivedProducts) {
        const pid = rp.product_id;
        receivedMap[pid] = (receivedMap[pid] || 0) + (Number(rp.qty) || 0);
      }
    }

    // Add received (total received qty) and available_quantity (product.qty - total received) to each product
    finalData.products = (finalData.products || []).map(product => {
      const totalReceived = receivedMap[product.product_id] || 0;
      const orderedQty = Number(product.qty) || 0;
      return {
        ...product,
        received: totalReceived,
        available_quantity: Math.max(0, orderedQty - totalReceived)
      };
    });

    return res.status(200).json(finalData);

  } catch (error) {
    console.error("Error fetching purchase:", error);
    return res.status(500).json({
      error: "An error occurred while fetching the purchase"
    });
  }
};

/**
 * Fetch a particular purchase order details by query params
 * Supported query params: id, reference_number, status
 * Example: /api/purchase/fetch-details?id=123 or /api/purchase/fetch-details?reference_number=PO-001&status=10
 */
exports.fetchPurchaseDetails = async (req, res) => {
  try {
    const { company_id } = req.user;
    const { id, reference_number, status } = req.query;

    if (!id && !reference_number && (status === undefined || status === null || status === "")) {
      return res.status(400).json({
        status: false,
        message: "At least one filter is required: id, reference_number, or status",
      });
    }

    const where = { company_id };
    if (id) where.id = Number(id);
    if (reference_number) where.reference_number = reference_number;
    if (status !== undefined && status !== null && status !== "") where.status = Number(status);

    // Get the purchase data
    const purchaseData = await Purchase.findOne({
      attributes: ['id', 'reference_number', 'total_amount', 'status', 'vendor_id', 'sale_id', 'expected_arrival', 'warehouse_id', 'created_at'],
      where,
      include: [
        {
          association: "receivedProducts",
          attributes: ["id", "product_id", "qty", "available_quantity", "product_variant_id", "warehouse_id", "received", "returned_quantity", "unit_price", "tax", "taxExcl", "taxIncl"],
          include: [
            {
              association: "product",
              attributes: ["id", "product_code", "product_name", "sku_product", "is_batch_applicable"],
            },
            {
              association: "batches",
              attributes: ["id", "batch_no", "manufacture_date", "expiry_date", "quantity", "returned_quantity", "available_quantity"],
            },
            {
              association: "productVariant",
              attributes: ["id", "weight_per_unit", "price_per_unit"],
              include: [
                {
                  association: "masterUOM",
                  attributes: ["name", "label"],
                }
              ]
            }
          ],
        },
      ],
    });

    return res.status(200).json({
      status: true,
      message: "Purchase details fetched successfully",
      data: purchaseData,
    });
  } catch (error) {
    console.error("Error fetching purchase details:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching purchase details",
      error: error.message,
    });
  }
};

exports.getPurchaseaddi = async (req, res) => {
  const { id, venid } = req.params;

  //   try {
  const purchaseData = await Purchase.findAll({
    attributes: [
      'id',
      'reference_number',
      'vendor_id',
      'vendor_reference',
      'total_amount',
      'untaxed_amount',
      'created_at',
      'updated_at',
    ],
    where: {
      parent_recd_id: id,
      is_parent_id: venid,
      company_id: req.user.company_id,
      status: { [Op.ne]: 0 },
    },
    include: [
      {
        association: 'products',
        include: [{ model: Product, as: "ProductsItem" }],
      },
      { association: 'vendor' },
      {
        association: 'createdBy',
        attributes: ['name'],
      }
    ],
  });

  if (!purchaseData) {
    return res.status(404).json({ error: "Purchase not found" });
  }

  res.status(200).json(purchaseData);
  //   } catch (error) {
  //     console.error("Error fetching purchase:", error);
  //     res
  //       .status(500)
  //       .json({ error: "An error occurred while fetching the purchase" });
  //   }
};
exports.getPurchasecompare = async (req, res) => {
  //   try {
  const purchaseData = await Purchase.findAll({
    where: {
      [Op.and]: [
        {
          [Op.or]: [{ id: req.params.id }, { parent_recd_id: req.params.id }],
        },
        { company_id: req.user.company_id },
        { user_id: req.user.id },
        { status: { [Op.ne]: 0 } },
      ],
    },
    include: [
      {
        association: 'products',
        where: { status: { [Op.ne]: 0 } },
        include: [
          {
            association: "productVariant",
            attributes: ['id', 'weight_per_unit', 'price_per_unit'],
            include: [
              {
                association: 'masterUOM',
                attributes: ['name', 'label'],
              }
            ]
          },
          { 
            association: "ProductsItem",
            attributes: [
              'id', 
              'product_name', 
              'sku_product', 
              'product_code',
              'is_batch_applicable',
            ],
            include: [
              {
                association: 'masterProductType',
                attributes: ['name'],
              },
              {
                association: 'masterBrand',
                attributes: ['name'],
              },
              {
                association: 'productCategory',
                attributes: ['title'],
              },
              {
                association: 'productVariants',
                attributes: ['id', 'weight_per_unit', 'price_per_unit'],
                include: [
                  {
                    association: 'masterUOM',
                    attributes: ['name', 'label'],
                  }
                ]
              },
              {
                association: 'productAttributeValues',
                attributes: ['id', 'product_attribute_id', 'value'],
                include: [
                  {
                    association: 'productAttribute',
                    attributes: ['id', 'name', 'is_required'],
                  }
                ]
              }
            ]
          }
        ],
      },
      {
        association: 'warehouse',
        attributes: ['id', 'name', 'address1', 'city'],
      },
      { 
        association: 'vendor',
        attributes: ['id', 'vendor_name'],
      },
      { 
        association: 'remarks',
        attributes: ['id', 'remarks'],
      },
    ],
  });

  if (!purchaseData) {
    return res.status(404).json({ error: "Purchase not found" });
  }

  res.status(200).json(purchaseData);
  //   } catch (error) {
  //     console.error("Error fetching purchase:", error);
  //     res
  //       .status(500)
  //       .json({ error: "An error occurred while fetching the purchase" });
  //   }
};

exports.getPurchasecompareManagment = async (req, res) => {
  try {
    const purchaseData = await Purchase.findAll({
      attributes: ['id', 'is_parent', 'status', 'total_amount', 'reference_number', 'expected_arrival'],
      where: {
        [Op.and]: [
          {
            [Op.or]: [{ id: req.params.id }, { parent_recd_id: req.params.id }],
          },
          { status: { [Op.ne]: 0 } },
        ],
      },
      include: [
        {
          association: 'products',
          where: { status: { [Op.ne]: 0 } },
          include: [
            {
              association: "productVariant",
              attributes: ['id', 'weight_per_unit', 'price_per_unit'],
              include: [
                {
                  association: 'masterUOM',
                  attributes: ['name', 'label'],
                }
              ]
            },
            { 
              association: "ProductsItem",
              attributes: [
                'id', 
                'product_name', 
                'sku_product', 
                'product_code',
                'is_batch_applicable',
              ],
              include: [
                {
                  association: 'masterProductType',
                  attributes: ['name'],
                },
                {
                  association: 'masterBrand',
                  attributes: ['name'],
                },
                {
                  association: 'productCategory',
                  attributes: ['title'],
                },
                {
                  association: 'productVariants',
                  attributes: ['id', 'weight_per_unit', 'price_per_unit'],
                  include: [
                    {
                      association: 'masterUOM',
                      attributes: ['name', 'label'],
                    }
                  ]
                },
                {
                  association: 'productAttributeValues',
                  attributes: ['id', 'product_attribute_id', 'value'],
                  include: [
                    {
                      association: 'productAttribute',
                      attributes: ['id', 'name', 'is_required'],
                    }
                  ]
                }
              ]
            }
          ],
        },
        {
          association: 'warehouse',
          attributes: ['id', 'name', 'address1', 'city'],
        },
        { 
          association: 'vendor',
          attributes: ['id', 'vendor_name'],
        },
        { 
          association: 'remarks',
          attributes: ['id', 'remarks'],
        },
      ],
    });

    if (!purchaseData) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    return res.status(200).json(purchaseData);
  } catch (error) {
    console.error("Error fetching purchase:", error);
    return res.status(500).json({ error: "An error occurred while fetching the purchase" });
  }
};


exports.StatusUpdate = async (req, res) => {
  const { id: purchaseId, sid } = req.params;
  let transaction = null;

  try {
    // Validate purchaseId
    if (!purchaseId || isNaN(purchaseId)) {
      return res.status(400).json({ error: "Invalid purchase ID" });
    }

    // Fetch the main purchase record
    const purchase = await Purchase.findOne({ 
      attributes: ['id', 'status', 'warehouse_id'],
      where: { id: purchaseId },
      include: [
        {
          association: 'products',
          attributes: ['id', 'product_id', 'product_variant_id', 'qty'],
        }
      ]
    });

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    // Fetch all related records
    const relatedPurchases = await Purchase.findAll({
      attributes: ['id', 'status'],
      where: { parent_recd_id: purchaseId, status: { [Op.ne]: 8 } },
      raw: true,
    });

    const relatedPurchaseIds = relatedPurchases.map(record => record.id);

    transaction = await sequelize.transaction();

    // Filter out records with status 8
    // const recordsToUpdate = relatedPurchases.filter(record => record.status !== 8);

    // if (purchase.status !== 8) {
    //   recordsToUpdate.push(purchase);
    // }

    // Update status of related purchases
    const promises = relatedPurchaseIds.map(recordId => {
      let updateFields = { status: sid };
      if (sid == 5) {
        updateFields.order_dateline = new Date();
      }
      return Purchase.update(updateFields, {
        where: { id: recordId },
        transaction,
      });
    });

    await Promise.all(promises);

    // Update status of parent purchase
    await Purchase.update({ status: sid }, {
      where: { id: purchaseId },
      transaction,
    });

    // If the status is 5, add to inventory at transaction
    if (sid == 5) {
      await addToInventoryAtTransaction(purchase.products, purchase.warehouse_id, transaction);
    }

    //sendMail('sumit.econstra@gmail.com', 'New Purchase Request for Approval', 'New Purchase Request for Approval');
    // MaytapiWhatsappNotification("919163220851", "New Purchase Request for Approval");

    await transaction.commit();

    return res.status(200).json({ message: "Purchase status updated successfully" });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error("Transaction rolled back due to error:", error);
    return res.status(500).json({
      error: "An error occurred while updating the purchase status",
    });
  }
};




exports.DeletePurchase = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const purchaseData = await Purchase.findOne({
      where: { id: req.params.id },
      include: [PurchaseProduct],
    });

    if (!purchaseData) {
      return res.status(404).json({ error: "Purchase not found" });
    }
    if (purchaseData.is_parent == 0) {
      await purchaseData.update({ status: 0 }, { transaction });

      await PurchaseProduct.update(
        { status: 0 },
        { where: { purchase_id: purchaseData.id }, transaction }
      );

      await transaction.commit();
      res
        .status(200)
        .json({ message: "Purchase and products marked as deleted" });
    } else {
      res.status(205).json({
        error:
          "An error occurred while marking the purchase and products as deleted",
      });
    }
  } catch (error) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", error);
    res.status(500).json({
      error:
        "An error occurred while marking the purchase and products as deleted",
    });
  }
};

exports.GetAllPurchaseOrder = async (req, res) => {
  try {
    const sellQuotations = await Sale.findAll({
      where: {
        company_id: req.user.company_id,
        [Op.and]: [
          {
            status: {
              [Op.gte]: 5
            }
          },
          {
            status: {
              [Op.ne]: 8
            }
          },
          {
            status: {
              [Op.ne]: 9
            }
          },
          {
            status: {
              [Op.ne]: 10
            }
          },
          {
            status: {
              [Op.ne]: 7
            }
          }
        ]
      },
      include: [
        {
          association: "products",
        },
        {
          association: "customer",
          attributes: ['id', 'name'],
        },
        // {
        //   model: AdvancePayment,
        //   as: "advance",
        // },
        // {
        //   model: Followup,
        //   as: "followup",
        // },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(sellQuotations);
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the products" });
  }
};
//recv done
exports.GetAllPurchaseOrderRecvDone = async (req, res) => {
  try {
    const products = await Purchase.findAll({
      where: {
        company_id: req.user.company_id,
        status: 10,
      },
      include: [
        {
          model: PurchaseProduct,
          as: "products",
        },
        {
          model: Vendor,
          as: "vendor",
        },
        {
          model: AdvancePayment,
          as: "advance",
        },
        {
          model: Followup,
          as: "followup",
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Send the response with the fetched data
    res.json(products);
  } catch (error) {
    // Handle the error
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//done list
exports.GetAllPurchaseOrderDone = async (req, res) => {
  try {
    const products = await Purchase.findAll({
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: 10,
      },
      include: [
        {
          model: PurchaseProduct,
          as: "products",
        },
        {
          model: Vendor,
          as: "vendor",
        },
        {
          model: AdvancePayment,
          as: "advance",
        },
        {
          model: Followup,
          as: "followup",
        },
        {
          model: Bill,
          as: "bill",
          attributes: ["id", "purchase_id", "total_amount"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the products" });
  }
};
//for followup
exports.GetAllPurchaseOrderFolloup = async (req, res) => {
  try {
    const products = await Purchase.findAll({
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        mailsend_status: 1,
        [Op.and]: [
          {
            status: {
              [Op.gte]: 5
            }
          },
          {
            status: {
              [Op.ne]: 8
            }
          },
          {
            status: {
              [Op.ne]: 10
            }
          },
          {
            status: {
              [Op.ne]: 7
            }
          }
        ]
      },
      include: [
        {
          model: PurchaseProduct,
          as: "products",
        },
        {
          model: Vendor,
          as: "vendor",
        },
        {
          model: AdvancePayment,
          as: "advance",
        },
        {
          model: Followup,
          as: "followup",
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the products" });
  }
};
//for recv listing
exports.GetAllPurchaseOrderRecv = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = null, 
      reference_number = null, 
      expected_arrival_start = null, 
      expected_arrival_end = null 
    } = req.query;
    // validate page and limit
    if (page < 1) {
      return res.status(400).json({ error: "Page number must be greater than 0" });
    }
    if (limit < 1) {
      return res.status(400).json({ error: "Limit must be greater than 0" });
    }

    // validate expected arrival start and end
    if (expected_arrival_start && expected_arrival_end) {
      if (expected_arrival_start > expected_arrival_end) {
        return res.status(400).json({ error: "Expected arrival start date must be before expected arrival end date" });
      }
    }

    // Set offset to calculate the number of records to skip
    const offset = (page - 1) * limit;

    // where condition
    const whereCondition = {
      company_id: req.user.company_id,
      status: {
        [Op.in]: [5],
      }
    };

    // add status condition
    if (status) {
      whereCondition.status = {
        [Op.eq]: parseInt(status, 10),
      };
    }

    // add reference number condition
    if (reference_number) {
      whereCondition.reference_number = {
        [Op.eq]: reference_number,
      };
    }

    // add expected arrival start and end condition
    if (expected_arrival_start && expected_arrival_end) {
      whereCondition.expected_arrival = {
        [Op.between]: [expected_arrival_start, expected_arrival_end],
      };
    }

    // Get all purchase records with pagination
    const purchaseRecords = await Purchase.findAndCountAll({
      attributes: [
        'id', 
        'reference_number', 
        'expected_arrival', 
        'total_amount', 
        'is_parent', 
        'status',
        'created_at',
        'management_approved_at',
      ],
      where: whereCondition,
      distinct: true,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit, 10),
      offset,
      include: [
        // {
        //   model: PurchaseProduct,
        //   as: "products",
        // },
        {
          association: "vendor",
          attributes: ['id', 'vendor_name'],
        },
        {
          association: 'warehouse',
          attributes: ['id', 'name'],
        },
        {
          association: 'managementApprovedBy',
          attributes: ['id', 'name'],
        }
      ],
      order: [["updated_at", "DESC"]],
    });

    // Get paginated data
    const paginatedPurchaseData = CommonHelper.paginate(purchaseRecords, page, limit);

    // return response with pagination data
    res.status(200).json({
      status: true,
      message: "Purchase records fetched successfully",
      data: paginatedPurchaseData,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ 
        status: false, 
        message: "An error occurred while fetching the products", 
        error: error.message 
      });
  }
};

/*
 * Get all pending purchase records with pagination
 * @param {page} req 
 * @param {object} res - The response object
 * @param {number} req.query.page - The page number
 * @param {number} req.query.limit - The number of records per page
 * @param {number} req.query.status - The status of the purchase
 * @param {string} req.query.reference_number - The reference number of the purchase
 * @param {string} req.query.expected_arrival_start - The start date of the expected arrival
 * @param {string} req.query.expected_arrival_end - The end date of the expected arrival
 * @returns 
 */
exports.pendingApproval = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = null, 
      reference_number = null, 
      expected_arrival_start = null, 
      expected_arrival_end = null 
    } = req.query;
    // validate page and limit
    if (page < 1) {
      return res.status(400).json({ error: "Page number must be greater than 0" });
    }
    if (limit < 1) {
      return res.status(400).json({ error: "Limit must be greater than 0" });
    }

    // validate expected arrival start and end
    if (expected_arrival_start && expected_arrival_end) {
      if (expected_arrival_start > expected_arrival_end) {
        return res.status(400).json({ error: "Expected arrival start date must be before expected arrival end date" });
      }
    }

    // Set offset to calculate the number of records to skip
    const offset = (page - 1) * limit;

    // where condition
    const whereCondition = {
      company_id: req.user.company_id,
      status: 3,
      is_parent: 1
    }

    // add status condition
    if (status) {
      whereCondition.status = {
        [Op.eq]: parseInt(status, 10),
      };
    }

    // add reference number condition
    if (reference_number) {
      whereCondition.reference_number = {
        [Op.eq]: reference_number,
      };
    }

    // add expected arrival start and end condition
    if (expected_arrival_start && expected_arrival_end) {
      whereCondition.expected_arrival = {
        [Op.between]: [expected_arrival_start, expected_arrival_end],
      };
    }

    // Get all purchase records with pagination
    const purchaseRecords = await Purchase.findAndCountAll({
      attributes: ['id', 'reference_number', 'expected_arrival', 'total_amount', 'is_parent', 'status', 'created_at', 'updated_at'],
      where: whereCondition,
      distinct: true,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit, 10),
      offset,
      include: [
        {
          association: "products",
          where: { status: { [Op.ne]: 0 } },
        },
        {
          association: 'vendor',
          attributes: ['id', 'vendor_name'],
        },
        {
          association: 'createdBy',
          attributes: ['name'],
        },
        {
          association: 'warehouse',
          attributes: ['id', 'name'],
        }
      ],
      order: [["created_at", "DESC"]],
    });

    // Get paginated data
    const paginatedPurchaseData = CommonHelper.paginate(purchaseRecords, page, limit);

    // return response with pagination data
    res.status(200).json({
      status: true,
      message: "Purchase records fetched successfully",
      data: paginatedPurchaseData,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ 
      status: false, 
      message: "An error occurred while fetching the purchase records", 
      error: error.message 
    });
  }
};
//final approval
exports.finalApproval = async (req, res) => {

  try {
    const products = await Purchase.findAll({
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: 9,

      },
      include: [
        {
          model: PurchaseProduct,
          as: "products",
        },
        {
          model: Vendor,
          as: "vendor",
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the products" });
  }
};
//// insert remarks
exports.insertRemarks = async (req, res) => {
  try {
    // Create the new remarks
    const purchaseData = await Remarks.create({
      purchase_id: req.body.getPid,
      user_id: req.user.id,
      remarks: req.body.editorContent,
    });

    const purchaseId = req.body.getPid;
    sid = 4;
    // Validate purchaseId
    if (!purchaseId || isNaN(purchaseId)) {
      return res.status(400).json({ error: "Invalid purchase ID" });
    }
    // Update the status of the purchase and its related purchases
    // let updateFields = {
    //   status: sid,
    // };

    // await Purchase.update(updateFields, { where: { id: purchaseId } });

    // if (sid == 4) {
    //   await Purchase.update(
    //     { status: sid },
    //     { where: { parent_recd_id: purchaseId } }
    //   );
    // }
    // Send a successful response
    res.status(201).json({
      success: true,
      data: purchaseData,
    });
  } catch (err) {
    // Handle any errors
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

//find managment remarks
exports.getManagmentReview = async (req, res) => {
  try {
    // Get all remarks for the purchase order
    const remarks = await Remarks.findAll({
      attributes: ['id', 'remarks', 'created_at'],
      where: { purchase_id: req.params.id },
      order: [["created_at", "DESC"]],
      raw: true,
      nest: true,
      include: [
        {
          association: 'user',
          attributes: ['id', 'name', 'email'],
        }
      ]
    });

    // Return the success response
    res.status(200).json({
      status: true,
      message: "Purchase remarks fetched successfully",
      data: remarks,
    });
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).json({ 
      success: false,
      error: err.message,
    });
  }
};

//insert advance payment
exports.insertAdvancePayment = async (req, res) => {
  try {
    // Create the new remarks
    const purchaseData = await AdvancePayment.create({
      amount: req.body.amount,
      purchase_id: req.body.purchase_id,
      user_id: req.user.id,
      company_id: req.user.company_id,
    });
    // Send a successful response
    res.status(201).json({
      success: true,
      data: purchaseData,
    });
  } catch (err) {
    // Handle any errors
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// bill create
//create bill
exports.AddBill = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    console.log("Starting transaction...");

    // Create Bill record
    const purchaseData = await Bill.create(
      {
        vendor_id: req.body.vendor_id,
        purchase_id: req.params.id,
        bill_number: req.body.bill_number,
        bill_reference: req.body.bill_reference,
        accounting_date: req.body.accounting_date,
        bill_date: new Date().toJSON().slice(0, 16),
        placeofsupply: req.body.placeofsupply,
        buyer: req.body.buyer,
        paymentreference: req.body.paymentreference,
        untaxed_amount: req.body.untaxed_amount,
        sgst: req.body.sgst,
        cgst: req.body.cgst,
        total_amount: req.body.total_amount,
        advancePayment: req.body.advancePayment,
        user_id: req.user.id,
        company_id: req.user.company_id,
      },
      { transaction }
    );

    console.log("Bill created:", purchaseData);

    // Create BillProduct records
    if (req.body.products && req.body.products.length > 0) {
      const productPromises = req.body.products.map(async (product) => {
        console.log("Creating product:", product);
        await BillProduct.create(
          {
            bill_id: purchaseData.id,
            product_id: product.product_id,
            description: product.description,
            qty: product.qty,
            unit_price: parseFloat(product.unit_price),
            tax: product.tax,
            taxExcl: parseFloat(product.taxExcl),
            taxIncl: parseFloat(product.taxIncl),
            vendor_id: product.vendor_id,
            user_id: req.user.id,
            company_id: req.user.company_id,
            received: product.received,
          },
          { transaction }
        );
        console.log("Product created:", product);
      });

      await Promise.all(productPromises);
      console.log("All products created");
    }

    await transaction.commit();
    console.log("Transaction committed");

    // Fetch the updated purchase data to respond with
    const updatedPurchase = await Bill.findByPk(purchaseData.id, {
      include: [{ model: BillProduct, as: "products" }],
    });

    await Purchase.update(
      { status: 6 },
      { where: { id: req.params.id } }
    );
    res.status(200).json(updatedPurchase);

  } catch (error) {
    console.error("Transaction rolled back due to error:", error);
    if (!transaction.finished) {
      await transaction.rollback();
    }
    res.status(500).json({
      error: "An error occurred while creating the purchase and products",
      details: error.message,
    });
  }
};



exports.getBill = async (req, res) => {
  const { id } = req.params;

  try {
    const purchaseData = await Bill.findOne({
      where: {
        purchase_id: id,
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: { [Op.ne]: 0 },
      },
      include: [
        {
          model: BillProduct,
          as: "products",
          include: [{ model: Product, as: "ProductsItem" }],
        },
        { model: Payment, as: "allBill" },
        { model: Vendor, as: "vendorname" },
      ],

    });

    if (!purchaseData) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    res.status(200).json(purchaseData);
  } catch (error) {
    console.error("Error fetching purchase data:", error);
    res.status(500).json({ error: "An error occurred while fetching the purchase data", details: error.message });
  }
};

//bill
exports.PaymentRecords = async (req, res) => {

  try {
    // Create the new remarks
    const paymentdata = await Payment.create({
      purchase_id: req.params.id,
      journal: req.body.journal,
      amount: req.body.amount,
      paymentMethod: req.body.paymentMethod,
      //paymentDate: req.body.paymentDate,
      recipientBankAccount: req.body.recipientBankAccount,
      memo: req.body.memo,
      bill_id: req.body.bill_id,
      user_id: req.user.id,
      company_id: req.user.company_id,
    });
    // Send a successful response
    res.status(200).json({
      success: true,
      data: paymentdata,

    });
    await Purchase.update(
      { status: 7 },
      { where: { id: req.params.id } }
    );
    await Bill.update(
      { status: 3 },
      { where: { purchase_id: req.params.id } }
    );

  } catch (err) {
    // Handle any errors
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

//admin status change
exports.StatusUpdateFromAdmin = async (req, res) => {
  const { id, sid } = req.params;
  const transaction = await sequelize.transaction();

  try {
    const purchaseId = id;

    // Validate purchaseId
    if (!purchaseId || isNaN(purchaseId)) {
      return res.status(400).json({ error: "Invalid purchase ID" });
    }

    // Update the status of the purchase and its related purchases
    let updateFields = {
      status: sid,
    };

    await Purchase.update(updateFields, {
      where: { id: purchaseId },
      transaction,
    });


    //  sendMail('sumit.econstra@gmail.com','New Purchase Request for Approval','New Purchase Request for Approval');
    //  MaytapiWhatsappNotification("919163220851","New Purchase Request for Approval");
    await transaction.commit();
    //send confirmation messages

    return res.status(200).json({ message: "Records Updated" });
  } catch (error) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", error);
    return res.status(500).json({
      error:
        "An error occurred while marking the purchase and related purchases as deleted",
    });
  }
};




/**
* @description Generate PDF for purchase order
* @param {number} id - The ID of the purchase order
* @returns {Promise<void>} - The PDF buffer
*/
exports.generatePDFForvendor = async (req, res) => {
  const { id } = req.params;

  try {
    const isVariantBased = req.user.is_variant_based === 1; // 1 for variant based, 0 for non-variant based
    // Get purchase data
    const purchase = await Purchase.findOne({
      attributes: ['id', 'reference_number', 'total_amount', 'expected_arrival', 'untaxed_amount'],
      where: { id },
      include: [
        {
          association: 'products',
          attributes: ['id', 'product_id', 'qty', 'unit_price', 'tax', 'taxExcl', 'taxIncl', 'tax_amount'],
          include: [
            { 
              association: 'ProductsItem',
              attributes: [
                'id',
                'product_code',
                'product_name',
                'sku_product',
              ],
              include: [
                {
                  association: 'masterBrand',
                  attributes: ['name'],
                }
              ]
            },
            {
              association: 'productVariant',
              attributes: ['id', 'weight_per_unit', 'price_per_unit'],
              include: [
                {
                  association: 'masterUOM',
                  attributes: ['name', 'label'],
                }
              ]
            }
          ],
        },
        { 
          association: 'vendor',
          attributes: ['id', 'vendor_name', 'address', 'phone', 'email', 'gstin'],
        },
      ],
    });

    // If purchase not found then return 404 error
    if (!purchase) return res.status(404).send('No data found');

    const [fetchSettings, Companydetails] = await Promise.all([
      // Fetch settings
        GeneralSettings.findOne({
        attributes: ['id', 'template', 'deliveryAddress', 'signature'],
        where: { company_id: req.user.company_id },
        raw: true,
      }),
      // Fetch company details
      Company.findOne({
        attributes: ['id', 'company_name', 'address', 'gst', 'contact_phone'],
        where: { id: req.user.company_id },
        raw: true,
      }),
    ]);

    // If settings not found then return 404 error
    if (!fetchSettings) return res.status(404).send('Settings not found');

    let subTotal = 0;
    let totalTax = 0;
    let grandTotal = 0;
    purchase.products.forEach(product => {
      const taxExcl = Number(parseFloat(product.taxExcl)) || 0;
      let taxIncl = Number(parseFloat(product.taxIncl)) || 0;
      subTotal += taxExcl;
      if (taxIncl > 0) {
        totalTax += taxIncl - taxExcl;
      } else {
        totalTax += taxExcl * (product.tax / 100);
        taxIncl = taxExcl + totalTax;
      }
      grandTotal += taxIncl;
    });
    const grandTotalNum = Number(grandTotal) || 0;


    // const templateName = fetchSettings.template;
    // Get template path
    const templatePath = path.join(__dirname, '../templates', `template1.html`);

    let template;
    try {
      template = fs.readFileSync(templatePath, 'utf8');
    } catch (err) {
      console.error('Error reading template:', err);
      return res.status(500).send('Template not found');
    }

    const compileTemplate = handlebars.compile(template);
    const advanceAmount = purchase.advance?.amount ? parseFloat(purchase.advance.amount) : 0;
    let hasVariant = false;
    purchase.products.forEach(product => {
      if (product.productVariant) {
        hasVariant = true;
      }
    });

    const data = {
      subtotal: subTotal.toFixed(2),
      total_tax: totalTax.toFixed(2),
      grand_total: grandTotalNum.toFixed(2),
      amount_in_words: Number.isFinite(grandTotalNum) ? `${numberToWords.toWords(grandTotalNum)} rupees Only` : "Zero rupees Only",
      products: purchase.products.map(product => ({
        description: product.ProductsItem.product_name,
        product_code: product.ProductsItem.product_code,
        brand: product.ProductsItem?.masterBrand?.name,
        tax: product.tax,
        dateReq: new Date(purchase.expected_arrival).toLocaleString(),
        qty: product.qty,
        unitPrice: parseFloat(product.unit_price).toFixed(2),
        amount: parseFloat(product.taxExcl).toFixed(2),
        weight_per_unit: isVariantBased ? `${product.productVariant.weight_per_unit} ${product.productVariant.masterUOM.label}` : "",
        total_weight: isVariantBased ? CommonHelper.formatTotalWeight(
          product.productVariant.weight_per_unit,
          product.qty,
          product.productVariant.masterUOM.label
        ) : "",
      })),
      customer: {
        name: purchase.vendor.vendor_name,
        address: purchase.vendor.address,
        // city: purchase.vendor.city,
        // state: purchase.vendor.state,
        // country: purchase.vendor.country,
        // zip: purchase.vendor.zip,
        phone: purchase.vendor.phone,
        email: purchase.vendor.email,
        // website: purchase.vendor.website,
        gstin: purchase.vendor.gstin || "",
      },
      otherInfo: {
        refnumber: purchase.reference_number,
        UntaxedAmount: parseFloat(purchase.untaxed_amount).toFixed(2),
        total_amount: parseFloat(purchase.total_amount - advanceAmount).toFixed(2),
        // totalAmountInWords: numberToWords.toWords(parseFloat(purchase.total_amount - advanceAmount)),
        // advancepayment: advanceAmount.toFixed(2),
        // buyer: purchase.buyer ?? '',
        expected_delivery_date: moment(purchase.expected_arrival).format('DD/MM/YYYY'),
        today: moment().format('DD/MM/YYYY'),
        // companyAddress: fetchSettings.companyAddress,
        deliveryAddress: fetchSettings.deliveryAddress,
        signature: fetchSettings.signature,
        hasVariant: hasVariant,
      },
      company: {
        name: Companydetails.company_name,
        address: Companydetails.address,
        gstin: Companydetails.gst,
        contact: Companydetails.contact_phone,
      }
    };

    // Compile the template
    const html = compileTemplate(data);

    // const pdfDirectory = path.join(__dirname, '../pdf');
    // if (!fs.existsSync(pdfDirectory)) fs.mkdirSync(pdfDirectory, { recursive: true });

    // const outputPath = path.join(pdfDirectory, `purchase_order_${response.reference_number}.pdf`);

    // ✅ Prepare the PDF with html-pdf-node
    const file = { content: html };
    const options = {
      format: 'A4',
      // path: outputPath,
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      },
    };

    // Generate the PDF (no file is written to disk)
    const pdfBuffer = await htmlPdf.generatePdf(file, options);

    // ✅ Set headers to show PDF in browser
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="purchase_order_${purchase.reference_number}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    // ✅ Send PDF buffer
    return res.send(pdfBuffer);

    // ✅ Send the file for download
    // return res.download(outputPath, (downloadErr) => {
    //   if (downloadErr) {
    //     console.error('Error downloading file:', downloadErr);
    //     return res.status(500).send('Error downloading PDF');
    //   }
    //   // Optional: delete file after download
    //   // fs.unlinkSync(outputPath);
    // });

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(error.status || 500).send(error.message || 'Internal Server Error');
  }
};

exports.generatePDF = async (id) => {
  try {
    const response = await Purchase.findOne({
      where: { id },
      include: [
        {
          model: PurchaseProduct,
          as: "products",
          include: [{ model: Product, as: "ProductsItem" }],
        },
        { model: Vendor, as: "vendor" },
        { model: AdvancePayment, as: "advance" },
      ],
    });

    if (!response) throw new Error("No purchase data found");

    const templatePath = path.join(__dirname, '../templates/purchaseOrderTemplate.html');
    const template = fs.readFileSync(templatePath, 'utf8');
    const compileTemplate = handlebars.compile(template);

    const advanceAmount = response.advance?.amount ? parseFloat(response.advance.amount) : 0;

    const data = {
      products: response.products.map(product => ({
        description: product.ProductsItem.product_name,
        tax: product.tax,
        dateReq: new Date(response.expected_arrival).toLocaleString(),
        qty: product.qty,
        unitPrice: parseFloat(product.unit_price).toFixed(2),
        amount: parseFloat(product.taxExcl).toFixed(2),
      })),
      vendor: {
        vendorName: response.vendor.vendor_name,
        address: response.vendor.address,
        city: response.vendor.city,
        state: response.vendor.state,
        country: response.vendor.country,
        zip: response.vendor.zip,
        phone: response.vendor.phone,
        email: response.vendor.email,
        website: response.vendor.website,
        gstin: response.vendor.gstin,
        logofile: response.vendor.attachment_file
          ? `http://localhost:5000/uploads/${response.vendor.attachment_file}`
          : 'http://localhost:5000/uploads/no-image.svg',
      },
      otherInfo: {
        refnumber: response.reference_number,
        UntaxedAmount: parseFloat(response.untaxed_amount).toFixed(2),
        total_amount: parseFloat(response.total_amount - advanceAmount).toFixed(2),
        totalAmountInWords: numberToWords.toWords(parseFloat(response.total_amount - advanceAmount)),
        advancepayment: advanceAmount,
        buyer: response.buyer,
        dateline: new Date(response.order_dateline).toLocaleString(),
        today: new Date().toLocaleString(),
      }
    };

    const html = compileTemplate(data);
    const filePath = path.join(__dirname, `../pdf/purchase_order_${response.reference_number}.pdf`);

    // Prepare document for html-pdf-node
    const file = { content: html };

    const options = {
      format: 'A4',
      path: filePath,
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      },
    };

    // Generate PDF
    await htmlPdf.generatePdf(file, options);

    return filePath;

  } catch (error) {
    console.error("PDF generation failed:", error);
    throw error;
  }
};
exports.sendEmail = async (pdfPath, recipientEmail, jsonData) => {
  try {
    // Load email template
    const templatePath = path.join(__dirname, '../templates', 'emailTemplate.html');
    const template = fs.readFileSync(templatePath, 'utf8');
    const compileTemplate = handlebars.compile(template);

    // Prepare data for the template
    const advanceAmount = jsonData.advance && jsonData.advance.amount != null ? parseFloat(jsonData.advance.amount) : 0;
    const emailData = {
      vendorName: jsonData.vendor.vendor_name,
      referenceNumber: jsonData.reference_number,
      buyer: jsonData.buyer,
      totalAmount: parseFloat(jsonData.total_amount - advanceAmount).toFixed(2),
      expectedArrival: new Date(jsonData.expected_arrival).toLocaleString(),
    };

    const emailContent = compileTemplate(emailData);

    // Configure new SMTP transporter using Mailtrap
    const transporter = nodemailer.createTransport({
      host: "bulk.smtp.mailtrap.io",
      port: 587,
      auth: {
        user: "api",
        pass: "da057933578f3a6ff62a852dcc135b5d"
      }
    });

    // Randomly pick a "from" address
    const fromAddresses = [
      'ERP-System@growthh.com',
      'no-reply@growthh.com',
      'growthh-ERP@growthh.com',
      'Software@growthh.com'
    ];
    const from = fromAddresses[Math.floor(Math.random() * fromAddresses.length)];

    const subject = `${jsonData.vendor.vendor_name} Order (Ref ${jsonData.reference_number})`;

    const mailOptions = {
      from,
      to: recipientEmail,
      subject,
      html: emailContent,
      attachments: [
        {
          filename: 'Purchase_Order.pdf',
          path: pdfPath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    return "success";
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

exports.SendMailByPO = async (req, res) => {
  try {
    const data = req.body;
    const pdfPath = await exports.generatePDF(req.params.id, data.val);
    const response = await Purchase.findOne({
      attributes: ['id'],
      where: { id: req.params.id },
      include: [
        // {
        //   model: PurchaseProduct,
        //   as: "products",
        //   include: [{ model: Product, as: "ProductsItem" }],
        // },
        { 
          association: 'vendor',
          attributes: ['id', 'vendor_name', 'email', 'phone'],
        },
        { 
          model: AdvancePayment, 
          as: "advance",
          attributes: ['id', 'amount'],
        },
      ],
    });

     //await exports.sendEmail(pdfPath, response.vendor.email, response);

    const advanceAmount = response.advance && response.advance.amount != null ? response.advance.amount : '0.00';
    const remainingAmount = parseFloat(response.total_amount) - parseFloat(advanceAmount);
    const formattedAmount = remainingAmount.toFixed(2);

    // const whatsappMessageContent = `Dear ${response.vendor.vendor_name},\n\nYour purchase order ${response.reference_number} amounting to ₹ ${formattedAmount} from ${response.buyer}. The receipt is expected on ${new Date(response.expected_arrival).toLocaleString()}. For more details, please check your email.`;

    // MaytapiWhatsappNotification('91' + response.vendor.mobile, whatsappMessageContent);
    res.status(200).send('Email sent successfully');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error sending email');
  }
};


exports.SendMailUpdate = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "Invalid purchase ID" });
  }
  try {
    // Update the status of the purchase
    await Purchase.update(
      { mailsend_status: 1 },
      { where: { id: req.params.id } }
    );

    return res.status(200).json({ message: "Records Updated" });
  } catch (error) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", error.message);
    return res.status(500).json({
      error: "An error occurred while updating the purchase record",
    });
  }
};



exports.insertfollowup = async (req, res) => {
  try {
    // Validate the input
    if (!req.body.getPid || !req.body.editorContent) {
      return res.status(400).json({
        success: false,
        error: "purchase_id and content are required",
      });
    }

    // Create the new remarks
    const purchaseData = await Followup.create({
      purchase_id: req.body.getPid,
      content: req.body.editorContent,
    });

    // Send a successful response
    res.status(200).json({
      success: true,
      data: purchaseData,
    });
  } catch (err) {
    // Handle any errors
    console.error("Error inserting follow-up:", err); // Log the error for debugging
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// recv order
exports.AddOrUpdateRecv = async (req, res) => {
  let transaction = null;
  try {
    let totalPurchaseAmount = 0;
    let untaxedAmount = 0;
    let sgstRate = 0;
    let cgstRate = 0;

    const { products, warehouse_id, bill_number, received_status } = req.body;
    const purchaseId = req.params.purchase_id;

    // Get the purchase data
    const purchaseData = await Purchase.findOne({
      attributes: ['id'],
      where: { id: purchaseId, status: { [Op.in]: [4, 5] } },
      raw: true,
    });

    if (!purchaseData) {
      return res.status(404).json({ error: "Purchase not found or not in under review stage" });
    }

    if (products.length > 0) {
      products.forEach(product => {
        const received = parseFloat(product.received_now);
        const unit_price = parseFloat(product.unit_price);
        const taxRate = parseFloat(product.tax);

        const productUntaxedAmount = received * unit_price;
        const productTotalAmountp = (productUntaxedAmount * taxRate) / 100;
        const productTotalAmount = productUntaxedAmount + productTotalAmountp;

        totalPurchaseAmount += productTotalAmount;
        untaxedAmount += productUntaxedAmount;

        sgstRate = taxRate / 100;
        cgstRate = taxRate / 100;
      });
    }

    // Calculate the SGST and CGST
    let sgst = untaxedAmount * sgstRate / 2;
    let cgst = untaxedAmount * cgstRate / 2;

    // Start the transaction
    transaction = await sequelize.transaction();

    let isanyUpdate = false;

    const purchaseRecieve = await Recv.create(
      {
        vendor_id: req.body.vendor_id,
        purchase_id: purchaseId,
        bill_number: bill_number,
        bill_reference: req.body.bill_reference,
        bill_date: new Date().toJSON().slice(0, 16),
        placeofsupply: req.body.placeofsupply,
        // buyer: req.body.buyer,
        untaxed_amount: untaxedAmount,
        sgst: sgst,
        cgst: cgst,
        total_amount: totalPurchaseAmount,
        user_id: req.user.id,
        company_id: req.user.company_id,
      },
      { transaction }
    );

    if (products.length > 0) {
      const productPromises = products.map(async (product) => {
        
        const received = product.received_now ? parseFloat(product.received_now) : 0;
        const unit_price = parseFloat(product.unit_price);
        const taxRate = parseFloat(product.tax);


        let taxExcl = received * unit_price;
        const taxInclp = taxExcl * (taxRate) / 100;
        let taxIncl = taxExcl + taxInclp;

        // Insert into stock only if received > 0
        if (received > 0 && parseInt(product.available_quantity) >= parseInt(product.received_now)
        ) {
          isanyUpdate = true;

          // Get the product data
          const productData = await Product.findOne({
            attributes: ['id', 'product_name', 'unit', 'is_batch_applicable'],
            where: { id: product.product_id },
            include: [
              {
                association: 'productStockEntries',
                attributes: ['id', 'quantity', 'inventory_at_transit'],
                where: { 
                  warehouse_id: warehouse_id, 
                  ...(product?.productVariant?.id ? { product_variant_id: product?.productVariant?.id } : {})
                },
                required: false,
              },
            ],
          });


          const recievedProduct = await RecvProduct.create(
            {
              bill_id: purchaseRecieve.id,
              product_id: product.product_id,
              product_variant_id: product?.productVariant?.id || null,
              warehouse_id: warehouse_id,
              description: product.description,
              qty: received,
              available_quantity: received,
              unit_price: unit_price,
              tax: taxRate,
              taxExcl: taxExcl,
              taxIncl: taxIncl,
              total_amount: taxIncl,
              vendor_id: product.vendor_id,
              user_id: req.user.id,
              company_id: req.user.company_id,
              received: received,
              batch_no: product.batch_no,
              manufacture_date: product.manufacture_date,
              expiry_date: product.expiry_date,
              rejected: product.rejected,
              purchase_id: purchaseId,
            },
            { transaction }
          );



          // when product is received then received quantity is added to the quantity & decrease the inventory_at_transit
          if (productData.is_batch_applicable === 0) {
            const productStockEntry = productData.productStockEntries.length > 0 ? productData.productStockEntries[0] : null;
            if (productStockEntry) {
              await ProductStockEntry.update({
                quantity: parseInt(productStockEntry.quantity) + parseInt(received),
                inventory_at_transit: parseInt(productStockEntry.inventory_at_transit) - parseInt(received),
              }, { where: { id: productStockEntry.id }, transaction });
            } else {
              await ProductStockEntry.create({
                product_id: product.product_id,
                product_variant_id: product?.productVariant?.id || null,
                warehouse_id: warehouse_id,
                company_id: req.user.company_id,
                user_id: req.user.id,
                quantity: received,
                inventory_at_transit: 0,
              }, { transaction });
            }
          }

          // get the stock in and stock out
          const [stockIn, stockOut] = await Promise.all([
            TrackProductStock.sum("quantity_changed", {
              where: {
                product_id: product.product_id,
                company_id: req.user.company_id,
                ...(product?.productVariant?.id ? { product_variant_id: product?.productVariant?.id } : {}),
                status_in_out: 1,
              },
              transaction
            }),
            TrackProductStock.sum("quantity_changed", {
              where: {
                product_id: product.product_id,
                company_id: req.user.company_id,
                status_in_out: 0,
                ...(product?.productVariant?.id ? { product_variant_id: product?.productVariant?.id } : {}),
              },
              transaction
            })
          ]);

          const currentFinalQty = (stockIn || 0) - (stockOut || 0) + received;

          const referenceNumber = "INV" + Math.floor(1000000 + Math.random() * 9000000);
          const barcodeNumber = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();

          // create track product stock entry
          await TrackProductStock.create(
            {
              product_id: product.product_id,
              ...(product?.productVariant?.id ? { product_variant_id: product?.productVariant?.id } : {}),
              store_id: warehouse_id,
              purchase_id: purchaseId,
              item_name: product.ProductsItem?.product_name || "",
              default_price: taxExcl || 0,
              quantity_changed: received,
              final_quantity: currentFinalQty,
              comment: `${bill_number} Stock added from purchase entry`,
              item_unit: `${product.productVariant?.weight_per_unit} ${product.productVariant?.masterUOM?.name}`,
              adjustmentType: `${bill_number} Stock added from purchase entry`,
              status_in_out: 1,
              reference_number: referenceNumber,
              barcode_number: barcodeNumber,
              company_id: req.user.company_id,
              user_id: req.user.id,
              is_dispatched: 0,
            },
            { transaction }
          );

          // Insert the batches
          if (product.batches.length > 0) {
            const batchPromises = product.batches.map(async (batch) => {
              // get the product stock entry
              const productStockEntry = await ProductStockEntry.findOne({
                attributes: ['id', 'quantity', 'inventory_at_transit'],
                raw: true,
                where: {
                  product_id: product.product_id,
                  ...(batch.variant_id ? { product_variant_id: batch.variant_id } : {}),
                  warehouse_id: warehouse_id,
                },
              });
              // if the product stock entry is not found then create a new one, 
              // if found then update the quantity and inventory_at_transit
              if (productStockEntry) {
                await ProductStockEntry.update({
                  quantity: parseInt(productStockEntry.quantity) + parseInt(batch.quantity),
                  inventory_at_transit: parseInt(productStockEntry.inventory_at_transit) - parseInt(batch.quantity),
                }, { where: { id: productStockEntry.id }, transaction });
              } else {
                await ProductStockEntry.create({
                  product_id: product.product_id,
                  product_variant_id: batch.variant_id || null,
                  warehouse_id: warehouse_id,
                  company_id: req.user.company_id,
                  user_id: req.user.id,
                  quantity: batch.quantity,
                  inventory_at_transit: 0,
                }, { transaction });
              }
              // insert into receive product batch
              await ReceiveProductBatch.create(
                {
                  receive_product_id: recievedProduct.id,
                  purchase_product_id: product.id,
                  purchase_id: purchaseId,
                  product_id: product.product_id,
                  product_variant_id: batch.variant_id || null,
                  warehouse_id: warehouse_id,
                  bill_id: purchaseRecieve.id,
                  company_id: req.user.company_id,
                  batch_no: batch.batch_no,
                  manufacture_date: batch.manufacture_date,
                  expiry_date: batch.expiry_date,
                  quantity: parseInt(batch.quantity),
                  available_quantity: parseInt(batch.quantity),
                  receive_or_reject: 0, // 0 = receive, 1 = reject
                },
                { transaction }
              );
            });
            await Promise.all(batchPromises);
          }
        }
      });

      await Promise.all(productPromises);
      // console.log("All products and stock (if received) created");
    }

    // if received status is completed then update the purchase status to 10
    if (received_status === 'completed') {
      isanyUpdate = true;
      await Purchase.update({
        status: 10,
      }, { where: { id: purchaseId }, transaction });
    }

    if (!isanyUpdate) {
      await transaction.rollback();
      return res.status(200).json({
        success: true,
        message: "Nothing has been updated",
        data: null,
      });
    }
    // Commit the transaction
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Receive order created successfully",
      data: null,
    });
  } catch (error) {
    console.error("Transaction rolled back due to error:", error);
    // Rollback the transaction if it exists
    if (transaction &&!transaction.finished) {
      await transaction.rollback();
    }
    // Return the error response
    res.status(500).json({
      error: "An error occurred while creating the receive and products",
      details: error.message,
    });
  }
};

// get recv
exports.getRecv = async (req, res) => {
  const { id } = req.params;

  try {
    const purchaseData = await Recv.findAll({
      where: {
        purchase_id: id,
        company_id: req.user.company_id,

        status: { [Op.ne]: 0 },
      },
      include: [
        {
          model: RecvProduct,
          as: "recvPro",
          include: [{ model: Product, as: "ProductsItem" }],
        },

        { model: Vendor, as: "vendorname" },
      ],

    });

    if (!purchaseData) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    res.status(200).json(purchaseData);
  } catch (error) {
    console.error("Error fetching purchase data:", error);
    res.status(500).json({ error: "An error occurred while fetching the purchase data", details: error.message });
  }
};


//get total reject count
exports.GetAllPurchaseRejectcount = async (req, res) => {
  try {
    // Define the query conditions
    const queryConditions = {
      where: {
        company_id: req.user.company_id,

        status: {
          [Op.and]: [
            { [Op.ne]: 0 },
            {
              [Op.or]: [
                { [Op.eq]: 8 },
              ]
            }
          ]
        }
      }

    };


    // Get the count of total records
    const totalCount = await Purchase.count(queryConditions);

    // Fetch the products data
    const products = await Purchase.findAll(queryConditions);

    // Respond with the products and total count
    res.status(200).json({
      totalCount,
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching the products" });
  }
};

// total done
exports.GetAllPurchasedonecount = async (req, res) => {
  try {
    // Define the query conditions
    const queryConditions = {
      where: {
        company_id: req.user.company_id,
        status: {
          [Op.and]: [
            { [Op.ne]: 0 },
            {
              [Op.or]: [{ [Op.eq]: 7 }],
            },
          ],
        },
      },
      include: [
        {
          association: "products", // alias defined in model: Purchase.hasMany(PurchaseProduct, { as: "products" })
          include: [
            {
              association: "ProductsItem", // alias defined in model: PurchaseProduct.belongsTo(Product, { as: "ProductsItem" })
            },
          ],
        },
      ],
    };

    // Get the count of total records
    const totalCountdone = await Purchase.count({ where: queryConditions.where });

    // Fetch the purchase records with product and product details
    const products = await Purchase.findAll(queryConditions);

    // Respond with the products and total count
    res.status(200).json({
      totalCountdone,
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching the products" });
  }
};

//total rfq
//get total reject count
exports.GetAllPurchaseRrfq = async (req, res) => {
  try {
    // Define the query conditions
    const queryConditions = {
      where: {
        company_id: req.user.company_id,

        status: {
          [Op.and]: [
            { [Op.ne]: 0 },
            {
              [Op.or]: [
                { [Op.eq]: 2 },
              ]
            }
          ]
        }
      }

    };


    // Get the count of total records
    const totalCountrfq = await Purchase.count(queryConditions);


    // Respond with the products and total count
    res.status(200).json({
      totalCountrfq
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching the products" });
  }
};

//approved
exports.GetAllPurchaseapp = async (req, res) => {
  try {
    // Define the query conditions
    const queryConditions = {
      where: {
        company_id: req.user.company_id,

        status: {
          [Op.and]: [
            { [Op.ne]: 0 },
            {
              [Op.or]: [
                { [Op.eq]: 4 },
              ]
            }
          ]
        }
      }

    };
    // Get the count of total records
    const totalCountapp = await Purchase.count(queryConditions);


    // Respond with the products and total count
    res.status(200).json({
      totalCountapp
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching the products" });
  }
};

// order confirm
exports.GetAllPurchasOconfir = async (req, res) => {
  try {
    // Define the query conditions
    const queryConditions = {
      where: {
        company_id: req.user.company_id,

        status: 5
      }

    };
    // Get the count of total records
    const totalCountocon = await Purchase.count(queryConditions);
    // Respond with the products and total count
    res.status(200).json({
      totalCountocon
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching the products" });
  }
};
// Bill Created
exports.GetAllBillcreated = async (req, res) => {
  try {
    // Define the query conditions
    const queryConditions = {
      where: {
        company_id: req.user.company_id,

        status: 6
      }

    };
    // Get the count of total records
    const totalCountbill = await Purchase.count(queryConditions);
    // Respond with the products and total count
    res.status(200).json({
      totalCountbill
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching the products" });
  }
};

// get done count vendorwise
exports.GetDoneVendorwise = async (req, res) => {
  try {
    // Define the query conditions for the initial count
    const queryConditions = {
      where: {
        company_id: req.user.company_id,

        status: {
          [Op.and]: [
            { [Op.ne]: 0 },
          ]
        }

      }
    };

    // Get the count of total records
    const totalCountapp = await Purchase.count(queryConditions);

    // Get the count of records grouped by vendor_id where status is 7
    const vendorStatus7Count = await Purchase.findAll({
      where: {
        status: 7
      },
      include: [
        { model: Vendor, as: "vendor" },
      ],
      attributes: ['vendor_id', [Sequelize.fn('COUNT', Sequelize.col('vendor_id')), 'count']],
      group: ['vendor_id']
    });

    // Respond with the products, total count, and vendor status 7 count
    res.status(200).json({
      vendorStatus7Count
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching the products" });
  }
};
//get total 
exports.GetVendorPerformance = async (req, res) => {
  try {
    const companyId = req.user?.company_id || 39;

    const results = await Purchase.findAll({
      where: {
        status: 7,
        company_id: companyId,
        order_dateline: { [Op.ne]: null },
        updated_at: { [Op.ne]: null }
      },
      attributes: [
        'vendor_id',
        [Sequelize.literal('AVG(DATEDIFF(`Purchase`.`updated_at`, `Purchase`.`order_dateline`))'), 'average_delay_days'],
        [Sequelize.fn('SUM', Sequelize.col('Purchase.total_amount')), 'total_purchase']
      ],
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'vendor_name']
        }
      ],
      group: [
        'vendor_id',
        'vendor.id'
      ],
      order: [[Sequelize.literal('average_delay_days'), 'DESC']]
    });

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Error in Sequelize vendor performance:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPatmentData = async (req, res) => {

  try {
    const [results, metadata] = await sequelize.query(`SELECT 
    a.created_at,
    SUM(a.amount) + COALESCE(SUM(b.amount), 0) AS total_amount
FROM 
    payments AS a
LEFT JOIN 
    advance_payment AS b 
ON 
    a.purchase_id = b.purchase_id
WHERE 
    a.user_id = ${req.user.id} 
    AND a.company_id = ${req.user.company_id}
GROUP BY 
    a.created_at;`)
    const purchaseData = results;
    console.log(results, metadata);
    if (!purchaseData.length) { // Check if the array is empty

      return res.status(404).json({ error: "No purchase data found" });
    }

    res.status(200).json(purchaseData);
  } catch (error) {
    console.error("Error fetching purchase data:", error);
    res.status(500).json({ error: "An error occurred while fetching the purchase data", details: error.message });
  }
};

exports.GetMonthlyRFQPurchaseReport = async (req, res) => {
  try {
    const companyId = req.user?.company_id || 39;

    // Raw query using Sequelize literal for month-year grouping
    // We will get two aggregates, one for RFQs, one for Purchases (status=7)
    // Since RFQ = all records grouped by created_at
    // Purchases = only status=7 grouped by updated_at

    const rfqData = await Purchase.findAll({
      where: { company_id: companyId },
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'rfq_count'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'rfq_total_amount'],
      ],
      group: ['month'],
      order: [[Sequelize.literal('month'), 'ASC']],
      raw: true,
    });

    const purchaseData = await Purchase.findAll({
      where: {
        company_id: companyId,
        status: 7,
      },
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('updated_at'), '%Y-%m'), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'purchase_count'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'purchase_total_amount'],
      ],
      group: ['month'],
      order: [[Sequelize.literal('month'), 'ASC']],
      raw: true,
    });

    // Merge rfqData and purchaseData by month
    const merged = {};

    rfqData.forEach(item => {
      merged[item.month] = {
        month: item.month,
        rfqCount: parseInt(item.rfq_count, 10),
        rfqTotalAmount: parseFloat(item.rfq_total_amount) || 0,
        purchaseCount: 0,
        purchaseTotalAmount: 0,
      };
    });

    purchaseData.forEach(item => {
      if (!merged[item.month]) {
        merged[item.month] = {
          month: item.month,
          rfqCount: 0,
          rfqTotalAmount: 0,
          purchaseCount: parseInt(item.purchase_count, 10),
          purchaseTotalAmount: parseFloat(item.purchase_total_amount) || 0,
        };
      } else {
        merged[item.month].purchaseCount = parseInt(item.purchase_count, 10);
        merged[item.month].purchaseTotalAmount = parseFloat(item.purchase_total_amount) || 0;
      }
    });

    // Convert merged object to array sorted by month
    const result = Object.values(merged).sort((a, b) => (a.month > b.month ? 1 : -1));

    res.status(200).json({ success: true, data: result });

  } catch (error) {
    console.error("Error fetching monthly RFQ and purchase report:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPurchasesWithStatusNine = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const [results] = await sequelize.query(`
      SELECT 
        p.id AS purchase_id,
        p.reference_number,
        p.order_dateline,
        p.expected_arrival,
        p.total_amount,
        p.untaxed_amount,
        p.buyer,
        p.source_document,
        p.payment_terms,
        p.created_at,
        p.updated_at,

        -- Vendor
        v.id AS vendor_id,
        v.vendor_name,
        v.address,
        v.email,
        v.phone,

        -- Product
        pp.id AS purchase_product_id,
        pp.qty,
        pp.unit_price,
        pp.tax,
        pp.taxIncl,
        pp.taxExcl,
        
        prod.id AS product_id,
        prod.product_name,
        prod.product_code,
        prod.product_price,
        prod.unit

      FROM purchase p

      LEFT JOIN purchase_product pp ON pp.purchase_id = p.id
      LEFT JOIN product prod ON prod.id = pp.product_id
      LEFT JOIN vendor v ON v.id = p.vendor_id

      WHERE p.status = 9
        AND p.company_id = :companyId
      ORDER BY p.created_at DESC
    `, {
      replacements: { companyId },
    });

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Custom query error:", error);
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};



exports.getPurchaseOrderSummary = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const results = await sequelize.query(`
      SELECT 
        p.id AS purchase_id,
        p.reference_number,
        p.order_dateline,
        p.expected_arrival,
        p.total_amount,
        p.untaxed_amount,
        p.buyer,
        p.source_document,
        p.payment_terms,
        p.status,
        p.created_at,
        p.updated_at,

        -- Vendor Details
        v.id AS vendor_id,
        v.vendor_name,
        v.email,
        v.phone,
        v.address,

        -- Product Details
        pp.id AS purchase_product_id,
        pp.product_id,
        pp.qty,
        pp.unit_price,
        pp.tax,
        pp.taxIncl,
        pp.taxExcl,
        pp.tax_amount,

        prod.product_name,
        prod.product_code,
        prod.unit,
        prod.product_price

      FROM purchase p
      LEFT JOIN vendor v ON v.id = p.vendor_id
      LEFT JOIN purchase_product pp ON pp.purchase_id = p.id
      LEFT JOIN product prod ON prod.id = pp.product_id

      WHERE p.company_id = :companyId
      ORDER BY p.created_at DESC
    `, {
      replacements: { companyId },
      type: QueryTypes.SELECT,
      nest: true,
      raw: true
    });

    console.log("Query returned rows:", results.length); // ✅ Debugging

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Error in getPurchaseOrderSummary:", error);
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};

exports.purchaseLedger = async (req, res) => {
  const { vendor_id, startDate, endDate } = req.body;

  try {
    const company_id = req.user?.company_id; // optional chaining, safer

    // Base conditions
    let conditions = `WHERE p.status >= 5 AND p.mailsend_status = 1`;
    const replacements = {};

    if (vendor_id) {
      conditions += ` AND p.vendor_id = :vendor_id`;
      replacements.vendor_id = vendor_id;
    }

    if (company_id) {
      conditions += ` AND p.company_id = :company_id`;
      replacements.company_id = company_id;
    }

    if (startDate && endDate) {
      conditions += ` AND DATE(p.created_at) BETWEEN :startDate AND :endDate`;
      replacements.startDate = startDate;
      replacements.endDate = endDate;

    }

    const query = `
      SELECT 
          v.vendor_name,
          p.reference_number,
          r.bill_number,
          pr.product_name,
          DATE(r.bill_date) AS recv_date,
          rp.product_id,
          rp.qty AS ordered,
          rp.received,
          -- Remaining before this bill
          (rp.qty - SUM(rp.received) OVER (
              PARTITION BY p.reference_number, rp.product_id
              ORDER BY r.created_at
              ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
          )) AS remaining_before,
          -- Remaining after this bill
          (rp.qty - SUM(rp.received) OVER (
              PARTITION BY p.reference_number, rp.product_id
              ORDER BY r.created_at
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          )) AS remaining_after,
          p.company_id
      FROM recvproduct rp
      JOIN recv r ON r.id = rp.bill_id
      JOIN purchase p ON p.id = rp.purchase_id
      JOIN vendor v ON v.id = p.vendor_id
      JOIN product pr ON pr.id = rp.product_id
      ${conditions}
      ORDER BY v.vendor_name, p.reference_number, rp.product_id, r.created_at
    `;

    // Note: Do NOT destructure the results here, sequelize returns array directly on SELECT
    const results = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    console.log("Purchase Ledger results count:", results.length);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error generating purchase ledger:", error);
    res.status(500).json({ error: "Failed to generate purchase ledger" });
  }
};


/**
 * Update and approve purchase order by management
 * @param {object} req - The request object
 * @param {object} req.params - Route parameters
 * @param {number} req.params.id - Purchase ID
 * @param {object} req.body - Request body
 * @param {number} req.body.purchase_id - Purchase ID (should match path param)
 * @param {array} req.body.products - Array of products to update
 * @param {string} req.body.remarks - Remarks for approval
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */
exports.ApprovedByManagement = async (req, res) => {
  let transaction = null;
  
  try {
    // Get the purchase ID
    const { id } = req.params;
    // Get the request body
    const { products, remarks, send_to_vendor } = req.body;

    // Get the purchase record
    const purchase = await Purchase.findOne({
      attributes: ['id', 'status', 'warehouse_id'],
      where: { id },
      raw: true,
    });

    // Throw error if the purchase is not found
    if (!purchase) {
      return res.status(404).json({ status: false, message: "Purchase not found" });
    }

    // Throw error if the purchase is not in the status 4
    if (purchase.status >= 5) {
      return res.status(400).json({ status: false, message: "Purchase is not in under review stage" });
    }

    // Start a new transaction
    transaction = await sequelize.transaction();

    // Create the promises
    const promises = [];

    // If products is provided, update the purchase products
    let totalAmount = 0;
    let untaxedAmount = 0;
    if (products && products.length > 0) {
      products.forEach(product => {
        const taxExcl = product.qty * product.unit_price;
        const taxAmount = (product.tax / 100) * taxExcl;
        const totalWithTax = taxExcl + taxAmount;
        totalAmount += totalWithTax;
        untaxedAmount += taxExcl;

        promises.push(PurchaseProduct.update(
          {
            product_id: product.product_id,
            product_variant_id: product.variant_id || null,
            qty: product.qty,
            unit_price: product.unit_price,
            tax: product.tax,
            taxExcl: taxExcl,
            tax_amount: taxAmount,
            taxIncl: totalWithTax,
            total_amount: totalWithTax,
          }, { where: { id: product.id }, transaction }
        ));
      });
    }
    // Update the purchase record with the new total amount and untaxed amount
    promises.push(Purchase.update({
      total_amount: totalAmount,
      untaxed_amount: untaxedAmount,
      management_approved_by: req.user.id,
      management_approved_at: new Date(),
      status: send_to_vendor ? 5 : 4 // Update the purchase status to approved by management
    }, { where: { id }, transaction }));

    // If remarks is provided, create a new remarks record
    if (remarks) {
      promises.push(Remarks.create({
        purchase_id: id,
        user_id: req.user.id,
        remarks: remarks,
      }, { transaction }));
    }

    // If send_to_vendor is true, add to inventory at transaction
    if (send_to_vendor) {
      promises.push(addToInventoryAtTransaction(products, purchase.warehouse_id, transaction));
    }

    // Execute the promises
    await Promise.all(promises);

    // Commit the transaction
    await transaction.commit();
    // Return the success response
    return res.status(200).json({ status: true, message: "Purchase order updated and approved successfully" });
  } catch (error) {
    // Rollback the transaction if it exists
    if (transaction) {
      await transaction.rollback();
    }
    console.error("Transaction rolled back due to error:", error);
    return res.status(500).json({ status: false, message: "An error occurred while updating and approving the purchase order", error: error.message });
  }
};

/**
 * Add to inventory at transaction
 * @param {object} transaction - The transaction object
 * @returns {Promise<void>}
 */
const addToInventoryAtTransaction = async (purchasedProducts, warehouse_id, transaction = false) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get the purchase products
      // const purchaseProducts = await PurchaseProduct.findAll({
      //   attributes: ['id', 'product_id', 'qty'],
      //   where: { purchase_id: puchase_id },
      //   raw: true,
      // });
      // // Throw error if the purchase products are not found
      // if (purchaseProducts.length === 0) {
      //   return reject(new Error("Purchase products are not found"));
      // }
      // Add to inventory at transaction
      const inventoryPromises = purchasedProducts.map(async (purchasedProduct) => {
        const variant_id = purchasedProduct.product_variant_id ? 
                  purchasedProduct.product_variant_id : purchasedProduct.variant_id ? 
                  purchasedProduct.variant_id : null;
        // Get product stock entry
        const productStockEntry = await ProductStockEntry.findOne({
          attributes: ['id', 'quantity', 'inventory_at_transit'],
          where: { 
            product_id: purchasedProduct.product_id,
            warehouse_id: warehouse_id,
            ...(variant_id ? { product_variant_id: variant_id } : {})
          },
          raw: true,
        });
        // exclude the operation if the product stock entry is not found
        if (!productStockEntry) {
          // return reject(new Error("Product stock entry is not found"));
          return resolve(true);
        }
        // Update the product stock entry
        await ProductStockEntry.update({
          inventory_at_transit: productStockEntry.inventory_at_transit + purchasedProduct.qty
        }, { 
          where: { id: productStockEntry.id }, 
          ...(transaction ? { transaction } : {}) 
        });
      });
      // Execute the inventory promises
      await Promise.all(inventoryPromises);
      resolve(true);
    } catch (error) {
      console.error("Error adding to inventory at transaction:", error);
      reject(new Error("Error adding to inventory at transaction"));
    }
  });
};

/**
 * Delete individual item from a purchase order
 * @param {object} req - The request object
 * @param {object} req.params - Route parameters
 * @param {number} req.params.pid - Purchase ID
 * @param {number} req.params.id - Purchase Product Item ID
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */
exports.DeletePurchaseItem = async (req, res) => {
  try {
    const { pid, id } = req.params;

    // Check if the purchase order item exists
    const purchaseProduct = await PurchaseProduct.findOne({
      attributes: ['id', 'taxExcl', 'tax_amount'],
      where: { id: id },
      raw: true,
      nest: true,
      include: [
        {
          association: 'purchase',
          attributes: ['id', 'untaxed_amount', 'total_amount'],
          where: { id: pid },
          required: true,
        }
      ]
    });

    // Throw error if the purchase order item is not found
    if (!purchaseProduct) {
      return res.status(404).json({
        status: false,
        message: "Purchase order item is not found"
      });
    }

    // Delete the purchase order item
    // await PurchaseProduct.destroy({
    //   where: { id: id },
    // });
    await PurchaseProduct.update({ status: 0 }, { where: { id: id } });
    
    // Recalculate the purchase total amount
    const totalAmount = parseInt(purchaseProduct.purchase.total_amount) - (parseInt(purchaseProduct.taxExcl) + parseInt(purchaseProduct.tax_amount));
    const untaxedAmount = parseInt(purchaseProduct.purchase.untaxed_amount) - parseInt(purchaseProduct.taxExcl);


    // Update the purchase record with the new total amount and untaxed amount
    await Purchase.update({ total_amount: totalAmount, untaxed_amount: untaxedAmount }, { where: { id: pid } });

    // Return the success response
    return res.status(200).json({ status: true, message: "Purchase item deleted successfully" });

  } catch (error) {
    console.error("Error deleting purchase item:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while deleting the purchase item",
      error: error.message
    });
  }
};

/**
 * Update and reject purchase order by management
 * @param {object} req - The request object
 * @param {object} req.params - Route parameters
 * @param {number} req.params.id - Purchase ID
 * @param {object} req.body - Request body
 * @param {string} req.body.remarks - Remarks for rejection
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */

exports.RejectedByManagement = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    // Check if the purchase order exists
    const purchase = await Purchase.findOne({
      attributes: ['id', 'status'],
      where: { id },
      raw: true,
    });
    // Throw error if the purchase order is not found
    if (!purchase) {
      return res.status(404).json({ status: false, message: "Purchase not found" });
    }

    // Throw error if the purchase order is not in under review stage
    if (purchase.status !== 3) {
      return res.status(400).json({ status: false, message: "Purchase is not in under review stage" });
    }
    // Update the purchase order status to rejected
    await Purchase.update({ status: 8 }, { where: { id } });
    // If remarks is provided, create a new remarks record
    if (remarks) {
      // Create the new remarks
      await Remarks.create({ purchase_id: id, user_id: req.user.id, remarks: remarks });
    }
    // Return the success response
    return res.status(200).json({ 
      status: true, 
      message: "Purchase order updated and rejected successfully" 
    });
  } catch (error) {
    console.error("Error rejecting purchase order:", error);
    return res.status(500).json({ status: false, message: "An error occurred while rejecting the purchase order", error: error.message });
  }
};

/**
 * Get current month purchase amount
 * @param {object} req - The request object
 * @param {object} req.user - The user object
 * @param {number} req.user.company_id - The company ID
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */
exports.getCurrentMonthPurchaseAmount = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const purchaseAmount = await Purchase.sum('total_amount', {
      where: { company_id: companyId, status: 7, created_at: { [Op.gte]: new Date(currentYear, currentMonth, 1) } }
    });
  
    return res.status(200).json({
      status: true,
      message: "Current month purchase amount fetched successfully",
      data: purchaseAmount
    });
  } catch (error) {
    console.error("Error fetching current month purchase amount:", error);
    return res.status(500).json({ status: false, message: "An error occurred while fetching the current month purchase amount", error: error.message });
  }
};

/**
 * Cancel purchase order
 * @param {object} req - The request object
 * @param {object} req.params - Route parameters
 * @param {number} req.params.id - Purchase ID
 * @param {object} req.body - Request body
 * @param {string} req.body.remarks - Remarks for cancellation
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */
exports.CancelPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    // Check if the purchase order exists
    const purchase = await Purchase.findOne({
      attributes: ['id', 'status'],
      where: { id },
      raw: true,
    });
    // Throw error if the purchase order is not found
    if (!purchase) {
      return res.status(404).json({ status: false, message: "Purchase not found" });
    }
    // Throw error if the purchase order is already cancelled or completed
    if ([8, 9, 10].includes(parseInt(purchase.status))) {
      return res.status(400).json({ status: false, message: "Purchase is not in under review stage" });
    }

    // Purchase record update
    await Purchase.update({ 
      status: 8, 
      cancelled_by: req.user.id, 
      cancelled_at: new Date() 
    }, { where: { id } });

    // Remarks record creation
    if (remarks) {
      await Remarks.create({ purchase_id: id, user_id: req.user.id, remarks: remarks });
    }
    // Return the success response
    return res.status(200).json({ 
      status: true, 
      message: "Purchase order canceled successfully" 
    });
  } catch (error) {
    console.error("Error canceling purchase order:", error);
    return res.status(500).json({ status: false, message: "An error occurred while canceling the purchase order", error: error.message });
  }
};
