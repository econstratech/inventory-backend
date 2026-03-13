const { Sequelize } = require("sequelize");
const { Op, col, where } = require("sequelize");
const fs = require("fs");
const path = require("path");
const wkhtmltopdf = require("wkhtmltopdf");
const numberToWords = require("number-to-words");
const moment = require("moment");
const handlebars = require("handlebars");
const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");


const sequelize = require("../database/db-connection");
const { 
  Sale,
  Purchase, 
  SalesProduct, 
  User, 
  Company,
  Customer, 
  TrackProductStock,
  SalesRemarks,
  Product,
  ProductStockEntry,
  Bill,
  Payment,
  SalesProductReceived,
  Production,
  TrackBatchProductLog,
  ReceiveProductBatch
} = require("../model");

const generateUniqueReferenceNumber = require("../utils/generateReferenceNumber");



const {
  // sendMail,
  // GreenApiWhatsappNotification,
  MaytapiWhatsappNotification,
  // MaytapiWhatsappNotificationmedia,
} = require("../utils/Helper");

// Adjust the path as necessary

const Recv = require("../model/Recv");
const RecvProduct = require("../model/RecvProduct");
const { GeneralSettings } = require("../model/CompanyModel");
// const { error, time } = require("console");
const MasteruomModel = require("../model/MasteruomModel");
const ProductCategories = require("../model/ProductCategory");
const CommonHelper = require("../helpers/commonHelper");


exports.AddSellQuotation = async (req, res) => {
  let transaction;

  try {
    // generate the reference number
    const referenceNumber = await generateUniqueReferenceNumber();

    // begin the transaction
    transaction = await sequelize.transaction();
   //create the sell quotation
    const sellQuotationData = await Sale.create(
      {
        reference_number: "S" + referenceNumber,
        customer_id: req.body.customer_id,
        warehouse_id: req.body.warehouse_id,
        expected_delivery_date: req.body.expected_delivery_date,
        // customer_reference: req.body.customer_reference,
        // expiration: req.body.expiration,
        // dalivery_date: req.body.dalivery_date,
        // buyer: req.body.buyer,
        // source_document: req.body.source_document,
        payment_terms: req.body.payment_terms,
        total_amount: req.body.total_amount,
        untaxed_amount: req.body.untaxed_amount,
        is_parent: req.body.is_parent,
        is_parent_id: req.body.is_parent_id,
        user_id: req.user.id,
        company_id: req.user.company_id,
        mailsend_status: req.body.mailsend_status || 0,
      },
      { transaction }
    );

    if (req.body.products && req.body.products.length > 0) {
      const productPromises = req.body.products.map(async (product) => {
        // Calculate product total including tax
        const productTotal = product.qty * product.unit_price;
        const taxAmount = (product.tax / 100) * productTotal;
        // const totalWithTax = productTotal + taxAmount;

        // Create SalesProduct record
        await SalesProduct.create(
          {
            sales_id: sellQuotationData.id,
            product_id: product.product_id,
            product_variant_id: product.variant_id,
            customer_id: req.body.customer_id,
            warehouse_id: req.body.warehouse_id,
            description: product.description,
            qty: product.qty,
            unit_price: product.unit_price,
            tax: product.tax,
            taxExcl: product.taxExcl,
            taxIncl: product.taxIncl, // Store total including tax
            vendor_id: req.body.vendor_id,
            taxAmount: taxAmount,
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
          where: { id: sellQuotationData.id },
          transaction,
        }
      );

      // Update SalesProduct with total amount (if needed)
      await SalesProduct.update(
        {
          total_amount: totalPurchaseAmount,
        },
        {
          where: { sales_id: sellQuotationData.id },
          transaction,
        }
      );

    }

    // commit the transaction
    await transaction.commit();

    // Return the updated purchase data including total amount to the client
    res.status(201).json({
      status: true,
      message: "Sell quotation created successfully",
    });
  } catch (error) {
    // rollback the transaction if it is started
    if (transaction) {
      await transaction.rollback();
    }
    console.error("error in sell quotation creation", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while creating the sell quotation",
    });
  }
};

exports.AddPurchaseadditi = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const referenceNumber = await generateUniqueReferenceNumber();
    console.log("Creating Purchase...");
    const purchaseData = await Sale.create(
      {
        reference_number: "S" + referenceNumber,
        customer_id: req.body.customer_id,
        customer_reference: req.body.customer_reference,
        expiration: req.body.expiration,
        dalivery_date: req.body.dalivery_date,
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
        mailsend_status: req.body.mailsend_status || "0",
      },
      { transaction }
    );

    if (req.body.products && req.body.products.length > 0) {
      console.log("Creating Purchase Products...");
      const productPromises = req.body.products.map(async (product) => {
        // Calculate product total including tax
        const productTotal = product.qty * product.unit_price;
        const taxAmount = (product.tax / 100) * productTotal;
        const totalWithTax = productTotal + taxAmount;

        // Create PurchaseProduct record
        await PurchaseProduct.create(
          {
            sales_id: purchaseData.id,
            product_id: product.product_id,
            description: product.description,
            qty: product.qty,
            unit_price: product.unit_price,
            tax: product.tax,
            taxExcl: productTotal,
            taxIncl: totalWithTax,
            taxAmount: taxAmount,
            vendor_id: req.body.vendor_id,
            user_id: req.user.id,
            company_id: req.user.company_id,
          },
          { transaction }
        );
      });

      await Promise.all(productPromises);
      console.log("All Purchase Products created.");

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

      // Update SalesProduct with total amount (if needed)
      await SalesProduct.update(
        {
          total_amount: totalPurchaseAmount,
        },
        {
          where: { sales_id: purchaseData.id },
          transaction,
        }
      );

      console.log("Total Purchase Amount updated:", totalPurchaseAmount);
    }

    await transaction.commit();
    console.log("Transaction committed.");

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

exports.updateSalesQuotation = async (req, res) => {
  const { id } = req.params;

  // check if the sales quotation exists
  const saleQuotationData = await Sale.findOne({
    attributes: ['id', 'status'],
    where: { id },
    raw: true
  });

  // throw error if the sales quotation does not exist
  if (!saleQuotationData) {
    return res.status(404).json({ 
      status: false, 
      message: "Sales Quotation ID is required" 
    });
  } else if (saleQuotationData.status == 10) {
    return res.status(400).json({ 
      status: false, 
      message: "Sales Quotation is already dispatched" 
    });
  }

  let transaction = null;

  try {
    // Validate the request body
    if (
      !req.body.customer_id ||
      !req.body.products ||
      req.body.products.length === 0
    ) {
      return res.status(400).json({ 
        status: false, 
        message: "Customer ID, Products and Total Amount are required" 
      });
    }


    // start the transaction
    transaction = await sequelize.transaction();
    // Update Purchase details
    await Sale.update(
      {
        customer_id: req.body.customer_id,
        expected_delivery_date: req.body.expected_delivery_date,
        warehouse_id: req.body.warehouse_id,
        payment_terms: req.body.payment_terms,
        user_id: req.user.id,
      },
      {
        where: { id },
        transaction,
      }
    );

    let totalSaleAmount = 0;
    let untaxedAmount = 0;

    // Create new SalesProducts based on updated data
    if (req.body.products && req.body.products.length > 0) {
      const productPromises = req.body.products.map(async (product) => {
        // Calculate product total including tax
        const productTotal = product.qty * product.unit_price;
        const taxAmount = (product.tax / 100) * productTotal;
        untaxedAmount += productTotal;
        const totalWithTax = productTotal + taxAmount;

        totalSaleAmount += totalWithTax;

        // If product id is present, update the sales product, otherwise create a new one
        if (product.id) {
          // Update SalesProduct record
          await SalesProduct.update(
            {
              product_id: product.product_id,
              product_variant_id: product.product_variant_id,
              qty: product.qty,
              unit_price: product.unit_price,
              tax: product.tax,
              taxExcl: productTotal,
              taxIncl: totalWithTax,
              taxAmount: taxAmount,
              customer_id: req.body.customer_id,
            },
            {
              where: { id: product.id },
              transaction,
            }
          );
        } else {
            // Create SalesProduct record
            await SalesProduct.create(
              {
                sales_id: id,
                product_id: product.product_id,
                product_variant_id: product.product_variant_id,
                warehouse_id: req.body.warehouse_id,
                description: product.description,
                qty: product.qty,
                unit_price: product.unit_price,
                tax: product.tax,
                taxExcl: productTotal,
                taxIncl: totalWithTax,
                taxAmount: taxAmount,
                customer_id: req.body.customer_id,
                user_id: req.user.id,
                company_id: req.user.company_id,
              },
              { transaction }
            );
        }
      });

      await Promise.all(productPromises);
    }

    // Update the purchase record with total amount and untaxed amount
    await Sale.update(
      {
        total_amount: totalSaleAmount,
        untaxed_amount: untaxedAmount,
      },
      {
        where: { id },
        transaction,
      }
    );

    // Commit the transaction
    await transaction.commit();

    // Return the updated purchase data including total amount to the client
    res.status(200).json({
      status: true,
      message: "Sales Quotation updated successfully",
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error("error in updating sales quotation", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while updating the sales quotation",
    });
  }
};
exports.GetAllPurchaseOrderforFloormanagment = async (req, res) => {
  try {
    const products = await Sale.findAll({
      where: {
        company_id: req.user.company_id,
        mailsend_status: { [Op.ne]: 1 }, // ✅ Add this condition
        status: {
          [Op.in]: [9],
        },
      },
      include: [
        {
          association: "products",
        },
        {
          association: "customer",
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
exports.GetAllPurchase = async (req, res) => {
  try {
    const products = await Sale.findAll({
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: {
          [Op.and]: [
            { [Op.ne]: 0 }, // Exclude status = 0
            { [Op.ne]: 4 }, // Exclude status = 4
            {
              [Op.or]: [
                { [Op.lt]: 5 }, // Status is less than 5
                { [Op.eq]: 8 }, // OR status is equal to 8
              ],
            },
          ],
        },
      },
      include: [
        {
          association: "products",
        },
        {
          model: Customer,
          as: "customer",
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

exports.GetAllSalesQuotetion = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 15, 
      status = null, 
      type = null,
      reference_number = null, 
      expected_delivery_date_start = null, 
      expected_delivery_date_end = null 
    } = req.query;
    // validate page and limit
    if (page < 1) {
      return res.status(400).json({ error: "Page number must be greater than 0" });
    }
    if (limit < 1) {
      return res.status(400).json({ error: "Limit must be greater than 0" });
    }

    // validate expected arrival start and end
    if (expected_delivery_date_start && expected_delivery_date_end) {
      if (expected_delivery_date_start > expected_delivery_date_end) {
        return res.status(400).json({ error: "Expected delivery date start date must be before expected delivery date end date" });
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
    if (expected_delivery_date_start && expected_delivery_date_end) {
      whereCondition.expected_delivery_date = {
        [Op.between]: [expected_delivery_date_start, expected_delivery_date_end],
      };
    }

    // To display the seel order drop down of purchase order form
    if (type === 'availableQuotations') {
      whereCondition.status = {
        [Op.eq]: 9,
      };
    } else if (type === 'orderForDispatch') {
      whereCondition.status = {
        [Op.in]: [10, 9],
      };
    }

    const relations = [
      {
        association: "warehouse",
        attributes: ['id', 'name'],
      },
      {
        association: "customer",
        attributes: ['id', 'name'],
      },
      {
        association: "createdBy",
        attributes: ['id', 'name'],
      },
      {
        association: "purchases",
        attributes: ['id', 'reference_number', 'status'],
      }
    ];

    if (type === 'orderForDispatch') {
      relations.push({
        association: "products",
        attributes: ['id', 'status'],
        required: true,
        include: [
          {
            association: "sales_product_received",
            attributes: ['id', 'received_quantity', 'rejected_quantity'],
            required: true,
          }
        ]
      });
    }

    // get all sales quotations
    const sellQuotations = await Sale.findAndCountAll({
      attributes: [
        'id',
        'reference_number', 
        'expected_delivery_date',
        'payment_terms',
        'total_amount',
        'is_parent',
        'status',
        'created_at',
        'updated_at'
      ],
      distinct: true,
      where: whereCondition,
      limit: parseInt(limit, 10),
      offset,
      include: type !== 'availableQuotations' ? relations : [],
      order: [["updated_at", "DESC"]],
    });

    // Get paginated data
    const paginatedSalesQuotations = CommonHelper.paginate(sellQuotations, page, limit);

    res.status(200).json({
      status: true,
      message: "Sales Quotations fetched successfully",
      data: paginatedSalesQuotations,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the products" });
  }
};

exports.GetAllSalesreject = async (req, res) => {
  try {
    const products = await Sale.findAll({
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: {
          [Op.eq]: 8,
        },
      },
      include: [
        {
          association: "products",
        },
        {
          model: Customer,
          as: "customer",
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

exports.GetAllSalesReview = async (req, res) => {
  try {
    const products = await Sale.findAll({
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: {
          [Op.eq]: 3,
        },
      },
      include: [
        {
          association: "products",
        },
        {
          model: Customer,
          as: "customer",
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

//show all reject
exports.GetAllPurchaseReject = async (req, res) => {
  try {
    const products = await Sale.findAll({
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: {
          [Op.and]: [
            { [Op.ne]: 0 },
            {
              [Op.or]: [{ [Op.eq]: 8 }],
            },
          ],
        },
      },
      include: [
        {
          association: "products",
        },
        {
          association: "customer",
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

exports.getSalesQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    const relationsWithIndividualProduct = [
      {
        association: 'productCategory',
        attributes: ['id', 'title'],
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
      },
      {
        association: 'productVariants',
        attributes: ['id', 'weight_per_unit', 'price_per_unit', 'uom_id'],
        include: [
          {
            association: 'masterUOM',
            attributes: ['id', 'name', 'label'],
          }
        ]
      },
      {
        association: 'masterBrand',
        attributes: ['id', 'name'],
      },
      {
        association: 'masterProductType',
        attributes: ['id', 'name'],
      },
      {
        association: 'productCategory',
        attributes: ['id', 'title'],
      }
    ];

    const relationships = [
      {
        association: "products",
        attributes: [
          'id', 
          'status',
          'product_id', 
          'qty', 
          'unit_price', 
          'taxExcl', 
          'taxIncl', 
          'tax', 
          'description', 
          'is_dispatched',
          'delivery_note'
        ],
        include: [
          ...(type === 'dispatch' ? [
            { 
              association: 'sales_product_received', 
              attributes: ['id', 'received_quantity', 'rejected_quantity'],
              include: [
                {
                  association: 'user',
                  attributes: ['id', 'name'],
                },
                {
                  association: 'productVariant',
                  attributes: ['id', 'weight_per_unit'],
                  include: [
                    {
                      association: 'masterUOM',
                      attributes: ['id', 'name', 'label'],
                    }
                  ]
                }
              ]
            },
            { 
              association: "warehouse",
              attributes: ['id', 'name'],
            },
          ] : []),
          { 
            association: 'productData',
            attributes: ['id', 'product_name', 'product_code', 'sku_product'],
            include: [
              ...relationsWithIndividualProduct
            ]
          },
          {
            association: 'productVariant',
            attributes: ['id', 'weight_per_unit', 'price_per_unit', 'uom_id'],
            include: [
              {
                association: 'masterUOM',
                attributes: ['id', 'name', 'label'],
              }
            ]
          }
        ],
      },
      { 
        association: "customer",
        attributes: ['id', 'name'],
      },
      { 
        association: "warehouse",
        attributes: ['id', 'name'],
      }
    ];

    const attributes = [
      'id', 
      'reference_number', 
      'expected_delivery_date', 
      'payment_terms', 
      'total_amount', 
      'is_parent', 
      'status', 
      'created_at'
    ];

    // get the sales quotation data
    const salesQuotationData = await Sale.findOne({
      attributes: attributes,
      where: {
        id: id,
      },
      include: relationships,
    });

    // return the sales quotation data
    if (!salesQuotationData) {
      return res.status(404).json({ status: false, message: "Sales Quotation not found" });
    }

    res.status(200).json({
      status: true,
      message: "Sales Quotation fetched successfully",
      data: salesQuotationData,
    });
  } catch (error) {
    console.error("Error fetching sales quotation:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the purchase" });
  }
};

exports.getPurchaseaddi = async (req, res) => {
  const { id, venid } = req.params;

  try {
    const salesQuotationData = await Sale.findAll({
      where: {
        parent_recd_id: id,
        is_parent_id: venid,
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: { [Op.ne]: 0 },
      },
      include: [
        {
          association: "products",
          // include: [{ model: Product, as: "ProductsItem" }],
        },
        { 
          association: "customer",
          attributes: ['id', 'name'],
        },
      ],
    });

    // return the sales quotation data
    if (!salesQuotationData) {
      return res.status(404).json({ status: false, message: "Sales Quotation not found" });
    }

    res.status(200).json({
      status: true,
      message: "Sales Quotation fetched successfully",
      data: salesQuotationData,
    });
  } catch (error) {
    console.error("Error fetching sales quotation:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the sales quotation" });
  }
};
exports.getPurchasecompare = async (req, res) => {
  //   try {
  const purchaseData = await Sale.findAll({
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
        association: "products",
        include: [{ model: Product, as: "ProductsItem" }],
      },
      { association: "customer" },
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
    const purchaseData = await Sale.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { id: req.params.id },
              { parent_recd_id: req.params.id }
            ],
          },
          { status: { [Op.ne]: 0 } },
        ],
      },
      include: [
        {
          association: "products",
          where: { status: { [Op.ne]: 0 } },
          include: [{ model: Product, as: "ProductsItem" }],
        },
        { association: "customer" },
        { model: Remarks, as: "remarkdata" },
      ],
    });

    if (!purchaseData || purchaseData.length === 0) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    // Loop over all purchases and their products
    for (const purchase of purchaseData) {
      for (const product of purchase.products) {
        const product_id = product.product_id;
        const qty = product.quantity; // Assuming `quantity` field exists
        const company_id = req.user.company_id;

        const totalIn = await TrackProductStock.sum("quantity_changed", {
          where: {
            product_id,
            company_id,
            status_in_out: 1,
          },
        });

        const totalOut = await TrackProductStock.sum("quantity_changed", {
          where: {
            product_id,
            company_id,
            status_in_out: 0,
          },
        });

        const currentStock = (totalIn || 0) - (totalOut || 0);


        // Add stock data to each product
        product.setDataValue("totalIn", totalIn || 0);
        product.setDataValue("totalOut", totalOut || 0);
        product.setDataValue("currentStock", currentStock);

      }
    }

    return res.status(200).json(purchaseData);
  } catch (err) {
    console.error("Error fetching purchase comparison:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.StatusUpdate = async (req, res) => {
  const { id: purchaseId, sid: statusId } = req.params;
  const transaction = await sequelize.transaction();

  try {
    if (!purchaseId || isNaN(purchaseId)) {
      return res.status(400).json({ error: "Invalid purchase ID" });
    }

    const parsedStatus = parseInt(statusId);

    const updateFields = {
      //status: parsedStatus === 10 || parsedStatus === 11 ? 9 : parsedStatus,
      status: parsedStatus,
    };

    if (parsedStatus === 10 || parsedStatus === 11) {
      updateFields.mailsend_status = 1;
    }
    // when floor manager direct dispatch
    // if (parsedStatus === 11) {
    //   // 1. Get Default Store
    //   const defaultStore = await Store.findOne({
    //     where: {
    //       company_id: req.user.company_id,
    //       is_default: 1,
    //     },
    //   });

    //   if (!defaultStore) {
    //     return res.status(400).json({ message: "Default store not found." });
    //   }

    //   const store_id = defaultStore.id;

    //   // 2. Get Sales Products with Product Details
    const updateFieldsPdata = {
      status: parsedStatus,
    };

    const purchaseProducts = await SalesProduct.findAll({
      attributes: ['id', 'status', 'warehouse_id', 'qty'],
      where: {
        sales_id: purchaseId,
      },
      include: [
        {
          association: 'productData',
          attributes: ['id', 'product_name', 'product_code'],
          required: true,
          include: [
            {
              association: 'productStockEntries',
              attributes: ['id', 'product_id', 'quantity', 'sale_order_recieved', 'warehouse_id'],
              where: {
                warehouse_id: col('SalesProduct.warehouse_id'),
              },
              required: true,
            }
          ]
        },
      ],
    });

    // const updateProductstockEntries = [];
    // // Add quantity to the product stock entries
    // if (parsedStatus === 3) {
    //   for (const product of purchaseProducts) {
    //     product.productData.productStockEntries.forEach(entry => {
    //       updateProductstockEntries.push({
    //         id: entry.id,
    //         company_id: req.user.company_id,
    //         product_id: entry.product_id,
    //         warehouse_id: entry.warehouse_id,
    //         sale_order_recieved:
    //           entry.sale_order_recieved + entry.quantity
    //       });
    //     });
    //   }
    // }
    
    // if (updateProductstockEntries.length > 0) {
    //   await ProductStockEntry.bulkCreate(updateProductstockEntries, {
    //     updateOnDuplicate: ['sale_order_recieved'],
    //     transaction,
    //   });
    // }

    if (!purchaseProducts || purchaseProducts.length === 0) {
      return res.status(400).json({ message: "No products found for this purchase." });
    } else {
      await SalesProduct.update(updateFieldsPdata, {
        where: { sales_id: purchaseId },
        transaction,
      });
    }
    //   const generateInvoiceNumber = () => {
    //     const datePart = new Date()
    //       .toISOString()
    //       .slice(0, 10)
    //       .replace(/-/g, "");
    //     const randomPart = Math.floor(1000 + Math.random() * 9000);
    //     return `INV${datePart}${randomPart}`;
    //   };

    //   const invoiceNumber = generateInvoiceNumber();

    //   await PurchaseProduct.update(
    //     {
    //       production_status: 5,
    //       is_dispatched: true,
    //       is_invoice: true,
    //       invoice_number: invoiceNumber,
    //       invoice_date: new Date(),
    //     },
    //     {
    //       where: {
    //         sales_id: purchaseId,
    //       },
    //     }
    //   );

    //   // 4. Update TrackProductStock for each item
    //   for (const item of purchaseProducts) {
    //     const {
    //       product_id,
    //       qty,
    //       product: { product_name, unit, product_price },
    //     } = item;

    //     if (!qty) {
    //       return res.status(400).json({
    //         message: `Product quantity is missing for ${product_name}`,
    //       });
    //     }

    //     const reference_number = generateReferenceNumber();
    //     const barcode_number = generateBarcodeNumber();

    // const totalIn = await TrackProductStock.sum("quantity_changed", {
    //   where: {
    //     product_id,
    //     company_id: req.user.company_id,
    //     status_in_out: 1,
    //   },
    // });

    // const totalOut = await TrackProductStock.sum("quantity_changed", {
    //   where: {
    //     product_id,
    //     company_id: req.user.company_id,
    //     status_in_out: 0,
    //   },
    // });

    // const currentStock = (totalIn || 0) - (totalOut || 0);
    // const final_quantity = currentStock - qty;

    //     if (final_quantity < 0) {
    //       return res.status(400).json({
    //         message: `Insufficient stock for ${product_name}`,
    //       });
    //     }

    //     await TrackProductStock.create({
    //       product_id,
    //       item_name: product_name,
    //       default_price: product_price,
    //       item_unit: unit,
    //       store_id,
    //       quantity_changed: qty,
    //       status_in_out: 0, // OUT
    //       reference_number,
    //       barcode_number,
    //       user_id: req.user.id,
    //       company_id: req.user.company_id,
    //       adjustmentType: "Delivery to User",
    //       final_quantity,
    //     });
    //   }
    // }

    // end the update

    await Sale.update(updateFields, {
      where: { id: purchaseId },
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({ message: "Records Updated Successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", error);
    return res.status(500).json({
      error: "An error occurred while updating the purchase status",
    });
  }
};

// receive sales product by floor manager
exports.receiveSalesProduct = async (req, res) => {
  const { 
    sales_id, 
    sales_product_id, 
    product_id,
    unit_price,
    product_variant_id,
    quantity, 
    warehouse_id
  } = req.body;

  let transaction = null;
  try {
    // Get the sales product
    const salesProduct = await SalesProduct.findOne({
      attributes: [
        'id', 
        'sales_id', 
        'warehouse_id', 
        'product_id', 
        'product_variant_id', 
        'qty', 
        'unit_price', 
        'tax', 
        'taxExcl', 
        'taxIncl'
      ],
      where: { id: sales_product_id },
      include: [
        {
          association: 'sale',
          attributes: ['id', 'warehouse_id'],
        },
        {
          association: 'sales_product_received',
          attributes: ['id', 'received_quantity', 'rejected_quantity'],
          where: { sales_product_id: sales_product_id },
          required: false,
        }
      ]
    });

    // check if the sales product exists and the quantity is greater than the sales product quantity
    if (!salesProduct) {
      return res.status(400).json({ message: "Sales product not found" });
    } else if (salesProduct.qty < quantity) {
      return res.status(400).json({ message: "Quantity is greater than the sales product quantity" });
    }

    // get the total received quantity
    let totalReceivedQuantity = 0;
    salesProduct.sales_product_received.forEach((received) => {
      totalReceivedQuantity += received.received_quantity;
    });

    // if the total received quantity is equal to the sales product quantity then return error
    if (totalReceivedQuantity === parseInt(salesProduct.qty)) {
      return res.status(400).json({ message: "Sales product already received" });
    }

    // start the transaction
    transaction = await sequelize.transaction();

    let order_quantity = salesProduct.qty;
    let updateSalesProduct = {};

    // If order is not partially received then update the sales product
    if (totalReceivedQuantity === 0 
      && (
        product_id !== parseInt(salesProduct.product_id) || 
        product_variant_id !== parseInt(salesProduct.product_variant_id) ||
        req.body.order_quantity !== salesProduct.qty ||
        unit_price !== salesProduct.unit_price
      )) {

      // Update the sales product if the product id, product variant id, order quantity or unit price is different
        order_quantity = req.body.order_quantity;
        const totalTaxExcl = unit_price * parseInt(order_quantity);
        const tax_amount = totalTaxExcl * (parseInt(salesProduct.tax) / 100);
    
        const totalTaxIncl = totalTaxExcl + tax_amount;
        updateSalesProduct = {
          ...updateSalesProduct,
          qty: order_quantity,
          unit_price: unit_price,
          taxExcl: totalTaxExcl,
          taxIncl: totalTaxIncl,
          taxAmount: tax_amount
        };
  
      updateSalesProduct = {
        ...updateSalesProduct,
        product_id: product_id,
        product_variant_id: product_variant_id,
        warehouse_id: warehouse_id
      };
  
  
      // update the sales product
      await SalesProduct.update(updateSalesProduct, {
        where: { id: sales_product_id },
        transaction,
      });
    }


    // calculate the tax for the received quantity
    const totalTaxExclforReceived = unit_price * parseInt(quantity);
    const tax_amount = totalTaxExclforReceived * (parseInt(salesProduct.tax) / 100);

    const totalTaxInclforReceived = totalTaxExclforReceived + tax_amount;

    // create the sales product received
    await SalesProductReceived.create({
      sales_id: sales_id,
      sales_product_id: sales_product_id,
      product_id: product_id,
      product_variant_id: product_variant_id,
      warehouse_id: warehouse_id,
      company_id: req.user.company_id,
      received_by: req.user.id,
      received_quantity: parseInt(quantity),
      unit_price: unit_price,
      tax: parseInt(salesProduct.tax),
      taxExcl: totalTaxExclforReceived,
      taxIncl: totalTaxInclforReceived,
    }, { transaction });

    // add the quantity to the total received quantity
    totalReceivedQuantity += quantity;
    // Update status of the sales product to 10 if fully received otherwise set to 9
    if (parseInt(order_quantity) === parseInt(totalReceivedQuantity)) {
      await SalesProduct.update({ status: 10 }, {
        where: { id: sales_product_id },
        transaction,
      });
    } else {
      await SalesProduct.update({ status: 9 }, {
        where: { id: sales_product_id },
        transaction,
      });
    }

    // update the stock entry (increase quantity & decrease sale_order_recieved)
    await updateStockEntry(warehouse_id, product_id, product_variant_id, quantity, 10, transaction);

    // commit the transaction
    await transaction.commit();

    // check if all products are dispatched
    const allPurchaseProducts = await SalesProduct.findAll({
      attributes: ['id', 'status'],
      raw: true,
      where: {
        sales_id: salesProduct.sales_id,
      },
    });

    let allDispatched = true;
    for (const product of allPurchaseProducts) {
      if (product.status !== 10) {
        allDispatched = false;
        break;
      }
    }

    // update the sales status to dispatched if all products are dispatched
    if (allDispatched) {
      await Sale.update({ status: 10 }, {
        where: { id: salesProduct.sales_id },
      });
    }

    // Return the response
    return res.status(200).json({
      status: true,
      message: "Sales product received successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error in receiveSalesProduct", error);
    // Rollback the transaction if it exists
    if (transaction) {
      await transaction.rollback();
    }
    return res.status(500).json({
      error: "An error occurred while receiving the sales product",
    });
  }
}

// final dispatch of sales order
exports.finalDispatch = async (req, res) => {
  const { id } = req.params;
  const { products, batches } = req.body;

  const t = await sequelize.transaction(); // start transaction

  try {
    // Check sales order
    const salesOrder = await Sale.findOne({
      attributes: ["id", "status"],
      where: { id },
      transaction: t,
      lock: t.LOCK.UPDATE, // prevents race condition
    });

    if (!salesOrder) {
      await t.rollback();
      return res.status(400).json({ message: "Sales order not found" });
    }

    // Extract sales_product_ids
    const salesProductIds = products.map(p => p.sales_product_id);

    // Bulk update dispatched products
    await SalesProduct.update(
      {
        status: 11,
      },
      {
        where: {
          id: salesProductIds,
          sales_id: salesOrder.id,
        },
        transaction: t,
      }
    );

    // Update delivery_note separately if different per product
    // (If delivery_note is same for all, include above)
    const salesProductPromises = [];
    products.forEach(product => {
      salesProductPromises.push(SalesProduct.update(
        { delivery_note: product.delivery_note },
        {
          where: { id: product.sales_product_id },
          transaction: t,
        }
      ));
    });
    await Promise.all(salesProductPromises);

    // if batches are present then create the track batch product log
    if (batches.length > 0) {
      const batchPromises = [];

      batches.forEach(batch => {
        batchPromises.push(
          new Promise(async (resolve, reject) => {
            try {
              const receiveProductBatch = await ReceiveProductBatch.findOne({
                attributes: ['id', 'quantity', 'purchase_id', 'warehouse_id', 'available_quantity', 'product_variant_id'],
                where: { id: batch.batch_id },
                transaction: t,
              });
              if (!receiveProductBatch) {
                reject(new Error("Receive product batch not found"));
              }
              await TrackBatchProductLog.create(
                {
                  sales_id: salesOrder.id,
                  sales_product_id: batch.sales_product_id,
                  product_variant_id: receiveProductBatch.product_variant_id,
                  status: 1,
                  user_id: req.user.id,
                  company_id: req.user.company_id,
                  purchase_id: receiveProductBatch.purchase_id,
                  warehouse_id: receiveProductBatch.warehouse_id,
                  receive_product_batch_id: batch.batch_id,
                  quantity: batch.quantity,
                },
                {
                  transaction: t,
                }
              );
              await ReceiveProductBatch.update({
                available_quantity: receiveProductBatch.available_quantity - batch.quantity,
              }, {
                where: { id: batch.batch_id },
                transaction: t,
              });
              resolve();
            } catch (error) {
              console.error("Error in batchPromises", error);
              reject(error);
            }
          })
        );
      });
      await Promise.all(batchPromises);
    }

    // Check if any product is NOT dispatched
    const notDispatchedCount = await SalesProduct.count({
      where: {
        sales_id: salesOrder.id,
        status: { [Op.ne]: 11 },
      },
      transaction: t,
    });

    // If all dispatched → update Sale
    if (notDispatchedCount === 0) {
      await Sale.update(
        { status: 11 },
        { where: { id: salesOrder.id }, transaction: t }
      );
    }

    // Commit transaction
    await t.commit();

    return res.status(200).json({
      status: true,
      message: "Sales order final dispatch successfully",
    });

  } catch (error) {
    await t.rollback(); // rollback everything
    console.error("Error in finalDispatch", error);

    return res.status(500).json({
      error: "An error occurred while final dispatching the sales order",
    });
  }
};

/**
 * Get all available batches for a sales order (by sales_id)
 * Looks up the sales order warehouse and products, then returns batches available in that warehouse.
 * @param {object} req
 * @param {object} req.params
 * @param {number} req.params.id - Sales Order ID
 */
exports.getAvailableBatchesForSaleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    const sale = await Sale.findOne({
      where: { id, company_id },
      attributes: ['id', 'warehouse_id'],
      include: [
        {
          association: 'products',
          attributes: ['id', 'warehouse_id', 'description', 'qty', 'unit_price', 'tax', 'taxExcl', 'taxIncl', 'taxAmount'],
          include: [
            {
              association: 'productData',
              attributes: ['id', 'product_name', 'product_code'],
              include: [
                {
                  association: 'batches',
                  attributes: ['id', 'product_id', 'batch_no', 'manufacture_date', 'expiry_date', 'quantity', 'available_quantity'],
                  where: { 
                    available_quantity: { [Op.gt]: 0 },
                    warehouse_id: col('products.warehouse_id')
                  },
                  required: false,
                  include: [
                    {
                      association: 'trackBatchProductLogs',
                      attributes: ['id', 'status', 'quantity'],
                      where: { status: 1 },
                    }
                  ]
                }
              ]
            }
          ]
        },
      ],
    });

    // check if the sales order exists
    if (!sale) {
      return res.status(404).json({ status: false, message: "Sales order not found" });
    }
    // Return the response
    return res.status(200).json({
      status: true,
      message: "Available batches fetched successfully",
      data: {
        sale: sale
      },
    });
  } catch (error) {
    console.error("Error in getAvailableBatchesForSaleOrder", error);
    return res.status(500).json({
      status: false,
      message: "Error getting available batches",
      error: error.message,
    });
  }
};

// Get all products for a specific purchase
exports.dispatchProduct = async (req, res) => {
  const { spid } = req.params;
  let transaction = null;

  try {
    if (!spid || isNaN(spid)) {
      return res.status(400).json({ error: "Invalid purchase ID" });
    }

    // check if the product is already dispatched
    const salesProduct = await SalesProduct.findOne({
      attributes: ['id', 'sales_id', 'product_id', 'status', 'qty'],
      raw: true,
      nest: true,
      where: {
        id: spid,
        status: { [Op.ne]: 10 }, // not dispatched
      },
      include: [
        {
          association: 'sale',
          attributes: ['id', 'warehouse_id'],
        }
      ]
    });

    // check if there is any product exists for this sales id
    if (!salesProduct) {
      return res.status(400).json({ message: "Sales product not found" });
    }

    // check if the product is already dispatched
    if (salesProduct.status === 10) {
      return res.status(400).json({ message: "Product already dispatched" });
    }

    transaction = await sequelize.transaction();

    // update the product status to dispatched
    await SalesProduct.update({ status: 10 }, {
      where: { id: spid },
      transaction,
    });

    // update the stock entry (increase quantity & decrease sale_order_recieved)
    await updateStockEntry(salesProduct.sale.warehouse_id, salesProduct.product_id, salesProduct.qty, 10, transaction);

    // commit the transaction
    await transaction.commit();

    // check if all products are dispatched
    const allPurchaseProducts = await SalesProduct.findAll({
      attributes: ['id', 'status'],
      raw: true,
      where: {
        sales_id: salesProduct.sales_id,
      },
    });

    let allDispatched = true;
    for (const product of allPurchaseProducts) {
      if (product.status !== 10) {
        allDispatched = false;
        break;
      }
    }

    // update the sales status to dispatched if all products are dispatched
    if (allDispatched) {
      await Sale.update({ status: 10 }, {
        where: { id: salesProduct.sales_id },
      });
    }

    return res.status(200).json({
      status: true,
      message: "Product dispatched successfully",
      data: { allDispatched }
    });
  } catch (error) {
    console.log("Error in dispatchProduct", error);
    // rollback the transaction if it exists
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    return res.status(error.status || 500).json({
      error: error.message || "An error occurred while dispatching the product",
    });
  }
};

//get products
exports.GetProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, id: user_id } = req.user;

    // Fetch purchase data
    const purchaseData = await SalesProduct.findAll({
      where: {
        sales_id: id,
        company_id: company_id,
        user_id: user_id,
      },
      include: [{ model: Product, as: "ProductsItem" }],
    });

    // Check if purchaseData is empty
    if (purchaseData.length === 0) {
      return res.status(404).json({ error: "No purchases found" });
    }

    res.status(200).json(purchaseData);
  } catch (error) {
    console.error("Error fetching purchase:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the purchase" });
  }
};

exports.DeletePurchase = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const purchaseData = await Sale.findOne({
      where: { id: req.params.id },
      include: [SalesProduct],
    });

    if (!purchaseData) {
      return res.status(404).json({ error: "Purchase not found" });
    }
    if (purchaseData.is_parent == 0) {
      await purchaseData.update({ status: 0 }, { transaction });

      await SalesProduct.update(
        { status: 0 },
        { where: { sales_id: purchaseData.id }, transaction }
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
    const products = await Sale.findAll({
      where: {
        company_id: req.user.company_id,
        //user_id: req.user.id,
        [Op.and]: [
          {
            status: {
              [Op.eq]: 4,
            },
          },
        ],
      },
      include: [
        {
          association: "products",
        },
        {
          association: "customer",
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

//done list
exports.GetAllPurchaseOrderDone = async (req, res) => {
  try {
    const products = await Sale.findAll({
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: 6,
      },
      include: [
        {
          association: "products",
          include: [{ model: Product, as: "ProductsItem" }],
        },
        {
          association: "customer",
        },
        // {
        //   association: "productsreprodut",
        //   include: [{ model: PurchaseProductRe, as: "productsre" }],
        // },
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
exports.GetAllPurchaseOrderCompare = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await Sale.findOne({
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        id: id,
      },
      include: [
        {
          association: "products",
          include: [{ model: Product, as: "ProductsItem" }],
        },
        {
          association: "customer",
        },
        // {
        //   model: PurchaseRe,
        //   as: "productsreprodut",
        //   include: [
        //     {
        //       model: PurchaseProductRe,
        //       as: "productsre",
        //       include: [{ model: Product, as: "ProductsItemre" }],
        //     },
        //   ],
        // },
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
    const products = await Sale.findAll({
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        [Op.and]: [
          {
            status: {
              [Op.eq]: 5,
            },
          },
        ],
      },
      include: [
        {
          association: "products",
        },
        {
          association: "customer",
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
    const products = await Sale.findAll({
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        [Op.and]: [
          {
            status: {
              [Op.gte]: 5,
            },
          },
          {
            status: {
              [Op.ne]: 8,
            },
          },
          {
            status: {
              [Op.ne]: 10,
            },
          },
          {
            status: {
              [Op.ne]: 7,
            },
          },
        ],
      },
      include: [
        {
          association: "products",
        },
        {
          association: "customer",
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
exports.pendingApproval = async (req, res) => {
  // return res.send('yesy');
  try {
    const products = await Sale.findAll({
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: 3,
      },
      include: [
        {
          association: "products",
        },
        {
          association: "customer",
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
//final approval

//// insert remarks
exports.insertRemarks = async (req, res) => {
  try {
    // Create the new remarks
    const remarksData = await SalesRemarks.create({
      sales_id: req.body.sales_id,
      remarks: req.body.editorContent,
      user_id: req.user.id,
    });

    // Return the success response
    res.status(201).json({
      success: true,
      message: "Remarks added successfully",
      data: remarksData,
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
    // Get all remarks for the sales order
    const remarks = await SalesRemarks.findAll({
      attributes: ['id', 'remarks', 'created_at'],
      where: { sales_id: req.params.id },
      order: [["created_at", "DESC"]],
      raw: true,
      nest: true,
      include: [
        {
          association: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    // Return the success response
    res.status(200).json({
      success: true,
      data: remarks,
    });
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).json({ error: "Server error", message: err.message });
  }
};

/**
 * Get all remarks of a sales order (without pagination)
 */
exports.GetSaleOrderRemarks = async (req, res) => {
  try {
    const saleId = req.params.id;

    const remarks = await SalesRemarks.findAll({
      attributes: ['id', 'remarks', 'created_at'],
      where: { sales_id: saleId },
      order: [['created_at', 'DESC']],
      raw: true,
      nest: true,
      include: [
        {
          association: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    return res.status(200).json({
      status: true,
      message: 'Sale order remarks fetched successfully',
      data: remarks,
    });
  } catch (error) {
    console.error('GetSaleOrderRemarks error:', error);
    return res.status(500).json({
      status: false,
      message: 'Error fetching sale order remarks',
      error: error.message,
    });
  }
};

//insert advance payment
exports.insertAdvancePayment = async (req, res) => {
  try {
    // Create the new remarks
    const purchaseData = await AdvancePayment.create({
      amount: req.body.amount,
      sales_id: req.body.purchase_id,
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

//bill
exports.PaymentRecords = async (req, res) => {
  try {
    // Create the new remarks
    const paymentdata = await Payment.create({
      sales_id: req.params.id,
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
    await Purchase.update({ status: 7 }, { where: { id: req.params.id } });
    await Bill.update({ status: 3 }, { where: { sales_id: req.params.id } });
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

    await Sale.update(updateFields, {
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
* @description Generate PDF for sales order
* @param {number} id - The ID of the sales order
* @returns {Promise<void>} - The PDF buffer
*/
exports.generatePDFForvendor = async (req, res) => {
  const { id } = req.params;

  try {
    const salesOrder = await Sale.findOne({
      attributes: [
        'id', 
        'reference_number', 
        'total_amount', 
        'untaxed_amount', 
        'total_amount', 
        'expected_delivery_date',
        'payment_terms'
      ],
      where: { id },
      include: [
        {
          association: "products",
          attributes: ['id', 'product_id', 'qty', 'unit_price', 'tax', 'taxExcl', 'taxIncl'],
          include: [
            { 
              association: 'productData',
              attributes: ['id', 'product_name', 'product_code'],
              include: [
                {
                  association: 'masterBrand',
                  attributes: ['id', 'name'],
                }
              ]
            },
            {
              association: 'productVariant',
              attributes: ['id', 'weight_per_unit'],
              include: [
                {
                  association: 'masterUOM',
                  attributes: ['id', 'name', 'label'],
                }
              ]
            }
          ],
        },
        { 
          association: "customer",
          attributes: ['id', 'name', 'address', 'phone', 'email']
        }
      ],
    });

    // Throw error if no data found
    if (!salesOrder) return res.status(404).send("No data found");

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

    // Throw error if settings not found
    if (!fetchSettings) return res.status(404).send("Settings not found");
    // Get template path

    let subTotal = 0;
    let totalTax = 0;
    let grandTotal = 0;
    salesOrder.products.forEach(product => {
      const taxExcl = Number(parseFloat(product.taxExcl)) || 0;
      const taxIncl = Number(parseFloat(product.taxIncl)) || 0;
      subTotal += taxExcl;
      totalTax += taxIncl - taxExcl;
      grandTotal += taxIncl;
    });

    const customer = salesOrder.customer;

    const templatePath = path.join(__dirname, "../templates", `template1.html`);
    let templateData;
    try {
      templateData = fs.readFileSync(templatePath, 'utf8');
    } catch (err) {
      console.error('Error reading template:', err);
      return res.status(500).send('Template not found');
    }
    // Read template file
    const template = handlebars.compile(templateData);

    // const advanceAmount = salesOrder.advance?.amount || 0;
    // Prepare data for the template
    const grandTotalNum = Number(grandTotal) || 0;
    const hasVariant = salesOrder.products.some(product => product.productVariant);

    // Prepare data for the template
    const data = {
      subtotal: subTotal.toFixed(2),
      total_tax: totalTax.toFixed(2),
      grand_total: grandTotalNum.toFixed(2),
      amount_in_words: Number.isFinite(grandTotalNum) ? `${numberToWords.toWords(grandTotalNum)} rupees Only` : "Zero rupees Only",
      products: salesOrder.products.map(product => ({
        description: product.productData?.product_name || "",
        product_code: product.productData?.product_code || "",
        brand: product.productData?.masterBrand.name || "",
        tax: product.tax,
        dateReq: moment(salesOrder.expected_delivery_date).format('DD/MM/YYYY'),
        qty: product.qty,
        unitPrice: parseFloat(product.unit_price).toFixed(2),
        amount: parseFloat(product.taxExcl).toFixed(2),
        weight_per_unit: `${product.productVariant.weight_per_unit} ${product.productVariant.masterUOM.label}`,
        total_weight: CommonHelper.formatTotalWeight(
          product.productVariant.weight_per_unit,
          product.qty,
          product.productVariant.masterUOM.label
        ),
      })),
      customer: {
        name: customer?.name || "",
        address: customer?.address || "",
        gstin: customer?.gstin || "",
        // city: customer?.city || "",
        // state: customer?.state || "",
        // country: customer?.country || "",
        // zip: customer?.zip || "",
        phone: customer?.phone || "",
        email: customer?.email || "",
        // website: customer?.website || "",
      },
      otherInfo: {
        hasVariant: hasVariant,
        refnumber: salesOrder.reference_number,
        UntaxedAmount: parseFloat(salesOrder.untaxed_amount).toFixed(2),
        total_amount: parseFloat(salesOrder.total_amount).toFixed(2),
        payment_terms: salesOrder.payment_terms ? `${salesOrder.payment_terms} days` : "",
        // advancepayment: advanceAmount,
        // buyer: salesOrder?.buyer ?? '',
        expected_delivery_date: moment(salesOrder.expected_delivery_date).format('DD/MM/YYYY'),
        today: moment().format('DD/MM/YYYY'),

        deliveryAddress: fetchSettings.deliveryAddress,
        signature: fetchSettings.signature,
        // comp: Companydetails.company_name,
        // compadd: Companydetails.address,
        // gstin: Companydetails.gst,
        // contact: Companydetails.contact_phone,
      },
      company: {
        name: Companydetails.company_name,
        address: Companydetails.address,
        gstin: Companydetails.gst,
        contact: Companydetails.contact_phone,
      }
    };

    const html = template(data);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // ✅ Continue with original behavior — send PDF to browser
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="sales_order_${salesOrder.reference_number}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Sales orderPDF Generation Error:", err);
    res.status(500).send("Failed to generate PDF");
  }
};

exports.generatePDF = async (id, cid) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await Sale.findOne({
        where: { id },
        include: [
          {
            association: "products",
            include: [{ model: Product, as: "ProductsItem" }],
          },
          { association: "customer" },
          { model: AdvancePayment, as: "advance" },
        ],
      });

      // Fetch settings
      const fetchSettings = await GeneralSettings.findOne({
        where: {
          company_id: cid,
        },
      });
      const jsonData = response;
      if (jsonData) {
        const templatePath = path.join(
          __dirname,
          "../templates",
          "salesOrderTemplate.html"
        );
        const template = fs.readFileSync(templatePath, "utf8");
        const compileTemplate = handlebars.compile(template);
        const advanceAmount =
          jsonData.advance && jsonData.advance.amount != null
            ? parseFloat(jsonData.advance.amount)
            : 0;

        // Prepare data for the template
        const data = {
          products: jsonData.products.map((product) => ({
            description: product.ProductsItem.product_name,
            tax: product.tax,
            dateReq: new Date(jsonData.expected_arrival).toLocaleString(),
            qty: product.qty,
            unitPrice:
              fetchSettings.symbol +
              " " +
              parseFloat(product.unit_price).toFixed(2),
            amount:
              fetchSettings.symbol +
              " " +
              parseFloat(product.taxExcl).toFixed(2),
          })),
          vendor: {
            vendorName: jsonData.customer.name,
            address: jsonData.customer.address,
            city: jsonData.customer.city,
            state: jsonData.customer.state,
            country: jsonData.customer.country,
            zip: jsonData.customer.zip,
            phone: jsonData.customer.phone,
            email: jsonData.customer.email,
            website: jsonData.customer.website,
            logofile:
              jsonData.customer.attachment_file != null
                ? "http://localhost:5000/uploads/" +
                jsonData.vendor.attachment_file
                : "http://localhost:5000/uploads/no-image.svg",
          },
          otherInfo: {
            refnumber: jsonData.reference_number,
            UntaxedAmount:
              fetchSettings.symbol +
              " " +
              parseFloat(jsonData.untaxed_amount).toFixed(2),
            total_amount:
              fetchSettings.symbol +
              " " +
              parseFloat(jsonData.total_amount - advanceAmount).toFixed(2),
            totalAmountInWords: numberToWords.toWords(
              parseFloat(jsonData.total_amount - advanceAmount)
            ),
            advancepayment: fetchSettings.symbol + " " + advanceAmount,
            buyer: jsonData.buyer,
            dateline: new Date(jsonData.expiration).toLocaleString(),
            signature: fetchSettings.signature,
          },
        };

        const html = compileTemplate(data);

        // Use wkhtmltopdf to create PDF
        const pdfPath = path.join(
          __dirname,
          `../pdf/purchase_order_${jsonData.reference_number}.pdf`
        );

        wkhtmltopdf(html, { output: pdfPath, pageSize: "A4" }, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(pdfPath);
          }
        });
      } else {
        reject(new Error("No data found"));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      reject(error);
    }
  });
};
exports.sendEmail = async (pdfPath, recipientEmail, jsonData) => {
  try {
    // Load email template
    const templatePath = path.join(
      __dirname,
      "../templates",
      "emailTemplate.html"
    );
    const template = fs.readFileSync(templatePath, "utf8");
    const compileTemplate = handlebars.compile(template);

    // Prepare data for the template
    const advanceAmount =
      jsonData.advance && jsonData.advance.amount != null
        ? parseFloat(jsonData.advance.amount)
        : 0;
    const emailData = {
      vendorName: jsonData.customer.name,
      referenceNumber: jsonData.reference_number,
      buyer: jsonData.buyer,
      totalAmount: parseFloat(jsonData.total_amount - advanceAmount).toFixed(2),
      expectedArrival: new Date(jsonData.expected_arrival).toLocaleString(),
    };

    const emailContent = compileTemplate(emailData);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "growthh.in@gmail.com",
        pass: "ropdipfufoimwdka",
      },
    });

    const subject = `${jsonData.customer.name} Order (Ref ${jsonData.reference_number})`;

    const mailOptions = {
      from: "notifications@growthh.in",
      to: recipientEmail,
      subject: subject,
      html: emailContent,
      attachments: [
        {
          filename: "Purchase_Order.pdf",
          path: pdfPath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

exports.SendMailByPO = async (req, res) => {
  try {
    // const data = req.body;
    const pdfPath = await exports.generatePDF(
      req.params.id,
      req.user.company_id
    );
    const response = await Sale.findOne({
      where: { id: req.params.id },
      include: [
        {
          association: "products",
          include: [{ model: Product, as: "ProductsItem" }],
        },
        { association: "customer" },
        { model: AdvancePayment, as: "advance" },
      ],
    });

    await exports.sendEmail(pdfPath, response.customer.email, response);

    const advanceAmount =
      response.advance && response.advance.amount != null
        ? response.advance.amount
        : "0.00";
    const remainingAmount =
      parseFloat(response.total_amount) - parseFloat(advanceAmount);
    const formattedAmount = remainingAmount.toFixed(2);

    const whatsappMessageContent = `Dear ${response.customer.name
      },\n\nYour sales order ${response.reference_number
      } amounting to  ${formattedAmount} from ${response.buyer
      }. The receipt is expected on ${new Date(
        response.expected_arrival
      ).toLocaleString()}. For more details, please check your email.`;

    MaytapiWhatsappNotification(
      "91" + response.customer.mobile,
      whatsappMessageContent
    );
    res.status(200).send("Email sent successfully");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error sending email");
  }
};

exports.SendMailUpdate = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "Invalid purchase ID" });
  }
  try {
    // Update the status of the purchase
    await Sale.update(
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
        error: "sales_id and content are required",
      });
    }

    // Create the new remarks
    const purchaseData = await Followup.create({
      sales_id: req.body.getPid,
      content: req.body.editorContent,
      next_followup_date: req.body.getfolowup,
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
exports.AddRecv = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {

    // Initialize totalPurchaseAmount and untaxedAmount
    let totalPurchaseAmount = 0;
    let untaxedAmount = 0;

    // Calculate totalPurchaseAmount and untaxedAmount from products
    const products = req.body.products || [];

    if (products.length > 0) {
      products.forEach((product) => {
        const received = parseFloat(product.received);
        const unit_price = parseFloat(product.unit_price);
        const taxRate = parseFloat(product.tax); // Assuming taxRate is a decimal like 0.18 for 18%

        const productUntaxedAmount = received * unit_price;
        const productTotalAmountp = (productUntaxedAmount * taxRate) / 100;
        const productTotalAmount = productUntaxedAmount + productTotalAmountp;

        totalPurchaseAmount += productTotalAmount;
        untaxedAmount += productUntaxedAmount;

        sgstRate = parseFloat(taxRate) / 100;
        cgstRate = parseFloat(taxRate) / 100;
      });
    }

    // Calculate SGST and CGST based on the untaxedAmount
    const sgst = (untaxedAmount * sgstRate) / 2;
    const cgst = (untaxedAmount * cgstRate) / 2;

    // Create Bill record
    const purchaseData = await Recv.create(
      {
        vendor_id: req.body.vendor_id,
        sales_id: req.params.id,
        bill_number: req.body.bill_number,
        bill_reference: req.body.bill_reference,
        bill_date: new Date().toJSON().slice(0, 16),
        placeofsupply: req.body.placeofsupply,
        buyer: req.body.buyer,
        untaxed_amount: untaxedAmount,
        sgst: sgst,
        cgst: cgst,
        total_amount: totalPurchaseAmount,
        user_id: req.user.id,
        company_id: req.user.company_id,
      },
      { transaction }
    );

    // Create BillProduct records
    if (products.length > 0) {
      const productPromises = products.map(async (product) => {

        const received = parseFloat(product.received);
        const unit_price = parseFloat(product.unit_price);
        const taxRate = parseFloat(product.tax);

        const totalAmount = received * unit_price;
        const taxExcl = totalAmount;
        const taxInclp = (totalAmount * taxRate) / 100;
        const taxIncl = totalAmount + taxInclp;

        await RecvProduct.create(
          {
            bill_id: purchaseData.id,
            product_id: product.product_id,
            description: product.description,
            qty: product.qty, // You can keep the qty if needed for reference
            available_quantity: product.qty,
            unit_price: unit_price,
            tax: taxRate,
            taxExcl: taxExcl,
            taxIncl: taxIncl,
            vendor_id: product.vendor_id,
            user_id: req.user.id,
            company_id: req.user.company_id,
            received: received,
            rejected: product.rejected,
            sales_id: req.params.id,
          },
          { transaction }
        );
      });

      await Promise.all(productPromises);
    }

    await transaction.commit();

    // Fetch the updated purchase data to respond with
    const updatedPurchase = await Recv.findByPk(purchaseData.id, {
      include: [{ model: RecvProduct, as: "recvPro" }],
    });

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

// get recv
exports.getRecv = async (req, res) => {
  const { id } = req.params;

  try {
    const purchaseData = await Recv.findAll({
      where: {
        sales_id: id,
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: { [Op.ne]: 0 },
      },
      include: [
        {
          model: RecvProduct,
          as: "recvPro",
          include: [{ model: Product, as: "ProductsItem" }],
        },

        { association: "customer" },
      ],
    });

    if (!purchaseData) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    res.status(200).json(purchaseData);
  } catch (error) {
    console.error("Error fetching purchase data:", error);
    res.status(500).json({
      error: "An error occurred while fetching the purchase data",
      details: error.message,
    });
  }
};

// upload PO
exports.UploadPo = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(req.file);

    if (req.file) {
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      if (fileExtension !== ".pdf") {
        return res
          .status(400)
          .json({ status: false, message: "Only PDF files are allowed" });
      }
      const poFolder = path.join(__dirname, "../uploads/PO");
      if (!fs.existsSync(poFolder)) {
        fs.mkdirSync(poFolder, { recursive: true });
      }
      const filename = `PO_${id}_${Date.now()}${fileExtension}`;
      const filePath = path.join(poFolder, filename);
      fs.renameSync(req.file.path, filePath);
      await Purchase.update(
        { uploadpo: filename },
        {
          where: {
            id: id,
          },
        }
      );
    }

    return res.status(200).json({ status: true, message: "Success" });
  } catch (err) {
    console.error("Error adding po:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//get total reject count
exports.GetAllPurchaseRejectcount = async (req, res) => {
  try {
    // Define the query conditions
    const queryConditions = {
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: {
          [Op.and]: [
            { [Op.ne]: 0 },
            {
              [Op.or]: [{ [Op.eq]: 8 }],
            },
          ],
        },
      },
    };

    // Get the count of total records
    const totalCount = await Sale.count(queryConditions);

    // Fetch the products data
    const products = await Sale.findAll(queryConditions);

    // Respond with the products and total count
    res.status(200).json({
      totalCount,
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the products" });
  }
};

// total done
exports.GetAllPurchasedonecount = async (req, res) => {
  try {
    // Define the query conditions
    const queryConditions = {
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: {
          [Op.and]: [
            { [Op.ne]: 0 },
            {
              [Op.or]: [{ [Op.eq]: 6 }],
            },
          ],
        },
      },
    };

    // Get the count of total records
    const totalCountdone = await Sale.count(queryConditions);

    // Fetch the products data
    const products = await Sale.findAll(queryConditions);

    // Respond with the products and total count
    res.status(200).json({
      totalCountdone,
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the products" });
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
        user_id: req.user.id,
        status: {
          [Op.and]: [
            { [Op.ne]: 0 },
            {
              [Op.or]: [{ [Op.eq]: 2 }],
            },
          ],
        },
      },
    };

    // Get the count of total records
    const totalCountrfq = await Sale.count(queryConditions);

    // Respond with the products and total count
    res.status(200).json({
      totalCountrfq,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the products" });
  }
};

//approved
exports.GetAllPurchaseapp = async (req, res) => {
  try {
    // Define the query conditions
    const queryConditions = {
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: {
          [Op.and]: [
            { [Op.ne]: 0 },
            {
              [Op.or]: [{ [Op.eq]: 4 }],
            },
          ],
        },
      },
    };
    // Get the count of total records
    const totalCountapp = await Sale.count(queryConditions);

    // Respond with the products and total count
    res.status(200).json({
      totalCountapp,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the products" });
  }
};

// order confirm
exports.GetAllPurchasOconfir = async (req, res) => {
  try {
    // Define the query conditions
    const queryConditions = {
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: 5,
      },
    };
    // Get the count of total records
    const totalCountocon = await Sale.count(queryConditions);
    // Respond with the products and total count
    res.status(200).json({
      totalCountocon,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the products" });
  }
};
// Bill Created
exports.GetAllBillcreated = async (req, res) => {
  try {
    // Define the query conditions
    const queryConditions = {
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: 6,
      },
    };
    // Get the count of total records
    const totalCountbill = await Sale.count(queryConditions);
    // Respond with the products and total count
    res.status(200).json({
      totalCountbill,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the products" });
  }
};

// get done count vendorwise
exports.GetDoneVendorwise = async (req, res) => {
  try {
    // Define the query conditions for the initial count
    const queryConditions = {
      where: {
        company_id: req.user.company_id,
        user_id: req.user.id,
        status: {
          [Op.and]: [{ [Op.ne]: 0 }],
        },
      },
    };

    // Get the count of total records
    // const totalCountapp = await Purchase.count(queryConditions);

    // Get the count of records grouped by vendor_id where status is 7
    const vendorStatus7Count = await Sale.findAll({
      where: {
        status: 7,
      },
      include: [{ association: "customer" }],
      attributes: [
        "vendor_id",
        [Sequelize.fn("COUNT", Sequelize.col("vendor_id")), "count"],
      ],
      group: ["vendor_id"],
    });

    // Respond with the products, total count, and vendor status 7 count
    res.status(200).json({
      vendorStatus7Count,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the products" });
  }
};
//get total

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
    a.sales_id = b.sales_id
WHERE 
    a.user_id = ${req.user.id} 
    AND a.company_id = ${req.user.company_id}
GROUP BY 
    a.created_at;`);
    const purchaseData = results;
    if (!purchaseData.length) {
      // Check if the array is empty

      return res.status(404).json({ error: "No purchase data found" });
    }

    res.status(200).json(purchaseData);
  } catch (error) {
    console.error("Error fetching purchase data:", error);
    res.status(500).json({
      error: "An error occurred while fetching the purchase data",
      details: error.message,
    });
  }
};

//revised quote entry
exports.AddRevisedPurchase = async (req, res) => {
  const transaction = await sequelize.transaction();
  const { salesid } = req.params;

  try {
    let purchaseData;

    const existingPurchase = await PurchaseRe.findOne({
      where: { sales_id: salesid },
      transaction,
    });

    if (existingPurchase) {
      await PurchaseProductRe.destroy({
        where: {
          sales_id: salesid,
        },
        transaction,
      });

      await existingPurchase.update(
        {
          customer_id: req.body.customer_id,
          customer_reference: req.body.customer_reference,
          expiration: req.body.expiration,
          dalivery_date: req.body.dalivery_date,
          buyer: req.body.buyer,
          source_document: req.body.source_document,
          payment_terms: req.body.payment_terms,
          total_amount: req.body.total_amount,
          untaxed_amount: req.body.untaxed_amount,
          user_id: req.user.id,
          company_id: req.user.company_id,
          mailsend_status: req.body.mailsend_status || "0",
        },
        { transaction }
      );

      purchaseData = existingPurchase;
    } else {
      purchaseData = await PurchaseRe.create(
        {
          sales_id: salesid,
          customer_id: req.body.customer_id,
          customer_reference: req.body.customer_reference,
          expiration: req.body.expiration,
          dalivery_date: req.body.dalivery_date,
          buyer: req.body.buyer,
          source_document: req.body.source_document,
          payment_terms: req.body.payment_terms,
          total_amount: req.body.total_amount,
          untaxed_amount: req.body.untaxed_amount,
          user_id: req.user.id,
          company_id: req.user.company_id,
          mailsend_status: req.body.mailsend_status || "0",
        },
        { transaction }
      );
    }

    // Re-insert products
    if (req.body.products && req.body.products.length > 0) {

      const productPromises = req.body.products.map(async (product) => {
        const productTotal = product.qty * product.unit_price;
        const taxAmount = (product.tax / 100) * productTotal;
        const totalWithTax = productTotal + taxAmount;

        await PurchaseProductRe.create(
          {
            sales_id: salesid,
            sales_re_id: purchaseData.id,
            customer_id: req.body.customer_id,
            product_id: product.product_id,
            description: product.description,
            qty: product.qty,
            unit_price: product.unit_price,
            tax: product.tax,
            total_amount: req.body.total_amount,
            taxExcl: product.taxExcl,
            taxIncl: totalWithTax, // Store total including tax
            vendor_id: req.body.vendor_id,
            user_id: req.user.id,
            company_id: req.user.company_id,
          },
          { transaction }
        );
      });

      await Promise.all(productPromises);

      const totalPurchaseAmount = req.body.products.reduce((total, product) => {
        const productTotal = product.qty * product.unit_price;
        const taxAmount = (product.tax / 100) * productTotal;
        return total + productTotal + taxAmount;
      }, 0);

      await PurchaseRe.update(
        { total_amount: totalPurchaseAmount },
        { where: { id: purchaseData.id }, transaction }
      );

    }

    await transaction.commit();

    const updatedPurchase = await PurchaseRe.findByPk(purchaseData.id);

    res.status(200).json({
      ...updatedPurchase.toJSON(),
      total_amount: updatedPurchase.total_amount,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
      console.error("Transaction rolled back due to error:", error);
    } else {
      console.error("Error occurred after transaction commit:", error);
    }
    res.status(500).json({
      error:
        "An error occurred while creating or updating the purchase and products",
    });
  }
};

exports.GetAllCustomerCount = async (req, res) => {
  try {
    // Fetch all users with status 1
    const users = await Customer.findAll({
      where: {
        company_id: req.user.company_id,
      },
    });

    // Calculate the total count of users
    const totalCount = users.length;

    // Respond with the users and total count
    return res.status(200).json({
      message: true,
      totalCountuser: totalCount,
    });
  } catch (err) {
    // Handle errors and respond with a 400 status code
    return res.status(400).json(err);
  }
};

//workorderlisting
exports.GetAllWorkOrder = async (req, res) => {
  try {
    if (!req.user?.company_id) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const workOrders = await SalesProduct.findAll({
      where: {
        company_id: req.user.company_id,
        status: 11,
        is_deleted: { [Op.ne]: 1 },
      },
      include: [
        {
          association: "purchase",
          required: true,
          where: {

            mailsend_status: 1,
          },
          attributes: [
            "id",
            "reference_number",
            "customer_id",
            "total_amount",
            "expiration",
            "created_at",
          ],
          include: [
            { model: Customer, as: "customer", attributes: ["id", "name"] },
            { model: User, as: "createdByUser", attributes: ["id", "name"] },
          ],
        },
        {
          model: Product,
          as: "ProductsItem",
          attributes: ["id", "product_name", "product_code", "unit"],
          include: [
            {
              model: MasteruomModel,
              as: "Masteruom",
              attributes: ["unit_name"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(workOrders);
  } catch (error) {
    console.error("Error fetching work orders:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
exports.GetAllDdone = async (req, res) => {
  try {
    if (!req.user?.company_id) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const workOrders = await SalesProduct.findAll({
      where: {
        company_id: req.user.company_id,
        is_deleted: { [Op.ne]: 1 },
      },
      include: [
        {
          association: "purchase",
          required: true,
          where: {
            mailsend_status: 1,
          },
          attributes: [
            "id",
            "reference_number",
            "customer_id",
            "total_amount",
            "expiration",
            "created_at",
          ],
          include: [
            { model: Customer, as: "customer", attributes: ["id", "name"] },
            { model: User, as: "createdByUser", attributes: ["id", "name"] },
          ],
        },
        {
          model: Product,
          as: "ProductsItem",
          attributes: ["id", "product_name", "product_code", "unit"],
          include: [
            {
              model: MasteruomModel,
              as: "Masteruom",
              attributes: ["unit_name"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(workOrders);
  } catch (error) {
    console.error("Error fetching work orders:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
// exports.GetAlldispatchlist = async (req, res) => {
//   try {
//     if (!req.user?.company_id) {
//       return res.status(400).json({ error: "Company ID is required" });
//     }

//     const workOrders = await PurchaseProduct.findAll({
//       where: {
//         company_id: req.user.company_id,
//         status: 10,
//         is_deleted: { [Op.ne]: 1 },
//       },
//       include: [
//         {
//           model: Purchase,
//           as: "purchase",
//           required: true,
//           where: {

//             mailsend_status: 1,
//           },
//           attributes: [
//             "id",
//             "reference_number",
//             "customer_id",
//             "total_amount",
//             "expiration",
//             "created_at",
//           ],
//           include: [
//             { model: Customer, as: "customer", attributes: ["id", "name"] },
//             { model: User, as: "createdByUser", attributes: ["id", "name"] },
//           ],
//         },
//         {
//           model: Product,
//           as: "ProductsItem",
//           attributes: ["id", "product_name", "product_code", "unit"],
//           include: [
//             {
//               model: MasteruomModel,
//               as: "Masteruom",
//               attributes: ["unit_name"],
//             },
//           ],
//         },
//       ],
//       order: [["created_at", "DESC"]],
//     });

//     res.status(200).json(workOrders);
//   } catch (error) {
//     console.error("Error fetching work orders:", error);
//     res.status(500).json({ error: error.message || "Internal Server Error" });
//   }
// };

exports.GetAlldispatchlist = async (req, res) => {
  try {
    if (!req.user?.company_id) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    // Step 1: Get all records (no status filter) for status comparison
    const allProducts = await SalesProduct.findAll({
      where: {
        company_id: req.user.company_id,
        is_deleted: { [Op.ne]: 1 },
      },
    });

    // Step 2: Build a map of sales_id => Set of statuses
    const statusMap = {};
    for (const item of allProducts) {
      const sid = item.sales_id;
      if (!statusMap[sid]) {
        statusMap[sid] = new Set();
      }
      statusMap[sid].add(item.status);
    }

    // Step 3: Fetch filtered results (status = 10)
    const filteredWorkOrders = await SalesProduct.findAll({
      where: {
        company_id: req.user.company_id,
        status: 10, // <-- filter applied here only
        is_deleted: { [Op.ne]: 1 },
      },
      include: [
        {
          association: "purchase",
          required: true,
          where: {
            mailsend_status: 1,
          },
          attributes: [
            "id",
            "reference_number",
            "customer_id",
            "total_amount",
            "expiration",
            "created_at",
          ],
          include: [
            { model: Customer, as: "customer", attributes: ["id", "name"] },
            { model: User, as: "createdByUser", attributes: ["id", "name"] },
          ],
        },
        {
          model: Product,
          as: "ProductsItem",
          attributes: ["id", "product_name", "product_code", "unit"],
          include: [
            {
              model: MasteruomModel,
              as: "Masteruom",
              attributes: ["unit_name"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Step 4: Add has_mixed_status to filtered result based on full map
    const finalData = filteredWorkOrders.map((item) => {
      const sid = item.sales_id;
      const hasMixedStatus = statusMap[sid] && statusMap[sid].size > 1;
      return {
        ...item.toJSON(),
        has_mixed_status: hasMixedStatus,
      };
    });

    res.status(200).json(finalData);
  } catch (error) {
    console.error("Error fetching work orders:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};



exports.dispatchGetWorkOrder = async (req, res) => {

  try {
    if (!req.user?.company_id) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const { id, production_id } = req.body;

    if (!id || !production_id) {
      return res.status(400).json({ error: "Missing ID or Production ID" });
    }

    // Update PurchaseProduct
    const updatedPurchase = await SalesProduct.update(
      { is_dispatched: true },
      { where: { id: id } }
    );

    const updatedProduction = await Production.update(
      { is_dispatched: true },
      { where: { production_number: production_id } }
    );


    res.status(200).json({
      message: "Dispatch status updated successfully",
      updatedPurchase,
      updatedProduction,
    });
  } catch (error) {
    console.error("Error dispatching work order:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    if (!req.user?.company_id) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const { id } = req.params;

    const whereClause = {
      company_id: req.user.company_id,
    };

    if (id) {
      whereClause.id = id;
    }

    const workOrders = await SalesProduct.findAll({
      where: whereClause,
      include: [
        {
          model: Purchase,
          as: "purchase",
          required: true,
          where: {
            status: {
              [Op.in]: [10, 11],
            },
            mailsend_status: 1,
          },
          attributes: [
            "id",
            "reference_number",
            "customer_id",
            "dalivery_date",
            "payment_terms",
            "total_amount",
            "expiration",
            "created_at",
          ],
          include: [
            {
              model: Customer,
              as: "customer",
              attributes: [
                "id",
                "name",
                "phone",
                "mobile",
                "address",
                "city",
                "state",
                "country",
                "zip",
                "address2",
                "gstin",
                "pan",
                "website",
              ],
            },
            { model: User, as: "createdByUser", attributes: ["id", "name"] },
            {
              association: "company",
              attributes: [
                "id",
                "company_name",
                "address",
                "logo",
                "gst",
                "company_phone",
              ],
            },
          ],
        },
        {
          model: Product,
          as: "ProductsItem",
          attributes: [
            "id",
            "product_name",
            "product_code",
            "unit",
            "hsn_code",
          ],
          include: [
            {
              model: MasteruomModel,
              as: "Masteruom",
              attributes: ["unit_name"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(workOrders);
  } catch (error) {
    console.error("Error fetching work orders:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

exports.IsInvoice = async (req, res) => {
  try {
    const generateInvoiceNumber = () => {
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      return `INV${datePart}${randomPart}`;
    };

    const invoiceNumber = generateInvoiceNumber();

    await SalesProduct.update(
      {
        is_invoice: true,
        is_dispatched: true,
        invoice_number: invoiceNumber,
        invoice_date: new Date(),
        invoice_created_by: req.user.id,
      },
      {
        where: {
          id: req.body.id,
        },
      }
    );

    res.status(200).json({
      message: "Status updated to invoice.",
      invoice_number: invoiceNumber,
    });
  } catch (error) {
    console.error("Error updating purchase product:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

exports.stockUpdate = async (req, res) => {
  try {
    const { pid, sid } = req.params;
    const company_id = req.user.company_id;
    if (!pid || !sid || !company_id) {
      return res
        .status(400)
        .json({ error: "Product ID, Store ID, or Company ID missing" });
    }

    // Total stock IN
    const totalIn = await TrackProductStock.sum("quantity_changed", {
      where: {
        product_id: pid,
        store_id: sid,

        status_in_out: 1,
      },
    });

    // Total stock OUT
    const totalOut = await TrackProductStock.sum("quantity_changed", {
      where: {
        product_id: pid,
        store_id: sid,
        company_id,
        status_in_out: 0,
      },
    });

    const finalStock = (totalIn || 0) - (totalOut || 0);

    return res.status(200).json({ stock: finalStock });
  } catch (error) {
    console.error("Error fetching stock:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const generateReferenceNumber = () => {
  const randomNumber = Math.floor(1000000 + Math.random() * 9000000); // 7-digit
  return `INV${randomNumber}`;
};

// Helper to generate a 16-digit barcode number
const generateBarcodeNumber = () => {
  let barcode = "";
  for (let i = 0; i < 16; i++) {
    barcode += Math.floor(Math.random() * 10);
  }
  return barcode;
};

exports.deductStock = async (req, res) => {
  try {
    const {
      product_id,
      product_name,
      default_price,
      unit,
      store_id,
      quantity,
    } = req.body;

    if (
      !product_id ||
      !store_id ||
      !quantity ||
      !product_name ||
      !default_price ||
      !unit
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    const reference_number = generateReferenceNumber();
    const barcode_number = generateBarcodeNumber();
    // 🔍 Calculate current stock = IN - OUT
    const totalIn = await TrackProductStock.sum("quantity_changed", {
      where: {
        product_id,

        company_id: req.user.company_id,
        status_in_out: 1,
      },
    });

    const totalOut = await TrackProductStock.sum("quantity_changed", {
      where: {
        product_id,

        company_id: req.user.company_id,
        status_in_out: 0,
      },
    });

    const currentStock = (totalIn || 0) - (totalOut || 0);
    const final_quantity = currentStock - quantity;

    if (final_quantity < 0) {
      return res.status(400).json({ message: "Insufficient stock to deduct." });
    }

    // ✅ Create OUT entry
    await TrackProductStock.create({
      product_id,
      item_name: product_name,
      default_price,
      item_unit: unit,
      store_id,
      quantity_changed: quantity,
      status_in_out: 0, // OUT
      reference_number,
      barcode_number,
      user_id: req.user.id,
      company_id: req.user.company_id,
      adjustmentType: "Delivery to User",
      final_quantity,
    });

    return res
      .status(200)
      .json({ message: "Stock deducted successfully.", final_quantity });
  } catch (error) {
    console.error("Error in deductStock:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};


//for report
exports.GetAllWorkOrderForReport = async (req, res) => {
  try {
    if (!req.user?.company_id) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const workOrders = await SalesProduct.findAll({
      where: {
        company_id: req.user.company_id,
        is_deleted: { [Op.ne]: 1 },
        is_invoice: { [Op.ne]: false },
      },
      include: [
        {
          association: "sale",
          required: true,
          where: {
            //status: 9,
            mailsend_status: 1,
          },
          attributes: [
            "id",
            "reference_number",
            "customer_id",
            "total_amount",
            "expiration",
            "created_at",
          ],
          include: [
            { model: Customer, as: "customer", attributes: ["id", "name"] },
            { model: User, as: "createdByUser", attributes: ["id", "name"] },
          ],
        },
        {
          model: Product,
          as: "ProductsItem",
          attributes: ["id", "product_name", "product_code", "unit", 'product_category'],
          include: [
            {
              model: MasteruomModel,
              as: "Masteruom",
              attributes: ["unit_name"],
            },
            {
              model: ProductCategories,
              as: 'Categories',
              attributes: ["title"],
            }
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(workOrders);
  } catch (error) {
    console.error("Error fetching work orders:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

exports.salesLedger = async (req, res) => {
  try {
    const { customer_id, startDate, endDate } = req.body;

    let conditions = "";
    // Ensure customer_id is a valid number
    if (customer_id && !isNaN(customer_id)) {
      conditions += ` AND s.customer_id = ${customer_id}`;
    }

    // Add date range filter
    if (startDate && endDate) {
      conditions += ` AND DATE(sp.invoice_date) BETWEEN '${startDate}' AND '${endDate}'`;
    }

    const query = `
      SELECT 
        c.name AS customer_name,
        s.reference_number,
        sp.qty,
        p.product_name AS product_name,
        sp.taxIncl,
        sp.invoice_number,
        sp.invoice_date,
        p.id AS product_id,
        sp.production_status,
         sp.production_number,
        sp.is_dispatched
      FROM sales_product sp
      JOIN sale s ON s.id = sp.sales_id
      JOIN product p ON p.id = sp.product_id
      JOIN customer c ON c.id = s.customer_id
      WHERE 1=1 ${conditions}
      ORDER BY sp.invoice_date DESC
    `;


    const [results] = await sequelize.query(query);
    res.status(200).json(results);
  } catch (error) {
    console.error("Ledger fetch error:", error);
    res.status(500).json({ error: "Failed to fetch ledger." });
  }
};



exports.getProductsByPurchase = async (req, res) => {
  try {
    const salesRef = req.params.id;

    if (!salesRef) {
      return res.status(400).json({ error: "Reference number is required" });
    }

    const products = await SalesProduct.findAll({
      where: {
        is_deleted: { [Op.ne]: 1 },
      },
      include: [
        {
          association: "purchase",
          where: {
            reference_number: salesRef,
          },
          attributes: ["id", "reference_number"],
        },
        {
          model: Product,
          as: "ProductsItem",
          attributes: ["product_name", "product_code"],
          include: [
            {
              model: MasteruomModel,
              as: "Masteruom",
              attributes: ["unit_name"],
            },
          ],
        },
      ],
      order: [["id", "ASC"]],
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products by reference number:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Update and approve sales quotation by management
 * @param {object} req - The request object
 * @param {object} req.params - Route parameters
 * @param {number} req.params.id - Sales Quotation ID
 * @param {object} req.body - Request body
 * @param {array} req.body.products - Array of products to update
 * @param {string} req.body.remarks - Remarks for approval
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */
exports.ApprovedByManagement = async (req, res) => {
  let transaction = null;
  
  try {
    const { id } = req.params;
    const { products, remarks } = req.body;

    // Validate sales quotation exists
    const sale = await Sale.findOne({
      attributes: ['id', 'status', 'company_id', 'warehouse_id'],
      where: { 
        id,
        company_id: req.user.company_id
      },
      raw: true,
    });

    // Throw error if the sale is not found
    if (!sale) {
      return res.status(404).json({ status: false, message: "Sales quotation not found" });
    }

    // Throw error if the sale is already dispatched or completed
    if (sale.status >= 5) {
      return res.status(400).json({ status: false, message: "Sales quotation is not in review stage" });
    }

    // Start a new transaction
    transaction = await sequelize.transaction();

    // Create the promises array
    const promises = [];

    // If products is provided, update the sales products
    let totalAmount = 0;
    let untaxedAmount = 0;
    if (products && products.length > 0) {
      products.forEach(product => {
        const taxExcl = product.qty * product.unit_price;
        const taxAmount = (product.tax / 100) * taxExcl;
        const taxIncl = taxExcl + taxAmount;
        totalAmount += taxIncl;
        untaxedAmount += taxExcl;

        promises.push(SalesProduct.update(
          {
            product_id: product.product_id,
            product_variant_id: product.product_variant_id,
            qty: product.qty,
            unit_price: product.unit_price,
            tax: product.tax,
            taxExcl: taxExcl,
            taxIncl: taxIncl,
            taxAmount: taxAmount
          }, 
          { 
            where: { id: product.id }, 
            transaction 
          }
        ));

        // Update the stock entry
        promises.push(updateStockEntry(sale.warehouse_id, product.product_id, product.product_variant_id, product.qty, 9, transaction));
      });
    }

    // Update the sale record with the new total amount and untaxed amount, and set status to approved (4)
    promises.push(Sale.update({
      total_amount: totalAmount,
      untaxed_amount: untaxedAmount,
      status: 9 // Update the sales quotation status to confirmed by management and sent to the floor manager
    }, { where: { id }, transaction }));

    // If remarks is provided, create a new sales remarks record
    if (remarks) {
      promises.push(SalesRemarks.create({
        sales_id: id,
        remarks: remarks,
        user_id: req.user.id,
      }, { transaction }));
    }

    // Execute all promises
    await Promise.all(promises);

    // Commit the transaction
    await transaction.commit();
    
    // Return the success response
    return res.status(200).json({ 
      status: true, 
      message: "Sales quotation updated and approved successfully" 
    });
  } catch (error) {
    // Rollback the transaction if it exists
    if (transaction) {
      await transaction.rollback();
    }
    console.error("Transaction rolled back due to error:", error);
    return res.status(500).json({ 
      status: false, 
      message: "An error occurred while updating and approving the sales quotation", 
      error: error.message 
    });
  }
};

const updateStockEntry = async (warehouse_id, product_id, product_variant_id, quantity, status, transaction = false) => {
  return new Promise(async (resolve, reject) => {
  try {
    // check if the stock entry exists
    const stockEntry = await ProductStockEntry.findOne({
      attributes: ['id', 'quantity', 'sale_order_recieved'],
      where: { warehouse_id, product_id, product_variant_id },
      raw: true,
    });
    if (!stockEntry) {
      return reject(new Error("Stock entry not found"));
    }
    if (status === 9) {
      // update the stock entry
      // Add sale order recieved quantity to the stock entry when order is sent to floor manager
      await ProductStockEntry.update({
        sale_order_recieved: stockEntry.sale_order_recieved + quantity,
        quantity: stockEntry.quantity + quantity,
      }, { 
        where: { id: stockEntry.id },
        ...(transaction ? { transaction } : {})
      });
    } else if (status === 10) {
      // update the stock entry
      // Subtract sale order recieved quantity from the stock entry
      await ProductStockEntry.update({
        sale_order_recieved: stockEntry.sale_order_recieved - quantity,
        quantity: stockEntry.quantity - quantity,
      }, { 
        where: { id: stockEntry.id },
        ...(transaction ? { transaction } : {})
      });
    }

    resolve({ status: true, message: "Stock entry updated successfully" });
  } catch (error) {
    console.error("Error updating stock entry:", error);
    reject({ status: false, message: "Error updating stock entry: " + error.message });
  }
  });
};

/**
 * Reject sales quotation by management
 * @param {object} req - The request object
 * @param {object} req.params - Route parameters
 * @param {number} req.params.id - Sales Quotation ID
 * @param {object} req.body - Request body
 * @param {number} req.body.status - Status to set (8 for rejected, 5 for order confirmed)
 * @param {string} req.body.remarks - Remarks for rejection/confirmation
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */
exports.RejectedByManagement = async (req, res) => {
  let transaction = null;
  
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    // Validate required fields
    if (!status || (status !== 8 && status !== 5)) {
      return res.status(400).json({ 
        status: false, 
        message: "Status is required and must be either 8 (rejected) or 5 (order confirmed)" 
      });
    }

    // Validate sales quotation exists
    const sale = await Sale.findOne({
      attributes: ['id', 'status', 'company_id'],
      where: { 
        id,
        company_id: req.user.company_id
      },
      raw: true,
    });

    // Throw error if the sale is not found
    if (!sale) {
      return res.status(404).json({ status: false, message: "Sales quotation not found" });
    }

    // Start a new transaction
    transaction = await sequelize.transaction();

    // Create the promises array
    const promises = [];

    // Update the sale record with the new status
    promises.push(Sale.update({
      status: status
    }, { where: { id }, transaction }));

    // If remarks is provided, create a new sales remarks record
    if (remarks) {
      promises.push(SalesRemarks.create({
        sales_id: id,
        remarks: remarks,
        user_id: req.user.id,
      }, { transaction }));
    }

    // Execute all promises
    await Promise.all(promises);

    // Commit the transaction
    await transaction.commit();
    
    // Return the success response
    const statusMessage = status === 8 ? "rejected" : "order confirmed";
    return res.status(200).json({ 
      status: true, 
      message: `Sales quotation ${statusMessage} successfully` 
    });
  } catch (error) {
    // Rollback the transaction if it exists
    if (transaction) {
      await transaction.rollback();
    }
    console.error("Transaction rolled back due to error:", error);
    return res.status(500).json({ 
      status: false, 
      message: "An error occurred while rejecting/confirming the sales quotation", 
      error: error.message 
    });
  }
};

exports.fetchSalesDetails = async (req, res) => {
  try {
    const { reference_number } = req.query;

    // Get the sales details
    const salesDetails = await Sale.findOne({
      attributes: ['id', 'reference_number', 'expected_delivery_date', 'payment_terms', 'total_amount', 'is_parent', 'status', 'created_at'],
      where: { 
        reference_number: reference_number,
        company_id: req.user.company_id,
        // status: { [Op.in]: [10, 11] },
      },
      include: [
        {
          association: 'products',
          attributes: ['id', 'product_id', 'warehouse_id', 'description', 'qty', 'unit_price', 'tax', 'taxExcl', 'taxIncl', 'taxAmount'],
          include: [
            {
              association: 'productData',
              attributes: ['id', 'product_name', 'product_code'],
              include: [
                {
                  association: 'batches',
                  attributes: ['id', 'product_id', 'warehouse_id', 'batch_no', 'manufacture_date', 'expiry_date', 'quantity', 'available_quantity'],
                  where: {
                    [Op.and]: [
                      { available_quantity: { [Op.gt]: 0 } },
                      where(col('products->productData->batches.warehouse_id'), '=', col('products.warehouse_id'))
                    ]
                  },
                  required: false,
                  include: [
                    {
                      association: 'trackBatchProductLogs',
                      attributes: ['id', 'status', 'quantity'],
                      where: { status: 1 },
                      required: false,
                    }
                  ]
                }
              ]
            }
          ]
        },
      ],
    });
    return res.status(200).json({
      status: true,
      message: "Sales details fetched successfully",
      data: salesDetails
    });
  } catch (error) {
    console.error("Error fetching sales details:", error);
    return res.status(500).json({ 
      status: false, 
      message: "An error occurred while fetching the sales details", 
      error: error.message 
    });
  }
};
