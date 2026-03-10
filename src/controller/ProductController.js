const { Op, fn, col, literal } = require("sequelize");

// const Product = require("../model/Product");
const axios = require("axios");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const { 
  Product,
  ProductVariant,
  ProductStockEntry, 
  Company, 
  Warehouse, 
  ProductAttributeValue,
  ProductCategory,
  StockTransferLog,
  StockTransferProducts,
  ProductAttribute,
  MasterProductType,
  ReceiveProductBatch,
  StockTransferBatch,
  RecvProduct,
  Sale,
  Purchase,
  MasterUOM,
  GeneralSettings
} = require("../model");
// const { CompressImage } = require("../utils/ImageUpload");
const MasteruomModel = require("../model/MasteruomModel");
const CommonHelper = require('../helpers/commonHelper');

const XLSX = require("xlsx");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
// const { error } = require("console");
const TrackProductStock = require("../model/TrackProductStock");
const generateUniqueReferenceNumber = require("../utils/generateReferenceNumber");
const sequelize = require("../database/db-connection");
const moment = require('moment');

const { GupShupMessage } = require("../utils/GupShupMessage");


async function findCategoryByName(categoryName, companyId) {
  const category = await ProductCategory.findOne({ where: { title: categoryName, company_id: companyId } });
  return category ? category.id : null;
}

async function findUnitByName(unitName) {
  const unit = await MasterUOM.findOne({ 
    where: { label: unitName },
    attributes: ['id'],
    raw: true
  });
  return unit ? unit.id : await insertUOM(unitName, unitName);
}

async function findProductTypeByName(typeName) {
  if (!typeName || String(typeName).trim() === '') return null;
  const pt = await MasterProductType.findOne({
    where: { name: String(typeName).trim() },
    attributes: ['id'],
    raw: true
  });
  return pt ? pt.id : null;
}

async function insertCategory(categoryName, userId, companyId) {
  const category = await ProductCategory.create({ title: categoryName, user_id: userId, company_id: companyId });
  return category.id;
}

async function insertUOM(unitName, label) {
  const unit = await MasterUOM.create({ name: unitName, label: label });
  return unit.id ? unit.id : null;
}

// async function insertProduct(product, userId, companyId, options = {}) {
//   try {
//     return await Product.create({ ...product, user_id: userId, company_id: companyId }, options);
//   } catch (error) {
//     console.error("Error in insertProduct:", error.message, "Product Data:", product);
//     throw error; // Ensure the error message is propagated
//   }
// }

/** Fixed Excel headers for product bulk upload (aligned with AddProduct) */
const UPLOAD_FIXED_HEADERS = {
  ITEM_CODE: 'Item Code',
  ITEM_NAME: 'Item Name',
  ITEM_TYPE: 'Item Type',
  CATEGORY: 'Category',
  UOM: 'UOM',
  WEIGHT_PER_UNIT: 'Weight',
  BATCH_APPLICABLE: 'Batch Applicable',
  MARKUP_PERCENT: 'Markup Percent',
};

function parseBatchApplicable(value) {
  if (value === undefined || value === null || value === '') return 0;
  const v = String(value).trim().toLowerCase();
  if (v === '1' || v === 'yes' || v === 'true') return 1;
  return 0;
}

/** Parse CSV file to array of row objects (keys = header names). */
// function parseCSVFile(filePath) {
//   return new Promise((resolve, reject) => {
//     const rows = [];
//     fs.createReadStream(filePath)
//       .pipe(csv())
//       .on("data", (row) => rows.push(row))
//       .on("end", () => resolve(rows))
//       .on("error", reject);
//   });
// }

/** Parse CSV from in-memory buffer (no disk write). Returns array of row objects. */
function parseCSVFromBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const { Readable } = require('stream');
    const stream = Readable.from(buffer);
    stream
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

function productVatientInsert(isProductExist, uomId, weightPerUnit, user, transaction) {
  return new Promise(async (resolve, reject) => {
    try {
       // If product already exist then add varient
       let productVariant = await ProductVariant.findOne({
        attributes: ['id', 'weight_per_unit', 'price_per_unit'],
        where: { 
          product_id: isProductExist.id, 
          uom_id: uomId, 
          weight_per_unit: weightPerUnit
        },
        raw: true,
        transaction,
      });
      if (!productVariant) {
        productVariant = await ProductVariant.create({
          product_id: isProductExist.id,
          uom_id: uomId,
          weight_per_unit: weightPerUnit,
          status: 1,
          company_id: user.company_id,
          user_id: user.id,
        }, { transaction });
      } else {
        // Update weight per unit
        await ProductVariant.update({
          weight_per_unit: weightPerUnit
        }, { where: { id: productVariant.id }, transaction });
      }
      resolve(productVariant);
    } catch (error) {
      reject(error);
    }
  });
}

exports.uploadProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: false, message: 'No file uploaded' });
    }

    const companyId = req.user.company_id;
    const buffer = req.file.buffer;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    if (fileExtension !== '.xlsx' && fileExtension !== '.csv') {
      return res.status(400).json({ status: false, message: 'File format should be .xlsx or .csv' });
    }

    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ status: false, message: 'File size exceeds 10 MB' });
    }

    // Product attributes: company-specific or global (null company_id)
    const dynamicAttributeList = await ProductAttribute.findAll({
      attributes: ['id', 'name'],
      where: { [Op.or]: [{ company_id: companyId }, { company_id: { [Op.is]: null } }] },
      raw: true,
    });
    const attributeByName = dynamicAttributeList.reduce((acc, a) => {
      acc[a.name.trim()] = a.id;
      return acc;
    }, {});

    let data;
    if (fileExtension === '.csv') {
      data = await parseCSVFromBuffer(buffer);
    } else {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        if (sheet['!merges'] && sheet['!merges'].length > 0) {
          return res.status(400).json({ status: false, message: 'Merged cells are not allowed' });
        }
      }
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(sheet);
    }

    if (data.length > 500) {
      return res.status(400).json({ status: false, message: 'Maximum number of rows allowed is 500' });
    }

    const transaction = await sequelize.transaction();
    try {
      const products = [];

      for (const row of data) {
        const itemCode = row[UPLOAD_FIXED_HEADERS.ITEM_CODE] != null ? String(row[UPLOAD_FIXED_HEADERS.ITEM_CODE]).trim() : '';
        const itemName = row[UPLOAD_FIXED_HEADERS.ITEM_NAME] != null ? String(row[UPLOAD_FIXED_HEADERS.ITEM_NAME]).trim() : '';
        const itemType = row[UPLOAD_FIXED_HEADERS.ITEM_TYPE] != null ? String(row[UPLOAD_FIXED_HEADERS.ITEM_TYPE]).trim() : '';
        const categoryName = row[UPLOAD_FIXED_HEADERS.CATEGORY] != null ? String(row[UPLOAD_FIXED_HEADERS.CATEGORY]).trim() : '';
        const uomName = row[UPLOAD_FIXED_HEADERS.UOM] != null ? String(row[UPLOAD_FIXED_HEADERS.UOM]).trim() : '';
        const weightPerUnit = row[UPLOAD_FIXED_HEADERS.WEIGHT_PER_UNIT] != null ? parseInt(row[UPLOAD_FIXED_HEADERS.WEIGHT_PER_UNIT]) : 0;
        const batchApplicable = parseBatchApplicable(row[UPLOAD_FIXED_HEADERS.BATCH_APPLICABLE]);
        const markupPercent = row[UPLOAD_FIXED_HEADERS.MARKUP_PERCENT] != null && row[UPLOAD_FIXED_HEADERS.MARKUP_PERCENT] !== ''
          ? parseFloat(row[UPLOAD_FIXED_HEADERS.MARKUP_PERCENT])
          : null;

        // If item code and item name are not present then skip the row
        if (!itemCode && !itemName) {
          continue;
        }

        // Find or create UOM
        const uomId = await findUnitByName(uomName);
        if (!uomId) {
          throw new Error(`UOM "${uomName}" not found and could not be created.`);
        }

        const isProductExist = await Product.findOne({
          attributes: ['id'],
          where: { product_code: itemCode, company_id: companyId },
          raw: true,
          transaction,
        });
        if (isProductExist) {
          // If product already exist then add varient
          await productVatientInsert(isProductExist, uomId, weightPerUnit, req.user, transaction);
          continue;
        }

        let productCategoryId = null;
        if (categoryName) {
          productCategoryId = await findCategoryByName(categoryName, companyId);
          if (!productCategoryId) {
            productCategoryId = await insertCategory(categoryName, req.user.id, companyId);
          }
        }

        const productTypeId = await findProductTypeByName(itemType);

        const productSKU = await generateUniqueProductSKU(companyId);

        const productData = await Product.create({
          company_id: companyId,
          user_id: req.user.id,
          product_code: itemCode,
          product_name: itemName,
          product_type_id: productTypeId,
          product_category_id: productCategoryId,
          // uom_id: uomId,
          // buffer_size: null,
          is_batch_applicable: batchApplicable,
          markup_percentage: markupPercent,
          sku_product: productSKU,
        }, { transaction });

        const productAttributeValues = [];
        for (const [header, value] of Object.entries(row)) {
          const headerTrimmed = String(header).trim();
          if (!headerTrimmed) continue;
          const attributeId = attributeByName[headerTrimmed];
          if (!attributeId) continue;
          const val = value != null ? String(value).trim() : '';
          if (val === '') continue;
          productAttributeValues.push({
            product_id: productData.id,
            product_attribute_id: attributeId,
            value: val,
          });
        }
        if (productAttributeValues.length > 0) {
          await ProductAttributeValue.bulkCreate(productAttributeValues, { transaction });
        }
        await productVatientInsert(productData, uomId, weightPerUnit, req.user, transaction);

        products.push(productData);
      }

      await transaction.commit();
      return res.status(200).json({ status: true, message: 'Products uploaded successfully', data: products });
    } catch (transactionError) {
      await transaction.rollback();
      console.error('Transaction error:', transactionError.message);
      throw transactionError;
    }
  } catch (error) {
    console.error('Bulk Upload Products error:', error.message);
    return res.status(500).json({ status: false, message: 'Internal Server Error', error: error.message });
  }
};

const generateRandomBarcode = () => {
  const barcodeLength = 16;
  let barcode = "";

  for (let i = 0; i < barcodeLength; i++) {
    barcode += Math.floor(Math.random() * 10); // Generate a digit from 0 to 9
  }

  return barcode;
};

const generateUniqueProductSKU = (companyID) => {
    return new Promise(async (resolve, reject) => {
      const company = await Company.findOne(
        {
          attributes: ['id', 'company_name'],
          raw: true,
          where: { id: companyID },
        }
      );
      
      // If company not found
      if (!company) {
        reject("Unable to get company details");
      }

      // Step 1: Create abbreviation from company name
      const abbreviation = CommonHelper.removeSpecialChars(company.company_name)
      .trim()
      .split(/\s+/)
      .map(word => word[0])
      .join('')
      .toUpperCase();

    // Step 2: Get current year
    const year = new Date().getFullYear();

    // Step 3: Generate random 5-digit number (with leading zeros)
    const randomDigits = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(6, '0');

    // Step 4: Combine all parts
    const productSKU = `${abbreviation}${year}${randomDigits}`;
    resolve(productSKU);
  });
}

/**
 * Add a new product to the product master
 * Validates that the product code is unique
 * Validates that all required fields are filled
 * Begins transaction
 * Creates the product
 * Creates the product attribute values
 * Commits transaction
 * Returns the product data
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
exports.AddProduct = async (req, res) => {
  let transaction = null; 
  try {
    const { 
      product_code, 
      product_name, 
      product_type_id,
      brand_id,
      dynamic_attributes,
      product_variants,
      is_batch_applicable,
      product_category_id,
      markup_percentage
    } = req.body;

    const companyId = req.user.company_id;
    // Generate product SKU
    const productSKU = await generateUniqueProductSKU(companyId);

    const isProductExist = await Product.findOne({
      attributes: ['id'],
      where: { product_code, company_id: companyId },
      raw: true,
    });

    // If product with same code exist
    if (isProductExist) {
      return res.status(400).json({
        status: false,
        message: "Product code must be unique"
      });
    }

    dynamic_attributes.forEach((eachAttributerow) => {
      if (eachAttributerow.is_required === 1 && eachAttributerow.value.trim() === '') {
        throw Error("Please fill all required fields");
      }
    });

    // Begin transaction
    transaction = await sequelize.transaction();

    // Create the product
    const productData = await Product.create({
      company_id: companyId,
      user_id: req.user.id,
      product_code,
      product_name,
      product_type_id,
      product_category_id,
      brand_id,
      sku_product: productSKU,
      is_batch_applicable,
      markup_percentage,
    }, { transaction });

    const productAttributeValues = [];
    dynamic_attributes.forEach((eachAttributerow) => {
      if (eachAttributerow.value.trim() !== '') {
        productAttributeValues.push({
          product_id: productData.id,
          product_attribute_id: eachAttributerow.product_attribute_id,
          value: eachAttributerow.value.trim()
        });
      }
    });

    // Save attribute values
    await ProductAttributeValue.bulkCreate(productAttributeValues, { transaction });

    const productVariants = [];
    product_variants.forEach((eachVariant) => {
      productVariants.push({
        company_id: companyId,
        user_id: req.user.id,
        product_id: productData.id,
        uom_id: eachVariant.uom_id,
        weight_per_unit: eachVariant.weight
      });
    });

    // Save product variants
    await ProductVariant.bulkCreate(productVariants, { transaction });

    await transaction.commit();

    // Fetch newly created product data
    // const product = await Product.findOne({
    //   attributes: ['id', 'product_code', 'product_name', 'product_type_id', 'uom_id', 'buffer_size', 'is_batch_applicable'],
    //   where: { id: productData.id },
    //   include: [
    //     {
    //       association: 'productAttributeValues',
    //       attributes: ['id', 'product_attribute_id', 'value'],
    //       include: [
    //         {
    //           association: 'productAttribute',
    //           attributes: ['id', 'name', 'is_required']
    //         }
    //       ]
    //     }
    //   ]
    // });

    // Return product data with success message
    return res.status(200).json({
      status: true,
      message: "Product has been added successfully",
      // data: product
    });
  } catch (error) {
    const errorMessage = error.message ? error.message : "Error adding product:";
    console.error(errorMessage, error);
    // If transaction is present but werror occurred then rollback
    if (transaction) {
      await transaction.rollback();
    }
    res.status(500).json({ message: errorMessage });
  }
};

exports.UpdateProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const productData = req.body;
    const dynamicAttributes = productData.dynamic_attributes;
    delete productData.dynamic_attributes;

    // Fetch existing attribute values for this product
    const existingAttributes = await ProductAttributeValue.findAll({
      attributes: ['id', 'product_attribute_id'],
      where: { product_id: productId },
      raw: true,
    });

    // Create a map for fast lookup
    const existingMap = new Map(
      existingAttributes.map(item => [
        Number(item.product_attribute_id),
        item
      ])
    );
    

    // Prepare bulk operations
    const attributesToCreate = [];
    const updateProductPromises = [];
    const deleteProductPromises = [];

    for (const attr of dynamicAttributes) {
      const existing = existingMap.get(Number(attr.product_attribute_id));
      const value = attr.value;

      if (existing) {
        if (value === null || value === undefined || value === '') {
          // EXIST + NULL → DELETE
          deleteProductPromises.push(
            ProductAttributeValue.destroy({
              where: { id: existing.id }
            })
          );
        } else {
          // EXIST + VALUE → UPDATE
          // Update existing record
          updateProductPromises.push(
            ProductAttributeValue.update(
              { 
                value: value
              }, {
                where: { id: existing.id },
            })
          );
        }

      } else {
        // Create new record if value exists
        if (value !== null && value !== undefined && value !== '') {
          // NOT EXIST + VALUE → INSERT
          attributesToCreate.push({
            product_id: productId,
            product_attribute_id: attr.product_attribute_id,
            value: value,
            is_required: attr.is_required
          });
        }
      }
    }

    // Bulk update existing
    if (updateProductPromises.length > 0) {
      await Promise.all(updateProductPromises);
    }

    // Delete records if any
    if (deleteProductPromises.length > 0) {
      await Promise.all(deleteProductPromises);
    }

    // Bulk create new
    if (attributesToCreate.length > 0) {
      await ProductAttributeValue.bulkCreate(attributesToCreate);
    }

    // Handle file upload to S3
    // if (req.file) {
    //   const company_id = req.user?.company_id;

    //   // Fetch company name from the database
    //   const company = await Company.findOne({
    //     where: { id: company_id },
    //     attributes: ['company_name'],
    //   });
    //   const companyName = company?.company_name || "DefaultCompany";
    //   const uploadResult = await UploadFileToAWS(req.file, companyName);
    //   if (uploadResult.status) {
    //     updateFields.attachment_file = uploadResult.url;
    //   } else {
    //     return res.status(500).json({ status: false, message: uploadResult.message });
    //   }
    // }

    // Map sectionData to updateFields
    // if (sectionData.product_name)
    //   updateFields.product_name = sectionData.product_name;
    // if (sectionData.sku_product)
    //   updateFields.sku_product = sectionData.sku_product;
   
    // if (sectionData.product_code)
    //   updateFields.product_code = sectionData.product_code;
    // if (sectionData.type) updateFields.product_type = sectionData.type;
    // if (sectionData.product_category)
    //   updateFields.product_category = sectionData.product_category;
    // if (sectionData.unit) updateFields.unit = sectionData.unit;
    // if (sectionData.tax) updateFields.tax = sectionData.tax;
    // if (sectionData.hsnCode) updateFields.hsn_code = sectionData.hsnCode;
    // if (sectionData.product_price)
    //   updateFields.product_price = sectionData.product_price;
    // if (sectionData.regular_buying_price)
    //   updateFields.regular_buying_price = sectionData.regular_buying_price;
    // if (sectionData.regular_selling_price)
    //   updateFields.regular_selling_price = sectionData.regular_selling_price;
    // if (sectionData.dealer_price)
    //   updateFields.dealer_price = sectionData.dealer_price;
    // if (sectionData.wholesale_buying_price)
    //   updateFields.wholesale_buying_price = sectionData.wholesale_buying_price;
    // if (sectionData.mrp) updateFields.mrp = sectionData.mrp;
    // if (sectionData.distributor_price)
    //   updateFields.distributor_price = sectionData.distributor_price;
    // if (sectionData.total_stock)
    //   updateFields.total_stock = sectionData.total_stock;
    // if (sectionData.minimum_stock_level)
    //   updateFields.minimum_stock_level = sectionData.minimum_stock_level;
    // if (sectionData.reject_stock)
    //   updateFields.reject_stock = sectionData.reject_stock;
    // if (sectionData.maximum_stock_level)
    //   updateFields.maximum_stock_level = sectionData.maximum_stock_level;
    // if (sectionData.safety_stock)
    //   updateFields.safety_stock = sectionData.safety_stock;
    // if (sectionData.sku_description)
    //   updateFields.sku_description = sectionData.sku_description;
    // if (sectionData.replenishment_time)
    //   updateFields.replenishment_time = sectionData.replenishment_time;
    // if (sectionData.replenishment_multiplications)
    //   updateFields.replenishment_multiplications =
    //     sectionData.replenishment_multiplications;
    // if (sectionData.minimum_replenishment)
    //   updateFields.minimum_replenishment = sectionData.minimum_replenishment;
    // if (sectionData.buffer_size)
    //   updateFields.buffer_size = sectionData.buffer_size;

    // Update the product with the new data
    await Product.update(productData, {
      where: { id: productId },
    });

    return res
      .status(200)
      .json({
        status: true,
        message: "Product data has been updated successfully",
        // data: updatedRowsCount,
      });
  } catch (err) {
    console.log("Product update error!!", err);
    return res.status(400).json(err);
  }
};

const UploadFileToAWS = async (file, companyName) => {
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_AccessKeyId,
        secretAccessKey: process.env.AWS_SecretAccessKey,
      },
    });

    // Clean folder and filename
    const safeCompanyName = companyName.replace(/\s+/g, "-");
    const fileName = `${Date.now()}_${path.basename(file.originalname)}`;
    const key = `ERP/${safeCompanyName}/${fileName}`;

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const uploadResult = await s3Client.send(new PutObjectCommand(uploadParams));
    // console.log(uploadResult, "File uploaded to S3");

    // Construct public URL manually
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return {
      status: true,
      message: "File uploaded successfully",
      url: fileUrl,
      filename: fileName, // optionally return filename
    };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    return {
      status: false,
      message: "Error uploading file",
      error,
    };
  }
};

exports.GetAllProducts = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { type } = req.query;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const searchkey = (req.query.searchkey || "").trim();
    const product_category_id = req.query.product_category_id || null;
    const brand_id = req.query.brand_id || null;

    /* -------------------- BASE WHERE -------------------- */

    const where = {
      status: 1,
      company_id: company_id,
    };

    // if product_category_id is provided then add it to the where clause
    if (product_category_id) {
      where.product_category_id = product_category_id;
    }

    // if brand_id is provided then add it to the where clause
    if (brand_id) {
      where.brand_id = brand_id;
    }

    /* -------------------- SEARCH -------------------- */

    if (searchkey) {
      where[Op.or] = [
        { product_code: { [Op.like]: `%${searchkey}%` } },
        { sku_product: { [Op.like]: `%${searchkey}%` } },
        { product_name: { [Op.like]: `%${searchkey}%` } },
        { "$masterBrand.name$": { [Op.like]: `%${searchkey}%` } },
      ];
    }

    /* -------------------- INCLUDE CONFIG -------------------- */

    let include = [];

    // For dropdown → no joins needed
    if (type === "dropDown") {
      include = [];
    }

    // For search → only brand join required
    else if (type === "search") {
      include = [
        {
          association: "masterBrand",
          attributes: ["name"],
          required: false,
        },
      ];
    }

    // Full product listing
    else {
      include = [
        {
          association: "masterBrand",
          attributes: ["name"],
          required: false,
        },
        {
          association: "masterProductType",
          attributes: ["name"],
        },
        {
          association: "productCategory",
          attributes: ["title"],
        },
        {
          association: "productVariants",
          attributes: ["id", "weight_per_unit", "price_per_unit", "uom_id"],
          include: [
            {
              association: "masterUOM",
              attributes: ["name", "label"],
            },
          ],
        },
        {
          association: "productAttributeValues",
          attributes: ["id", "product_attribute_id", "value"],
          include: [
            {
              association: "productAttribute",
              attributes: ["id", "name", "is_required"],
            },
          ],
        },
      ];
    }

    /* -------------------- QUERY -------------------- */

    const productsList = await Product.findAndCountAll({
      attributes: [
        "id",
        "product_code",
        "product_category_id",
        "product_name",
        "sku_product",
        "product_type_id",
        "is_batch_applicable",
        "markup_percentage",
      ],
      where,
      include,
      order: [["id", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    /* -------------------- PAGINATION -------------------- */

    const paginatedProductData = CommonHelper.paginate(
      productsList,
      page,
      limit
    );

    return res.status(200).json({
      status: true,
      message: "Products fetched successfully",
      data: paginatedProductData,
    });
  } catch (err) {
    console.error("Get all products error:", err);
    return res.status(400).json({
      status: false,
      message: "Error fetching products",
      error: err.message,
    });
  }
};

exports.GetAllDeletedProducts = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    // const user_id = req.user.id;
    const getAlldeletedProduct = await Product.findAll({
      where: {
        company_id: company_id,
        // user_id: user_id,
        status: '0',
      },
      order: [["id", "DESC"]],
      include: [
        {
          model: ProductCategory,
          as: "Categories",
          attributes: ["title"],
        },
        {
          model: MasteruomModel,
          as: "Masteruom",
          attributes: ["unit_name"],
        },
        {
          model: TrackProductStock,
          as: "TrackProductStock",
        },
      ],
    });

    return res.status(200).json({ message: true, data: getAlldeletedProduct });
  } catch (err) {
    return res.status(400).json(err);
  }
};

//delete item restore
exports.GetAllDeletedProductsRestore = async (req, res) => {
  try {
    const { productIdsRestore } = req.body;

    // console.log("Received productIds for restore:", productIdsRestore);

    if (!Array.isArray(productIdsRestore) || productIdsRestore.length === 0) {
      return res.status(400).json({ message: "Invalid or missing product IDs" });
    }

    const [updatedRowsCount] = await Product.update(
      { status: '1' },
      { where: { id: productIdsRestore } }
    );

    if (updatedRowsCount > 0) {
      return res.json({
        message: `${updatedRowsCount} products restore successfully.`,
      });
    } else {
      return res.status(404).json({ message: "No products found to restore" });
    }
  } catch (error) {
    console.error("Error restore multiple products:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.GetProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findOne({
      attributes: [
        'id', 
        'product_code', 
        'product_name', 
        'product_type_id',
        'product_category_id',
        'brand_id', 
        'is_batch_applicable', 
        'markup_percentage'
      ],
      where: {
        id: productId,
      },
      include: [
        {
          association: 'masterProductType',
          attributes: ['id', 'name'],
        },
        {
          association: 'masterBrand',
          attributes: ['id', 'name'],
        },
        {
          association: 'productVariants',
          attributes: ['id', 'weight_per_unit', 'price_per_unit', 'uom_id'],
          // include: [
          //   {
          //     association: 'masterUOM',
          //     attributes: ['id', 'name', 'label'],
          //   }
          // ]
        },
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
          association: 'productCategory',
          attributes: ['id', 'title'],
        }
        // { model: MasteruomModel, as: "Masteruom", attributes: ["unit_name"] },
        // { model: TrackProductStock, as: "TrackProductStock" },
      ],
    });
    return res.status(200).json({ message: true, data: product });
  } catch (err) {
    console.log("Error in GetProductDetails:", err);
    return res.status(400).json(err);
  }
};

exports.GetAllProductsbyStore = async (req, res) => {
  try {
    const storeId = req.params.id;
    // pagination params
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const searchkey = (req.query.searchkey || '').trim();

    const where = {
      company_id: req.user.company_id,
      status: 1,
    };

    if (searchkey !== '') {
      where[Op.or] = [
          { product_code: { [Op.like]: `%${searchkey}%` } },
          { sku_product: { [Op.like]: `%${searchkey}%` } },
          { product_name: { [Op.like]: `%${searchkey}%` } }
      ];
    }
    // Fetch all products for the given store
    const products = await Product.findAndCountAll({
      attributes: ["id", "product_name", "product_code", "is_batch_applicable"],
      where,
      order: [["id", "DESC"]],
      limit,
      offset,
      distinct: true,
      include:[
        {
          association: "productStockEntries",
          attributes: ['id', 'quantity', 'buffer_size'],
          where: {
            warehouse_id: storeId,
          },
          include: [
            {
              association: "productVariant",
              attributes: ["id", "weight_per_unit", "price_per_unit", "uom_id"],
              include: [
                {
                  association: "masterUOM",
                  attributes: ["name", "label"],
                },
              ],
            },
          ],
        }
      ]
    });
    
    // Get paginated data
    const paginatedProductData = CommonHelper.paginate(products, page, limit);

    // return response
    return res.status(200).json({ message: 'Products fetched successfully', data: paginatedProductData });
  } catch (err) {
    return res.status(400).json({ message: 'Error fetching products', error: err.message });
  }
};

exports.ProductAvailableBatches = async (req, res) => {
  try {
    const productId = req.params.id;


    const batches = await ReceiveProductBatch.findAll({
      attributes: ['id', 'batch_no', 'manufacture_date', 'expiry_date', 'available_quantity'],
      where: { 
        product_id: productId, 
        company_id: req.user.company_id 
      },
      raw: true,
      nest: true,
      include: [
        {
          association: 'purchase',
          attributes: ['id', 'reference_number'],
          where: { status: 10 }, // 10 = completed
          required: true,
        },
        {
          association: 'receiveProduct',
          attributes: ['id', 'available_quantity'],
          where: { available_quantity: { [Op.gt]: 0 } },
          required: true,
        }
      ],
      order: [['id', 'DESC']],
    });
    return res.status(200).json({ message: true, data: { batches } });
  } catch (err) {
    console.log("Error in ProductAvailableBatches:", err);
    return res.status(400).json(err);
  }
};

exports.DeleteProducts = async (req, res) => {
  try {
    const productId = req.params.id;
    if (!productId || isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const product = await Product.findOne({ where: { id: productId } });
    if (product) {

      const updatedRowsCount = await Product.update(
        { status: "0" },
        { where: { id: productId } }
      );

      res.json({ message: "Item removed" });
    } else {
      res.status(404).json({ message: "Item not found" });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//bulk product delete
exports.DeleteMultipleProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    // console.log("Received productIds:", productIds);

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "Invalid or missing product IDs" });
    }

    const [updatedRowsCount] = await Product.update(
      { status: "0" },
      { where: { id: productIds } }
    );

    if (updatedRowsCount > 0) {
      return res.json({
        message: `${updatedRowsCount} products deleted successfully.`,
      });
    } else {
      return res.status(404).json({ message: "No products found to delete" });
    }
  } catch (error) {
    console.error("Error deleting multiple products:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


exports.GetProductsActivity = async (req, res) => {
  try {
    const getAllProduct = await Product.findAll({
      where: {
        id: productId,
      },
      order: [["id", "DESC"]],
      include: [
        { model: ProductCategory, as: "Categories", attributes: ["title"] },
        { model: MasteruomModel, as: "Masteruom", attributes: ["unit_name"] },
        { model: TrackProductStock, as: "TrackProductStock" },
      ],
    });
    return res.status(200).json({ message: true, data: getAllProduct });
  } catch (err) {
    return res.status(400).json(err);
  }
};

//   exports.GetProductCategory = async (req, res) => {
//     try {
//         const allCategory = await categories.findAll();
//         return res.status(200).json({ "message": true, data: allCategory })
//     } catch (err) {
//         return res.status(400).json(err)
//     }
// }

exports.UpdateStockAndTrack = async (req, res) => {
  try {
    const { from_store, transferItems } = req.body;
    const referenceNumber = await generateUniqueReferenceNumber();
    // Log incoming data to verify the structure
   
    for (const item of transferItems) {
      //console.log('Processing item:', item); // Log each item

      if (item.itemID) {
        // Update total_stock for the matching product
        const updateResult = await Product.update(
          { total_stock: item.finalQuantity }, // Update stock with finalQuantity
          {
            where: {
              id: item.itemID, // Match the product by ID
              //store_id: from_store.value  // Match store if needed, based on product-store mapping
            },
          }
        );

        // Log update result

        // Insert remaining data into track_product_stock
        const trackResult = await TrackProductStock.create({
          product_id: item.itemID,
          item_name: item.itemName,
          reference_number: "INV" + referenceNumber,
          barcode_number: generateRandomBarcode(),
          store_id: from_store.value, // Store ID from which the stock is transferred
          quantity_changed: item.changeQuantity, // Amount of stock changed
          final_quantity: item.finalQuantity, // Final stock quantity
          default_price: item.defaultPrice, // Default price of the product
          comment: item.comment || "", // Optional comment
          item_unit: item.itemUnit,
          user_id: req.user.id,
          company_id: req.user.company_id, // Unit of measurement
          adjustmentType: item.AdjustmentType || "adjustment", // Default to 'adjustment' if not provided
          status_in_out: 1, // Assuming 1 means stock is going in, adjust accordingly
        });
      }
    }

    return res
      .status(200)
      .json({
        status: true,
        message: "Stock updated and tracked successfully",
      });
  } catch (error) {
    // Log the error for debugging
    console.error("Error:", error);
    return res
      .status(500)
      .json({ status: false, message: "Error occurred", error: error.message });
  }
};

//update stock only
exports.UpdateStockOnly = async (req, res) => {
  try {
    const { from_store, transferItems } = req.body;

    for (const item of transferItems) {
      if (item.itemID) {
        // Update total_stock for the matching product
        const updateResult = await Product.update(
          { total_stock: item.finalQuantity }, // Update stock with finalQuantity
          {
            where: {
              id: item.itemID, // Match the product by ID
              // store_id: from_store  // If your Product model is associated with store_id
            },
          }
        );

        // Log update result
        // console.log("Update Result:", updateResult);
        const referenceNumber = await generateUniqueReferenceNumber();
        // Insert remaining data into track_product_stock
        const trackResult = await TrackProductStock.create({
          product_id: item.itemID,
          item_name: item.itemName,
          store_id: from_store,
          reference_number: "INV" + referenceNumber,
          barcode_number: generateRandomBarcode(),
          quantity_changed: item.changeQuantity,
          final_quantity: item.finalQuantity,
          default_price: item.defaultPrice || 0,
          comment: item.comment || "",
          item_unit: item.itemUnit,
          user_id: req.user.id,
          company_id: req.user.company_id,
          adjustmentType: item.AdjustmentType || "adjustment",
          status_in_out: item.AdjustmentType === "Out" ? 0 : 1,
        });
      }
    }

    return res
      .status(200)
      .json({
        status: true,
        message: "Stock updated and tracked successfully",
      });
  } catch (error) {
    // Log the error for debugging
    console.error("Error:", error);
    return res
      .status(500)
      .json({ status: false, message: "Error occurred", error: error.message });
  }
};

/**
  Transfer product from one store to another
  @param {number} stockTransferLogId - The ID of the stock transfer log
  @param {string} transfer_type - The type of transfer (stock transfer, stock adjustment, stock transfer to sales, stock transfer to purchase)
  @param {number} from_store - The ID of the store from which the product is transferred
  @param {number} to_store - The ID of the store to which the product is transferred
  @param {object} product - The product to be transferred
  @param {object} transaction - The transaction object
  @returns {Promise<object>} - The stock transfer product
*/
const transferProduct = async (params) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { 
        stockTransferLogId, 
        transfer_type, 
        from_store, 
        to_store, 
        product, 
        transaction, 
        salesOrder, 
        purchaseOrder 
      } = params;

      // If the transferred quantity is less than or equal to 0, then return false
      if (product.transferred_quantity <= 0) {
        resolve(null);
      }

      // console.log("PARAMS:", params);

      // Create the stock transfer product
      const stockTransferProduct = await StockTransferProducts.create({
        stock_transfer_log_id: stockTransferLogId,
        product_id: product.id,
        product_variant_id: product.product_variant_id,
        transferred_quantity: product.transferred_quantity,
      }, { transaction });

      let previousStockFromStore = null;

      const previousStockToStore = await ProductStockEntry.findOne({
        attributes: ['id', 'quantity'],
        where: {
          product_id: product.id,
          product_variant_id: product.product_variant_id,
          warehouse_id: 
            transfer_type === 'sales_order_return' ? product.warehouse_id 
            : transfer_type === 'scrap_items' ? from_store : to_store,
        },
        raw: true,
      });

      if (transfer_type === 'stock_transfer' || transfer_type === 'scrap_items') {
        previousStockFromStore = await ProductStockEntry.findOne({
          attributes: ['id', 'quantity'],
          raw: true,
          where: {
            product_id: product.id,
            warehouse_id: from_store,
            product_variant_id: product.product_variant_id,
          },
        });

        await ProductStockEntry.update({
          quantity: previousStockFromStore.quantity - product.transferred_quantity,
        }, 
        {
          where: {
            id: previousStockFromStore.id,
          },
          transaction,
        });
      }

      // If the transfer type is stock transfer, add to stock, or sales order return, then increase the quantity of the product stock entry
      if (previousStockToStore &&['stock_transfer', 'add_to_stock', 'sales_order_return'].includes(transfer_type)) {
        await ProductStockEntry.update({
          quantity: previousStockToStore.quantity + product.transferred_quantity,
        }, {
          where: 
          {
            id: previousStockToStore.id,
          },
          transaction,
        });
      }

      // If the product is batch applicable and the transfer type is scrap items, then reduce the quantity of the batch from the receive product batch
      if (['scrap_items', 'sales_order_return'].includes(transfer_type) && product.is_batch_applicable) {
        const processBatchOperations = [];
        product.batches.forEach(batch => {
            processBatchOperations.push(
              new Promise(async (resolve, reject) => {
                try {
                  const receiveProductBatch = await ReceiveProductBatch.findOne({
                    attributes: ['id', 'available_quantity'],
                    where: { id: batch.id },
                    transaction,
                    include: [
                      {
                        association: 'receiveProduct',
                        attributes: ['id', 'available_quantity'],
                      }
                    ]
                  });
                  if (!receiveProductBatch) {
                    reject(new Error("Receive product batch not found"));
                  }

                  if (transfer_type === 'scrap_items') {
                    // Reduce the quantity of the batch from the receive product batch
                    await ReceiveProductBatch.update({
                      available_quantity: batch.available_quantity - batch.quantity,
                    }, {
                      where: { id: batch.id }, transaction 
                    });

                    // Reduce the quantity of the receive product from the receive product
                    await RecvProduct.update({
                      available_quantity: receiveProductBatch.receiveProduct.available_quantity - batch.quantity,
                    }, {
                      where: { id: receiveProductBatch.receiveProduct.id }, transaction 
                    });
                  } else if (transfer_type === 'sales_order_return') {
                    // Increase the quantity of the batch from the receive product batch
                    await ReceiveProductBatch.update({
                      available_quantity: batch.available_quantity + batch.quantity,
                    }, {
                      where: { id: batch.id }, transaction 
                    });
                  }


                  // Insert the stock transfer batch
                  await StockTransferBatch.create({
                    stock_transfer_log_id: stockTransferLogId,
                    stock_transfer_product_id: stockTransferProduct.id,
                    receive_product_batch_id: batch.id,
                    quantity: batch.quantity,
                  }, { transaction });
                  // Return the success
                resolve();
              } catch (error) {
                console.error("Error in processBatchOperations", error);
                reject(error);
              }
            }),
          );
        });
        // Reduce the quantity of the product stock entry from the product stock entry
        processBatchOperations.push(
          ProductStockEntry.update({
            quantity: previousStockToStore.quantity - product.transferred_quantity,
          }, {
            where: {
              id: previousStockToStore.id,
            },
            transaction,
          }),
        )
        // Execute the batch operations
        await Promise.all(processBatchOperations);
      }

      // Return the stock transfer product
      resolve(stockTransferProduct);
    } catch (error) {
      console.error("Error transferring product:", error);
      reject(new Error("Error transferring product"));
    }
  });
};

/**
  Stock transfer
  @param {object} req - The request object
  @param {object} res - The response object
  @returns {Promise<object>} - The stock transfer response
*/
exports.UpdateStockTranfer = async (req, res) => {
  let transaction = null;
  try {
    const { 
      from_store, 
      to_store, 
      transfer_type, 
      products, 
      comment,
      sales_order_reference_number,
      purchase_order_reference_number 
    } = req.body;

    // Generate unique reference number
    const referenceNumber = await generateUniqueReferenceNumber();

    // Begin transaction
    transaction = await sequelize.transaction();

    let salesOrder = null;
    let purchaseOrder = null;

    if (sales_order_reference_number) {
      // Check if the sales order reference number is already used
      salesOrder = await Sale.findOne({
        attributes: ['id'],
        where: { reference_number: sales_order_reference_number },
        raw: true,
        transaction,
      });
    }

    if (purchase_order_reference_number) {
      // Check if the purchase order reference number is already used
      purchaseOrder = await Purchase.findOne({
        attributes: ['id'],
        raw: true,
        where: { reference_number: purchase_order_reference_number },
        transaction,
      });
    }

    // Create stock transfer log
    const stockTransferLog = await StockTransferLog.create({
      user_id: req.user.id,
      company_id: req.user.company_id,
      reference_number: "INV" + referenceNumber,
      from_warehouse_id: from_store || null,
      to_warehouse_id: to_store || null,
      comment: comment,
      transfer_type,
      sales_id: salesOrder ? salesOrder.id : null,
      purchase_id: purchaseOrder ? purchaseOrder.id : null,
    }, { transaction });

    const stockTransferProductsPromises = products.map(product => {
      // Prepare the transfer product parameters
      const transferProductParams = {
        stockTransferLogId: stockTransferLog.id,
        transfer_type,
        from_store,
        to_store,
        product,
        transaction,
        salesOrder,
        purchaseOrder,
      };
      return transferProduct(transferProductParams);
    });

    // Execute the stock transfer products promises
    const stockTransferProducts = await Promise.all(stockTransferProductsPromises);

    // If for all products returned null then rollback with success message
    if (stockTransferProducts.every(product => product === null)) {
      await transaction.rollback();
      return res
        .status(200)
        .json({ status: true, message: "No products were transferred" });
    }

    // Commit the transaction
    await transaction.commit();

    // Return the success response
    return res
      .status(200)
      .json({ status: true, message: "Stock transfer recorded successfully" });
  } catch (error) {
    console.error("Error in UpdateStockTranfer:", error);
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    return res
      .status(500)
      .json({ status: false, message: "Error in UpdateStockTranfer", error: error.message });
  }
};

exports.StockAdjustment = async (req, res) => {
  try {
    const refID = req.params.id;
    // Fetch all products for the given store
    const getAllProductsbyStore = await TrackProductStock.findAll({
      where: {
        reference_number: refID,
      },
      include: [
        { model: Company, as: "companyManagement", attributes: ["company_name"] },
        //     { model: MasteruomModel, as: "Masteruom", attributes: ["unit_name"] },
        //     { model: TrackProductStock, as: "TrackProductStock"},
      ],
    });


    return res.status(200).json({ message: true, data: getAllProductsbyStore });
  } catch (err) {
    return res.status(400).json({ message: false, error: err.message });
  }
};

exports.GetAllActivity = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const getAllactivitydata = await TrackProductStock.findAll({
      where: {
        company_id: company_id,
      },
      group: ["reference_number"],
      order: [["product_id", "DESC"]],
    });

    return res.status(200).json({ message: true, data: getAllactivitydata });
  } catch (err) {
    return res.status(400).json(err);
  }
};

exports.referenceNumberCount = async (req, res) => {
  const referenceNumber = req.params.referenceNumber;

  try {
    const count = await TrackProductStock.count({
      where: { reference_number: referenceNumber },
    });
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching reference number count:", error);
    res.status(500).json({ error: "Error fetching reference number count" });
  }
};

exports.getStockTransferReport = async (req, res) => {
  try {
    let { startDate, endDate } = req.query;
    const companyId = req.user.company_id;

    const dateFilter = (startDate && endDate) ? `AND t_out.created_at BETWEEN :startDate AND :endDate` : "";

    const query = `
            SELECT 
                t_out.id AS out_id,
                t_in.id AS in_id,
                t_out.product_id,
                t_out.reference_number AS out_reference_number,
                t_in.reference_number AS in_reference_number,
                t_out.quantity_changed,
                t_out.created_at,
                p.product_name,
                p.product_code,
                w_from.name AS from_location,
                w_to.name AS to_location
            FROM track_product_stock t_out
            INNER JOIN track_product_stock t_in 
                ON REPLACE(t_out.reference_number, 'INVR', 'INV') = t_in.reference_number
                AND t_out.product_id = t_in.product_id
                AND t_out.status_in_out = 0
                AND t_in.status_in_out = 1
            LEFT JOIN product p ON t_out.product_id = p.id
            LEFT JOIN warehouse_settings w_from ON t_out.store_id = w_from.id
            LEFT JOIN warehouse_settings w_to ON t_in.store_id = w_to.id
            WHERE t_out.adjustmentType = 'StockTransfer'
              AND p.company_id = :companyId
              ${dateFilter}
            ORDER BY t_out.created_at DESC;
        `;

    const replacements = { companyId };
    if (startDate && endDate) {
      replacements.startDate = new Date(startDate);
      replacements.endDate = new Date(endDate);
    }

    const transfers = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    res.json({ success: true, data: transfers });
  } catch (error) {
    console.error("Stock Transfer Report Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.getStockAgingReport = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { fromDate, toDate } = req.query;

    if (!company_id) {
      return res.status(400).json({ error: "company_id is required" });
    }

    // Base SQL
    let whereClause = `t.status = 1 AND p.company_id = :company_id`;
    let replacements = { company_id };

    // Add date filters
    if (fromDate) {
      whereClause += ` AND DATE(t.created_at) >= :fromDate`;
      replacements.fromDate = fromDate;
    }
    if (toDate) {
      whereClause += ` AND DATE(t.created_at) <= :toDate`;
      replacements.toDate = toDate;
    }

    const results = await sequelize.query(`
      SELECT 
        p.product_name,
        p.product_code,
        w.name AS store_name,
        t.product_id,
        t.store_id,
        SUM(
          CASE 
            WHEN t.status_in_out = 1 THEN t.quantity_changed 
            ELSE -t.quantity_changed 
          END
        ) AS current_stock,
        MAX(t.created_at) AS last_movement_date,
        DATEDIFF(CURDATE(), MAX(t.created_at)) AS movement_day_count
      FROM 
        track_product_stock t
      JOIN 
        product p ON t.product_id = p.id
      JOIN 
        warehouse_settings w ON t.store_id = w.id
      WHERE 
        ${whereClause}
      GROUP BY 
        t.product_id, t.store_id, p.product_name, w.name
      HAVING current_stock > 0
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Error in getStockAgingReport:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.getTotalProductCount = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const totalCount = await Product.count({
      where: {
        company_id: companyId,
        status: 1,
      },
    });

    res.status(200).json({ totalCount });
  } catch (error) {
    console.error("Error fetching product count:", error);
    res.status(500).json({ message: "Failed to fetch product count", error: error.message });
  }
};


exports.getStorewiseMonthlyStockReport = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const [results] = await sequelize.query(`
      SELECT 
        tps.store_id,
        w.name AS store_name,
        DATE_FORMAT(tps.created_at, '%Y-%m') AS month,
        tps.product_id,
        SUM(CASE WHEN tps.status_in_out = 1 THEN tps.quantity_changed ELSE 0 END) AS total_in,
        SUM(CASE WHEN tps.status_in_out = 0 THEN tps.quantity_changed ELSE 0 END) AS total_out,
        (
          SUM(CASE WHEN tps.status_in_out = 1 THEN tps.quantity_changed ELSE 0 END) - 
          SUM(CASE WHEN tps.status_in_out = 0 THEN tps.quantity_changed ELSE 0 END)
        ) AS final_stock
      FROM track_product_stock tps
      JOIN warehouse_settings w ON tps.store_id = w.id
      WHERE tps.company_id = :companyId
      GROUP BY tps.store_id, w.name, month, tps.product_id
      ORDER BY month DESC, tps.store_id, tps.product_id;
    `, {
      replacements: { companyId },
    });

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error generating stock report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate stock report",
      error: error.message,
    });
  }
};


exports.getProductStockMaintenanceReport = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const [results] = await sequelize.query(`
      SELECT 
        p.product_name,
        p.product_code,
        w.name AS store_name,
        SUM(CASE 
              WHEN tps.status_in_out = 1 AND tps.store_id = p.store_id 
              THEN tps.quantity_changed ELSE 0 
            END) AS total_in,
        SUM(CASE 
              WHEN tps.status_in_out = 0 AND tps.store_id = p.store_id 
              THEN tps.quantity_changed ELSE 0 
            END) AS total_out,
        (
          SUM(CASE 
                WHEN tps.status_in_out = 1 AND tps.store_id = p.store_id 
                THEN tps.quantity_changed ELSE 0 
              END) - 
          SUM(CASE 
                WHEN tps.status_in_out = 0 AND tps.store_id = p.store_id 
                THEN tps.quantity_changed ELSE 0 
              END)
        ) AS current_stock,
        p.minimum_stock_level,
        CASE 
          WHEN (
            SUM(CASE 
                  WHEN tps.status_in_out = 1 AND tps.store_id = p.store_id 
                  THEN tps.quantity_changed ELSE 0 
                END) - 
            SUM(CASE 
                  WHEN tps.status_in_out = 0 AND tps.store_id = p.store_id 
                  THEN tps.quantity_changed ELSE 0 
                END)
          ) < p.minimum_stock_level
          THEN p.minimum_stock_level - (
            SUM(CASE 
                  WHEN tps.status_in_out = 1 AND tps.store_id = p.store_id 
                  THEN tps.quantity_changed ELSE 0 
                END) - 
            SUM(CASE 
                  WHEN tps.status_in_out = 0 AND tps.store_id = p.store_id 
                  THEN tps.quantity_changed ELSE 0 
                END)
          )
          ELSE 0
        END AS need,
        CASE 
          WHEN (
            SUM(CASE 
                  WHEN tps.status_in_out = 1 AND tps.store_id = p.store_id 
                  THEN tps.quantity_changed ELSE 0 
                END) - 
            SUM(CASE 
                  WHEN tps.status_in_out = 0 AND tps.store_id = p.store_id 
                  THEN tps.quantity_changed ELSE 0 
                END)
          ) > p.minimum_stock_level
          THEN (
            SUM(CASE 
                  WHEN tps.status_in_out = 1 AND tps.store_id = p.store_id 
                  THEN tps.quantity_changed ELSE 0 
                END) - 
            SUM(CASE 
                  WHEN tps.status_in_out = 0 AND tps.store_id = p.store_id 
                  THEN tps.quantity_changed ELSE 0 
                END)
          ) - p.minimum_stock_level
          ELSE 0
        END AS excess
      FROM product p
      LEFT JOIN track_product_stock tps ON tps.product_id = p.id
      LEFT JOIN warehouse_settings w ON w.id = p.store_id
      WHERE p.status = 1 AND p.company_id = :companyId
      GROUP BY p.product_name, p.product_code, p.minimum_stock_level, w.name
      ORDER BY p.product_name ASC;
    `, {
      replacements: { companyId }
    });

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error("Stock Maintenance Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate stock maintenance report.",
      error: error.message
    });
  }
};

exports.getSlowMovingItemReport = async (req, res) => {
  try {
    // Fetch the latest OUT movement date (status_in_out = 0)
    const latestMovements = await TrackProductStock.findAll({
      where: {
        status_in_out: 0, // Only outgoing movement
        company_id: req.user.company_id
      },
      attributes: [
        'product_id',
        'store_id',
        [TrackProductStock.sequelize.fn('MAX', TrackProductStock.sequelize.col('created_at')), 'last_movement_date']
      ],
      group: ['product_id', 'store_id'],
      raw: true
    });

    // Map to retrieve latest movement per product/store
    const result = await Promise.all(latestMovements.map(async (entry) => {
      const product = await Product.findByPk(entry.product_id);
      const store = await Warehouse.findByPk(entry.store_id);

      if (!product || !store) return null;

      const lastMovementDate = moment(entry.last_movement_date);
      const today = moment();
      const daysSinceMovement = today.diff(lastMovementDate, 'days');

      return {
        product_name: product.product_name,
        product_code: product.product_code,
        item_location: store.name,
        item_cost: product.default_price,
        last_movement_date: lastMovementDate.format('YYYY-MM-DD'),
        days_since_last_movement: daysSinceMovement
      };
    }));

    const filtered = result.filter(item => item !== null);
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching slow moving item report:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.getDeadStockReport = async (req, res) => {
  try {
    const company_id = req.user.company_id;

    const products = await Product.findAll({
      where: {
        company_id,
        status: 1,
      },
      include: [
        {
          model: TrackProductStock,
          as: "TrackProductStock",
          attributes: [],
          where: { company_id },
          required: false,
        },
        {
          model: MasteruomModel,
          as: "Masteruom",
          attributes: ["unit_name"],
        },
        {
          model: ProductCategory,
          as: "Categories",
          attributes: ["title"],
        },
      ],
      attributes: {
        include: [
          // ✅ Correct current stock: IN - OUT
          [
            literal(`(
              SELECT 
                COALESCE(SUM(CASE WHEN status_in_out = 1 THEN quantity_changed ELSE 0 END), 0) 
                - 
                COALESCE(SUM(CASE WHEN status_in_out = 0 THEN quantity_changed ELSE 0 END), 0)
              FROM track_product_stock 
              WHERE track_product_stock.product_id = product.id
              AND track_product_stock.company_id = '${company_id}'
            )`),
            "current_stock",
          ],
          // ✅ Last dispatch date (status_in_out = 0)
          [
            literal(`(
              SELECT MAX(created_at)
              FROM track_product_stock
              WHERE track_product_stock.product_id = product.id
              AND track_product_stock.status_in_out = 0
              AND track_product_stock.company_id = '${company_id}'
            )`),
            "last_dispatch_date",
          ],
        ],
      },
      order: [["product_name", "ASC"]],
    });

    const deadStockList = products
      .map((p) => {
        const stock = parseInt(p.dataValues.current_stock || 0);
        return {
          product_id: p.id,
          product_name: p.product_name,
          product_code: p.product_code,
          category: p.Categories?.title || "-",
          unit: p.Masteruom?.unit_name || "-",
          current_stock: stock,
          last_dispatch_date: p.dataValues.last_dispatch_date,
        };
      })
      .filter((item) => item.current_stock > 0); // Optional: filter only stocked items

    return res.status(200).json({
      success: true,
      data: deadStockList,
    });

  } catch (error) {
    console.error("Dead stock report error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dead stock report",
      error: error.message,
    });
  }
};

exports.getStockValuation = async (req, res) => {
  const company_id = req.user.company_id;
  try {
    const result = await TrackProductStock.findAll({
      where: { company_id },
      attributes: [
        'product_id',
        'item_name',
        'item_unit',
        'default_price',
        [fn('SUM', literal(`CASE WHEN status_in_out = 1 THEN quantity_changed ELSE -quantity_changed END`)), 'total_quantity']
      ],
      group: ['product_id', 'item_name', 'item_unit', 'default_price']
    });

    const valuation = result.map(row => ({
      product_id: row.product_id,
      item_name: row.item_name,
      quantity: parseFloat(row.getDataValue('total_quantity')),
      unit: row.item_unit,
      price: row.default_price,
      stock_value: parseFloat(row.getDataValue('total_quantity')) * (row.default_price || 0),
    }));

    const totalValue = valuation.reduce((sum, item) => sum + item.stock_value, 0);
    res.json({ valuation, totalValue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Stock Levels
exports.getStockLevels = async (req, res) => {
  const company_id = req.user.company_id;
  try {
    const result = await TrackProductStock.findAll({
      where: { company_id },
      attributes: [
        'product_id',
        [fn('SUM', literal(`CASE WHEN status_in_out = 1 THEN quantity_changed ELSE -quantity_changed END`)), 'total_quantity']
      ],
      group: ['product_id']
    });

    const stats = {
      negative: 0,
      low: 0,
      reorder: 0,
      optimum: 0,
      high: 0,
      excess: 0,
    };

    result.forEach(r => {
      const qty = parseFloat(r.getDataValue('total_quantity'));
      if (qty < 0) stats.negative++;
      else if (qty === 0) stats.low++;
      else if (qty < 50) stats.reorder++;
      else if (qty < 200) stats.optimum++;
      else if (qty < 500) stats.high++;
      else stats.excess++;
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Inventory Performance
exports.getInventoryPerformance = async (req, res) => {
  const company_id = req.user.company_id;
  try {
    const result = await TrackProductStock.findAll({
      where: { company_id },
      attributes: [
        [literal('YEARWEEK(created_at, 1)'), 'week'],
        'status_in_out',
        [fn('SUM', col('quantity_changed')), 'total']
      ],
      group: ['week', 'status_in_out'],
      order: [literal('week ASC')],
    });

    const grouped = {};
    result.forEach(entry => {
      const week = entry.getDataValue('week');
      const status = entry.getDataValue('status_in_out');
      const total = parseFloat(entry.getDataValue('total') || 0);

      if (!grouped[week]) {
        grouped[week] = { Inward: 0, Outward: 0 };
      }

      if (status === 1) grouped[week].Inward += total;
      else if (status === 0) grouped[week].Outward += total;
    });

    const sortedWeeks = Object.keys(grouped).sort();
    const labels = sortedWeeks.map(weekStr => {
      const year = weekStr.slice(0, 4);
      const week = weekStr.slice(4);
      return `Week ${week} - ${year}`;
    });

    const inwardData = sortedWeeks.map(week => grouped[week].Inward);
    const outwardData = sortedWeeks.map(week => grouped[week].Outward);

    res.json({
      labels,
      datasets: {
        Inward: inwardData,
        Outward: outwardData,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch inventory performance.' });
  }
};

// Top Items
exports.getTopItems = async (req, res) => {
  const company_id = req.user.company_id;
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Top Selling Items
    const topSelling = await TrackProductStock.findAll({
      where: {
        company_id,
        status_in_out: 0,
        created_at: { [Op.gte]: threeMonthsAgo },
      },
      attributes: [
        'item_name',
        [fn('COUNT', fn('DISTINCT', col('reference_number'))), 'invoice_count'],
        [fn('SUM', literal('quantity_changed * default_price')), 'traded_amount'],
      ],
      group: ['item_name'],
      order: [[literal('traded_amount'), 'DESC']],
      limit: 5,
    });

    // Top Purchased Items
    const topPurchased = await TrackProductStock.findAll({
      where: {
        company_id,
        status_in_out: 1,
        created_at: { [Op.gte]: threeMonthsAgo },
      },
      attributes: [
        'item_name',
        [fn('COUNT', fn('DISTINCT', col('reference_number'))), 'invoice_count'],
        [fn('SUM', literal('quantity_changed * default_price')), 'traded_amount'],
      ],
      group: ['item_name'],
      order: [[literal('traded_amount'), 'DESC']],
      limit: 5,
    });

    res.json({
      topSelling: topSelling.map(item => ({
        item_name: item.item_name,
        invoice_count: parseInt(item.getDataValue('invoice_count')),
        traded_amount: parseFloat(item.getDataValue('traded_amount') || 0),
      })),
      topPurchased: topPurchased.map(item => ({
        item_name: item.item_name,
        invoice_count: parseInt(item.getDataValue('invoice_count')),
        traded_amount: parseFloat(item.getDataValue('traded_amount') || 0),
      })),
    });
  } catch (error) {
    console.error('Error in getTopItems:', error);
    res.status(500).json({ error: 'Failed to fetch top items.' });
  }
};

// Inventory Overview
exports.getInventoryOverview = async (req, res) => {
  const company_id = req.user.company_id;
  try {
    const result = await TrackProductStock.findAll({
      where: { company_id },
      attributes: [
        'product_id',
        [fn('SUM', literal(`CASE WHEN status_in_out = 1 THEN quantity_changed ELSE -quantity_changed END`)), 'net_quantity'],
        'default_price'
      ],
      group: ['product_id', 'default_price']
    });

    let totalValuation = 0;
    const uniqueItems = new Set();

    result.forEach(row => {
      const qty = parseFloat(row.getDataValue('net_quantity') || 0);
      const price = parseFloat(row.default_price || 0);
      const value = qty * price;

      totalValuation += value;
      uniqueItems.add(row.product_id);
    });

    res.json({
      totalItems: uniqueItems.size,
      totalValuation: parseFloat(totalValuation.toFixed(2))
    });
  } catch (error) {
    console.error('Error in getInventoryOverview:', error);
    res.status(500).json({ error: 'Failed to fetch inventory overview.' });
  }
};



// api for low qty alert -------------------------------------------------------------------

exports.GetLowQtyProducts = async (req, res) => {
  try {
    const getAllProduct = await Product.findAll({
      where: { status: 1 },
      order: [["id", "DESC"]],
      include: [
        { model: MasteruomModel, as: "Masteruom", attributes: ["unit_name"] },
        {
          model: TrackProductStock,
          as: "TrackProductStock",
          attributes: ["store_id", "quantity_changed", "status_in_out"],
        },
      ],
    });

    // Group low stock products by company_id
    const companyLowStockMap = {};

    for (const product of getAllProduct) {
      const productData = product.toJSON();

      let stockIn = 0, stockOut = 0;

      productData.TrackProductStock.forEach((entry) => {
        const qty = parseFloat(entry.quantity_changed || 0);
        if (entry.status_in_out === 1) stockIn += qty;
        else stockOut += qty;
      });

      const currentStock = stockIn - stockOut;
      const minStock = parseFloat(productData.minimum_stock_level || 0);

      if (currentStock < minStock) {
        if (!companyLowStockMap[productData.company_id]) {
          companyLowStockMap[productData.company_id] = {
            products: [],
          };
        }

        companyLowStockMap[productData.company_id].products.push({
          product_name: productData.product_name,
          current_stock: currentStock,
          minimum_stock_level: minStock,
        });
      }
    }

    const sentMessages = [];

    // Loop through companies that have low stock products
    for (const companyId in companyLowStockMap) {
      const companyDetails = await Company.findOne({
        where: { id: companyId },
        attributes: ["company_name", "whatsapp_number", "p_isd"]
      });

      const whatsappConfig = await GeneralSettings.findOne({
        where: { company_id: companyId, is_active: 1 },
        attributes: ["gupshup_token", "gupshup_phone"]
      });

      if (!companyDetails?.whatsapp_number || !whatsappConfig?.gupshup_token || !whatsappConfig?.gupshup_phone) {
        // console.log(`⚠️ Skipping company ${companyId} due to missing WhatsApp config.`);
        continue;
      }

      const lowStockList = companyLowStockMap[companyId].products;
      const totalLowStock = lowStockList.length;

      const productSummary = lowStockList.map((p, idx) =>
        `${idx + 1}) ${p.product_name} [C:${p.current_stock}, M:${p.minimum_stock_level}]`
      ).join(' | '); // Avoid line breaks for WhatsApp template compatibility

      const templateParams = [
        companyDetails.company_name,                                   // {{1}} Company Name
        `${totalLowStock} product${totalLowStock > 1 ? 's' : ''}`,     // {{2}} Count
        productSummary,                                                 // {{3}} Product list
      ];

      // Send WhatsApp via GupShup
      await GupShupMessage(
        companyDetails.p_isd || "91",                                  // ISD
        companyDetails.whatsapp_number,
        whatsappConfig.gupshup_token,
        whatsappConfig.gupshup_phone,
        "ad66535c-ded4-484b-b1b7-372c576deba6",                         // Your approved 5-var template ID
        templateParams
      );

      sentMessages.push({
        company_name: companyDetails.company_name,
        whatsapp_number: companyDetails.whatsapp_number,
        total_low_stock: totalLowStock,
        products: lowStockList,
      });
    }

    return res.status(200).json({
      message: true,
      companies_notified: sentMessages.length,
      details: sentMessages
    });

  } catch (err) {
    console.error("Low stock error:", err);
    return res.status(400).json({ error: err.message });
  }
};


exports.GetOverStockProducts = async (req, res) => {
  try {
    const getAllProduct = await Product.findAll({
      where: { status: 1 },
      order: [["id", "DESC"]],
      include: [
        { 
          association: "masterUOM", 
          attributes: ["name"]
        },
        {
          model: TrackProductStock,
          as: "TrackProductStock",
          attributes: ["store_id", "quantity_changed", "status_in_out"],
        },
      ],
    });

    const companyOverStockMap = {};

    for (const product of getAllProduct) {
      const productData = product.toJSON();

      let stockIn = 0, stockOut = 0;

      productData.TrackProductStock.forEach((entry) => {
        const qty = parseFloat(entry.quantity_changed || 0);
        if (entry.status_in_out === 1) stockIn += qty;
        else stockOut += qty;
      });

      const currentStock = stockIn - stockOut;
      const maxStock = parseFloat(productData.maximum_stock_level || 0);

      if (maxStock && currentStock > maxStock) {
        if (!companyOverStockMap[productData.company_id]) {
          companyOverStockMap[productData.company_id] = {
            products: [],
          };
        }

        companyOverStockMap[productData.company_id].products.push({
          product_name: productData.product_name,
          current_stock: currentStock,
          maximum_stock_level: maxStock,
        });
      }
    }

    const sentMessages = [];

    for (const companyId in companyOverStockMap) {
      const companyDetails = await Company.findOne({
        where: { id: companyId },
        attributes: ["company_name", "whatsapp_number", "p_isd"]
      });

      const whatsappConfig = await GeneralSettings.findOne({
        where: { company_id: companyId, is_active: 1 },
        attributes: ["gupshup_token", "gupshup_phone"]
      });

      if (!companyDetails?.whatsapp_number || !whatsappConfig?.gupshup_token || !whatsappConfig?.gupshup_phone) {
        // console.log(`⚠️ Skipping company ${companyId} due to missing or inactive WhatsApp config.`);
        continue;
      }

      const overStockList = companyOverStockMap[companyId].products;
      const totalOverStock = overStockList.length;

      const productSummary = overStockList.map((p, idx) =>
        `${idx + 1}) ${p.product_name} [C:${p.current_stock}, M:${p.maximum_stock_level}]`
      ).join(' | ');

      const templateParams = [
        companyDetails.company_name,                                      // {{1}}
        `${totalOverStock} product${totalOverStock > 1 ? 's' : ''}`,      // {{2}}
        productSummary,                                                   // {{3}}                           
      ];

      await GupShupMessage(
        companyDetails.p_isd || "91",
        companyDetails.whatsapp_number,
        whatsappConfig.gupshup_token,
        whatsappConfig.gupshup_phone,
        "c626d7aa-f02a-457c-920d-1e3af84cc463",                           // Template ID
        templateParams
      );

      sentMessages.push({
        company_name: companyDetails.company_name,
        whatsapp_number: companyDetails.whatsapp_number,
        total_over_stock: totalOverStock,
        products: overStockList,
      });
    }

    return res.status(200).json({
      message: true,
      companies_notified: sentMessages.length,
      details: sentMessages
    });

  } catch (err) {
    console.error("Overstock error:", err);
    return res.status(400).json({ error: err.message });
  }
};







// api end for low qty alert








const TOGETHER_API_KEY = '5d764e27aec4baf02d0a9c47f668492fe78251de70895943c199cfa2d38f893b'; // Replace with your actual key

exports.generateProductReport = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt and company_id are required.' });
    }

    // Fetch products with all relations
    const products = await Product.findAll({
      where: { company_id: req.user.company_id, status: 1 },
      include: [
        {
          model: ProductCategories,
          as: 'Categories',
          attributes: ['title']
        },
        {
          model: MasteruomModel,
          as: 'Masteruom',
          attributes: ['unit_name']
        },
        {
          model: TrackProductStock,
          as: 'TrackProductStock',
          attributes: ['quantity_changed', 'status_in_out', 'store_id'],
          include: [
            {
              model: Warehouse,
              as: 'Store',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    // Aggregate stock data per product per store
    const structuredData = [];

    products.forEach(product => {
      const stockGroups = {};

      product.TrackProductStock?.forEach(entry => {
        const storeName = entry.Store?.name || 'Unknown';

        if (!stockGroups[storeName]) {
          stockGroups[storeName] = { stock_in: 0, stock_out: 0 };
        }

        if (entry.status_in_out === 1) {
          stockGroups[storeName].stock_in += entry.quantity_changed;
        } else if (entry.status_in_out === 0) {
          stockGroups[storeName].stock_out += entry.quantity_changed;
        }
      });

      Object.entries(stockGroups).forEach(([store, stock]) => {
        structuredData.push({
          store,
          product_name: product.product_name,
          product_code: product.product_code,
          category: product.Categories?.title,
          unit: product.Masteruom?.unit_name,


          min_stock: product.minimum_stock_level,
          max_stock: product.maximum_stock_level,
          current_stock: stock.stock_in - stock.stock_out,
          stock_in: stock.stock_in,
          stock_out: stock.stock_out,
        });
      });
    });

    // Send to Together AI
    const finalPrompt = `
You are an inventory analyst. Based on the user request and the following product inventory data (store-wise), generate a detailed inventory report.

User Request:
${prompt}

Inventory Data:
${JSON.stringify(structuredData, null, 2)}
    `;

    const aiResponse = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        messages: [{ role: 'user', content: finalPrompt }],
        max_tokens: 2000,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const report = aiResponse.data.choices[0].message.content;
    return res.status(200).json({ report });

  } catch (error) {
    console.error('AI Universal Report Error:', error.message);
    return res.status(500).json({ error: 'Failed to generate inventory report.' });
  }
};

/**
 * Add products to stock (multiple products at once)
 * Validates that no duplicate product_id & warehouse_id combinations exist in the payload
 * Validates that all products and warehouses exist
 * Begins transaction
 * Prepares entries for bulk insert
 * Bulk creates stock entries
 * Commits transaction
 * Returns success message and created entries
 * If error occurs, rolls back transaction and returns error message
 */
exports.AddToStock = async (req, res) => {
  let transaction = null;
  try {
    const stockEntries = req.body;

    // Validate that payload is an array
    if (!Array.isArray(stockEntries) || stockEntries.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Payload must be a non-empty array of stock entries"
      });
    }

    // Validate each entry and check for duplicates
    const seen = new Set();
    const duplicates = [];
    const validationErrors = [];

    for (let i = 0; i < stockEntries.length; i++) {
      const entry = stockEntries[i];
      const index = i + 1;

      // Required fields validation
      if (!entry.product_id) {
        validationErrors.push(`Entry ${index}: product_id is required`);
      }
      if (!entry.product_variant_id) {
        validationErrors.push(`Entry ${index}: product_variant_id is required`);
      }
      if (!entry.warehouse_id) {
        validationErrors.push(`Entry ${index}: warehouse_id is required`);
      }
      if (entry.quantity === undefined || entry.quantity === null) {
        validationErrors.push(`Entry ${index}: quantity is required`);
      }

      // Check for duplicate product_id & warehouse_id combination
      if (entry.product_id && entry.warehouse_id) {
        const key = `${entry.product_id}_${entry.warehouse_id}`;
        if (seen.has(key)) {
          duplicates.push({
            product_id: entry.product_id,
            product_variant_id: entry.product_variant_id,
            warehouse_id: entry.warehouse_id,
            entry_index: index
          });
        } else {
          seen.add(key);
        }
      }
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: false,
        message: "Validation errors found",
        errors: validationErrors
      });
    }

    // Return error if duplicates found
    if (duplicates.length > 0) {
      return res.status(400).json({
        status: false,
        message: "Duplicate product_id and warehouse_id combinations found in payload",
        duplicates: duplicates
      });
    }

    // Validate that no duplicate product_id & warehouse_id combinations exist in the payload
    const productWarehousePairs = stockEntries.map(e => ({
      product_id: e.product_id,
      warehouse_id: e.warehouse_id,
      product_variant_id: e.product_variant_id
    }));


    const existingStockRows = await ProductStockEntry.findAll({
      where: {
        company_id: req.user.company_id,
        [Op.or]: productWarehousePairs
      },
      attributes: ['product_id', 'warehouse_id', 'product_variant_id'],
      raw: true
    });

    // Return error if stock already exists for some product and warehouse combinations
    if (existingStockRows.length > 0) {
      return res.status(400).json({
        status: false,
        message: "Stock already exists for some product and warehouse combinations",
        existing_entries: existingStockRows
      });
    }
    // Begin transaction
    transaction = await sequelize.transaction();

    // Prepare entries for bulk insert
    const entriesToCreate = stockEntries.map(entry => ({
      company_id: req.user.company_id,
      product_id: entry.product_id,
      product_variant_id: entry.product_variant_id,
      warehouse_id: entry.warehouse_id,
      buffer_size: entry.buffer_size,
      user_id: req.user.id,
      quantity: entry.quantity
    }));

    // Bulk create stock entries
    const createdEntries = await ProductStockEntry.bulkCreate(entriesToCreate, {
      transaction,
      returning: true
    });

    // Commit transaction
    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: `${createdEntries.length} stock entries added successfully`,
      data: createdEntries
    });

  } catch (error) {
    // Rollback transaction if error occurred
    if (transaction) {
      await transaction.rollback();
    }
    console.error("Add to stock error:", error);
    return res.status(500).json({
      status: false,
      message: "Error adding products to stock",
      error: error.message
    });
  }
};

/** CSV headers for bulk add to stock */
const BULK_STOCK_HEADERS = {
  PRODUCT_CODE: 'Product Code',
  STORE_NAME: 'Store Name',
  UOM: 'UOM',
  WEIGHT_PER_UNIT: 'Weight Per Unit',
  QUANTITY: 'Quantity',
  BUFFER_SIZE: 'Buffer Size',
};

/**
 * Bulk add to stock from CSV file.
 * Headers: Product Code, Store Name, UOM, Weight Per Unit, Quantity, Buffer Size.
 * Resolves product_variant_id using (product_id, uom, weight_per_unit).
 * If (product_id, warehouse_id, product_variant_id) exists: update quantity (add to existing). Otherwise create new ProductStockEntry.
 * Optimized for 200+ rows: batch lookups, bulk create, batched updates.
 */
exports.BulkAddToStock = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({
        status: false,
        message: 'No file uploaded. Please upload a CSV file.',
      });
    }

    const companyId = req.user.company_id;
    const userId = req.user.id;

    if (path.extname(req.file.originalname).toLowerCase() !== '.csv') {
      return res.status(400).json({
        status: false,
        message: 'Invalid file type. Only CSV files are allowed.',
      });
    }

    const rows = await parseCSVFromBuffer(req.file.buffer);
    if (!rows.length) {
      return res.status(400).json({
        status: false,
        message:
          'CSV file has no data rows. Headers: Product Code, Store Name, Quantity, Buffer Size.',
      });
    }

    /* -----------------------------------------------------
       STEP 1: Aggregate (product_code + store_name + uom + weight_per_unit)
       ----------------------------------------------------- */

    const aggregated = new Map();

    for (const row of rows) {
      const product_code = String(row[BULK_STOCK_HEADERS.PRODUCT_CODE] || '').trim();
      const store_name = String(row[BULK_STOCK_HEADERS.STORE_NAME] || '').trim();
      const uom = String(row[BULK_STOCK_HEADERS.UOM] || '').trim();
      const weight_per_unit = Number(row[BULK_STOCK_HEADERS.WEIGHT_PER_UNIT] || 0);
      const quantity = Number(row[BULK_STOCK_HEADERS.QUANTITY]);
      const buffer_size = Number(row[BULK_STOCK_HEADERS.BUFFER_SIZE] || 0);

      if (
        !product_code ||
        !store_name ||
        !uom ||
        isNaN(weight_per_unit) ||
        isNaN(quantity) ||
        quantity < 0
      ) continue;

      const key = `${product_code}__${store_name}__${uom}__${weight_per_unit}`;

      if (!aggregated.has(key)) {
        aggregated.set(key, { quantity: 0, buffer_size });
      }

      const entry = aggregated.get(key);
      entry.quantity += quantity;
      entry.buffer_size = buffer_size; // last value wins
      entry.uom = uom;
      entry.weight_per_unit = weight_per_unit;
    }

    if (!aggregated.size) {
      return res.status(400).json({
        status: false,
        message:
          'No valid rows. Each row must have Product Code, Store Name, UOM, Weight Per Unit, and non-negative Quantity.',
      });
    }

    const rowsToProcess = [...aggregated.entries()].map(([key, val]) => {
      const [product_code, store_name, uom, weightPerUnit] = key.split('__');
      return {
        product_code,
        store_name,
        uom,
        weight_per_unit: Number(weightPerUnit),
        ...val,
      };
    });

    /* -----------------------------------------------------
       STEP 2: Fetch Products & Warehouses
       ----------------------------------------------------- */

    const productCodes = [...new Set(rowsToProcess.map(r => r.product_code))];
    const storeNames = [...new Set(rowsToProcess.map(r => r.store_name))];
    const uoms = [...new Set(rowsToProcess.map(r => r.uom))];
    const weight_per_units = [...new Set(rowsToProcess.map(r => r.weight_per_unit))];

    const [products, warehouses, masterUoms] = await Promise.all([
      Product.findAll({
        where: { product_code: productCodes, company_id: companyId },
        attributes: ['id', 'product_code'],
        raw: true,
      }),
      Warehouse.findAll({
        where: { name: storeNames, company_id: companyId },
        attributes: ['id', 'name'],
        raw: true,
      }),
      MasterUOM.findAll({
        where: {
          [Op.or]: [
            { label: uoms },
            { name: uoms },
          ],
        },
        attributes: ['id', 'label', 'name'],
        raw: true,
      }),
    ]);

    const productMap = new Map(products.map(p => [p.product_code, p.id]));
    const warehouseMap = new Map(warehouses.map(w => [w.name, w.id]));
    const uomMap = new Map();
    for (const u of masterUoms) {
      if (u.label) uomMap.set(String(u.label).trim().toLowerCase(), u.id);
      if (u.name) uomMap.set(String(u.name).trim().toLowerCase(), u.id);
    }

    const productIds = [...new Set(products.map(p => p.id))];
    const uomIds = [...new Set(masterUoms.map(u => u.id))];
    const variants =
      productIds.length && uomIds.length
        ? await ProductVariant.findAll({
            where: {
              company_id: companyId,
              product_id: productIds,
              uom_id: uomIds,
              weight_per_unit: weight_per_units,
            },
            attributes: ['id', 'product_id', 'uom_id', 'weight_per_unit'],
            raw: true,
          })
        : [];

    const variantMap = new Map(
      variants.map(v => [
        `${v.product_id}_${v.uom_id}_${Number(v.weight_per_unit)}`,
        v.id,
      ])
    );

    /* -----------------------------------------------------
       STEP 3: Resolve IDs
       ----------------------------------------------------- */

    const resolved = [];
    const errors = [];

    for (const r of rowsToProcess) {
      const product_id = productMap.get(r.product_code);
      const warehouse_id = warehouseMap.get(r.store_name);
      const uom_id = uomMap.get(String(r.uom).trim().toLowerCase());

      if (!product_id) {
        errors.push({ ...r, reason: 'Product not found' });
        continue;
      }

      if (!warehouse_id) {
        errors.push({ ...r, reason: 'Store not found' });
        continue;
      }

      if (!uom_id) {
        errors.push({ ...r, reason: 'UOM not found' });
        continue;
      }

      const variantKey = `${product_id}_${uom_id}_${Number(r.weight_per_unit)}`;
      console.log("variantKey", variantKey);
      console.log("variantMap", variantMap);
      const product_variant_id = variantMap.get(variantKey);
      if (!product_variant_id) {
        errors.push({
          ...r,
          reason: 'Product variant not found for UOM and Weight Per Unit',
        });
        continue;
      }

      resolved.push({ product_id, warehouse_id, product_variant_id, ...r });
    }

    if (!resolved.length) {
      return res.status(400).json({
        status: false,
        message: 'No rows could be processed.',
        errors,
      });
    }

    /* -----------------------------------------------------
       STEP 4: Fetch Existing Stock Entries
       ----------------------------------------------------- */

    const existing = await ProductStockEntry.findAll({
      where: {
        company_id: companyId,
        [Op.or]: resolved.map(r => ({
          product_id: r.product_id,
          warehouse_id: r.warehouse_id,
          product_variant_id: r.product_variant_id,
        })),
      },
      attributes: ['id', 'product_id', 'warehouse_id', 'product_variant_id', 'quantity'],
      raw: true,
      transaction,
    });

    const existingMap = new Map(
      existing.map(e => [`${e.product_id}_${e.warehouse_id}_${e.product_variant_id}`, e])
    );

    const toCreate = [];
    const toUpdate = [];

    for (const r of resolved) {
      const key = `${r.product_id}_${r.warehouse_id}_${r.product_variant_id}`;
      const found = existingMap.get(key);

      console.log("KEY", key);
      console.log("found", found);

      if (found) {
        toUpdate.push({
          id: found.id,
          quantity: found.quantity + r.quantity,
          buffer_size: r.buffer_size,
        });
      } else {
        toCreate.push({
          company_id: companyId,
          product_id: r.product_id,
          product_variant_id: r.product_variant_id,
          warehouse_id: r.warehouse_id,
          quantity: r.quantity,
          buffer_size: r.buffer_size,
          user_id: userId,
        });
      }
    }

    /* -----------------------------------------------------
       STEP 5: DB Operations
       ----------------------------------------------------- */

    if (toCreate.length) {
      await ProductStockEntry.bulkCreate(toCreate, { transaction });
    }

    for (const row of toUpdate) {
      await ProductStockEntry.update(
        {
          quantity: row.quantity,
          buffer_size: row.buffer_size,
        },
        { where: { id: row.id }, transaction }
      );
    }

    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: 'Bulk add to stock completed.',
      created: toCreate.length,
      updated: toUpdate.length,
      errors: errors.length ? errors : undefined,
    });

  } catch (error) {
    await transaction.rollback();
    console.error('BulkAddToStock error:', error);

    return res.status(500).json({
      status: false,
      message: 'Error processing bulk add to stock',
      error: error.message,
    });
  }
};

/**
 * Get all stock entries
 * filters: product_id, warehouse_id, brand_id, product_type_id, page, limit, searchkey
 * returns: list of stock entries
 * if error occurs, returns error message
 */
exports.GetStockEntries = async (req, res) => {
  try {
    // query params
    const { product_id, warehouse_id, brand_id, product_type_id, searchkey } = req.query;
     // pagination params
     const page = parseInt(req.query.page, 10) || 1;
     const limit = parseInt(req.query.limit, 10) || 10;
     const offset = (page - 1) * limit;
    // where clause
    const where = {
      company_id: req.user.company_id,
    };
    // filter by product_id if provided
    if (product_id) {
      where.product_id = product_id;
    }
    // filter by warehouse_id if provided
    if (warehouse_id) {
      where.warehouse_id = warehouse_id;
    }

    // filter by searchkey if provided
    let productWhere = {};
    let brandWhere = null;

    let isProductRequired = false;
    if (searchkey) {
      isProductRequired = true;
      productWhere[Op.or] = [
        { product_name: { [Op.like]: `%${searchkey}%` } },
        { sku_product: { [Op.like]: `%${searchkey}%` } },
        { product_code: { [Op.like]: `%${searchkey}%` } }
      ];
    }

    // filter by product_type_id if provided
    if (product_type_id) {
      productWhere.product_type_id = product_type_id;
      isProductRequired = true;
    }

    // filter by brand_id if provided
    if (brand_id) {
      brandWhere = { id: brand_id };
      isProductRequired = true;
    }

    // get stock entries
    const stockEntries = await ProductStockEntry.findAndCountAll({
      attributes: [
        'id', 
        'quantity', 
        'buffer_size',
        'inventory_at_transit', 
        'inventory_at_production',
        'sale_order_recieved',
        'created_at'
      ],
      where,
      order: [['id', 'DESC']],
      limit,
      offset,
      subQuery: false,
      distinct: true,
      include: [
        {
          association: 'productVariant',
          attributes: ['id', 'weight_per_unit'],
          include: [
            {
              association: 'masterUOM',
              attributes: ['name', 'label'],
            }
          ]
        },
        {
          association: 'product',
          attributes: [
            'id', 
            'product_name', 
            'sku_product', 
            'product_code',
            'is_batch_applicable',
          ],
          where: productWhere,
          required: isProductRequired,
          include: [
            {
              association: 'productCategory',
              attributes: ['id', 'title'],
            },
            {
              association: 'masterProductType',
              attributes: ['name'],
            },
            {
              association: 'masterBrand',
              attributes: ['name'],
              ...(brandWhere ? { where: brandWhere } : {}),
              required: brandWhere ? true : false,
            }
          ]
        },
        {
          association: 'warehouse',
          attributes: ['id', 'name'],
        },
      ],
    });

    // paginate stock entries
    const paginatedStockEntries = CommonHelper.paginate(stockEntries, page, limit);

    // return stock entries with pagination details
    return res.status(200).json({ 
      status: true, 
      message: "Stock entries fetched successfully", 
      data: paginatedStockEntries 
    });
  } catch (error) {
    console.error("Get stock entries error:", error);
    return res.status(500).json({ status: false, message: "Error getting stock entries", error: error.message });
  }
};

/**
 * Get stock entry by id
 * id: stock entry id
 * returns: stock entry
 * if error occurs, returns error message
 */
exports.GetStockEntriesById = async (req, res) => {
  try {
    const { id } = req.params;

    // get stock entry by id
    const stockEntry = await ProductStockEntry.findOne({
      attributes: ['id', 'product_id', 'warehouse_id', 'quantity', 'created_at'],
      where: { id, company_id: req.user.company_id },
      include: [
        {
          association: 'productVariant',
          attributes: ['id', 'weight_per_unit'],
          include: [
            {
              association: 'masterUOM',
              attributes: ['name', 'label'],
            }
          ]
        }
      ]
    });
    // if stock entry not found, return 404
    if (!stockEntry) {
      return res.status(404).json({ status: false, message: "Stock entry not found" });
    }
    return res.status(200).json({ status: true, message: "Stock entry fetched successfully", data: stockEntry });
  }
  catch (error) {
    console.error("Get stock entry by id error:", error);
    return res.status(500).json({ status: false, message: "Error getting stock entry by id", error: error.message });
  }
};

/**
 * Delete stock entry by id (soft delete)
 * id: stock entry id
 * returns: success message
 * if error occurs, returns error message
 */
exports.DeleteStockEntry = async (req, res) => {
  try {
    const { id } = req.params;
    // delete stock entry by id
    const deletedStockEntry = await ProductStockEntry.destroy({
      where: { id }
    });
    // if deleted stock entry is 0, return 404
    if (!deletedStockEntry) {
      return res.status(404).json({ status: false, message: "Stock entry not found" });
    }
    // return success message
    return res.status(200).json({ status: true, message: "Stock entry deleted successfully" });
  }
  catch (error) {
    console.error("Delete stock entry by id error:", error);
    return res.status(500).json({ status: false, message: "Error deleting stock entry by id", error: error.message });
  }
};

/**
 * Get store-wise stock for a particular product
 * @param {object} req - The request object
 * @param {object} req.params - Route parameters
 * @param {number} req.params.id - Product ID
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */
exports.GetStoreWiseStock = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate product exists
    const product = await Product.findOne({
      where: { 
        id,
        company_id: req.user.company_id
      },
      attributes: ['id', 'product_name', 'product_code'],
      raw: true,
    });

    if (!product) {
      return res.status(404).json({ 
        status: false, 
        message: "Product not found" 
      });
    }

    // Get stock entries for this product grouped by warehouse
    const stockEntries = await ProductStockEntry.findAll({
      attributes: [
        'id',
        'warehouse_id',
        'quantity',
        'inventory_at_transit',
        'inventory_at_production',
        'created_at',
        'updated_at'
      ],
      where: { 
        product_id: id,
        company_id: req.user.company_id
      },
      include: [
        {
          association: 'warehouse',
          attributes: ['id', 'name', 'address1', 'city', 'state']
        }
      ],
      order: [['warehouse_id', 'ASC']]
    });

    // Format the response
    const storeWiseStock = stockEntries.map(entry => ({
      stock_entry_id: entry.id,
      warehouse: {
        id: entry.warehouse?.id,
        name: entry.warehouse?.name,
        // address: entry.warehouse?.address1,
        // city: entry.warehouse?.city,
        // state: entry.warehouse?.state
      },
      available_stock: entry.quantity || 0,
      inventory_at_transit: entry.inventory_at_transit || 0,
      inventory_at_production: entry.inventory_at_production || 0,
      // total_available: (entry.quantity || 0) + (entry.inventory_at_transit || 0) + (entry.inventory_at_production || 0),
      created_at: entry.created_at,
      updated_at: entry.updated_at
    }));

    // Calculate total stock across all warehouses
    const totalStock = stockEntries.reduce((sum, entry) => {
      return sum + (entry.quantity || 0) + (entry.inventory_at_transit || 0) + (entry.inventory_at_production || 0);
    }, 0);

    return res.status(200).json({
      status: true,
      message: "Store-wise stock fetched successfully",
      data: {
        product: {
          id: product.id,
          product_name: product.product_name,
          product_code: product.product_code
        },
        stores: storeWiseStock,
        total_stock_across_all_stores: totalStock
      }
    });
  } catch (error) {
    console.error("Get store-wise stock error:", error);
    return res.status(500).json({ 
      status: false, 
      message: "Error getting store-wise stock", 
      error: error.message 
    });
  }
};

/**
 * Update stock entry quantity
 * @param {object} req - The request object
 * @param {object} req.params - Route parameters
 * @param {number} req.params.id - Stock entry id
 * @param {object} req.body - The request body
 * @param {object} res - The response object
 * @returns {Promise<void>}
 * if error occurs, returns error message
 * if stock entry not found, returns 404
 * if stock entry updated successfully, returns success message
 * if stock entry quantity is not updated, returns error message
 */
exports.UpdateStockEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, warehouse_id, quantity } = req.body;

    // check if the stock entry exists
    const stockEntry = await ProductStockEntry.findOne({
      attributes: ['id', 'quantity'],
      where: { id, product_id, warehouse_id },
      raw: true,
    });
    // if the stock entry does not exist, return 404
    if (!stockEntry) {
      return res.status(404).json({ status: false, message: "Stock entry not found" });
    }
    // update the stock entry
    await ProductStockEntry.update({ quantity }, { where: { id } });
    // return success message
    return res.status(200).json({ status: true, message: "Stock entry updated successfully" });
  } catch (error) {
    console.error("Update stock entry error:", error);
    return res.status(500).json({ status: false, message: "Error updating stock entry", error: error.message });
  }
};

/**
 * Indent required products
 * filters: product_id, warehouse_id, page, limit, searchkey
 * returns: list of indent required products
 * if error occurs, returns error message
 */
exports.GetIndentRequiredProducts = async (req, res) => {
  try {
    // query params
    const { product_id, warehouse_id, product_type_id, searchkey } = req.query;
     // pagination params
     const page = parseInt(req.query.page, 10) || 1;
     const limit = parseInt(req.query.limit, 10) || 10;
     const offset = (page - 1) * limit;
    // where clause
    const where = {
      company_id: req.user.company_id,
    };
    // filter by product_id if provided
    if (product_id) {
      where.product_id = product_id;
    }
    // filter by warehouse_id if provided
    if (warehouse_id) {
      where.warehouse_id = warehouse_id;
    }

    // filter by searchkey if provided
    let productWhere = {};
    let isProductRequired = false;

    if (searchkey) {
      productWhere[Op.or] = [
        { product_name: { [Op.like]: `%${searchkey}%` } },
        { sku_product: { [Op.like]: `%${searchkey}%` } },
        { product_code: { [Op.like]: `%${searchkey}%` } }
      ];
      isProductRequired = true;
    }

    // filter by product_type_id if provided
    if (product_type_id) {
      productWhere.product_type_id = product_type_id;
      isProductRequired = true;
    }
    // get stock entries
    const stockEntries = await ProductStockEntry.findAndCountAll({
      attributes: [
        'id', 
        'quantity', 
        'inventory_at_transit', 
        'inventory_at_production',
        'sale_order_recieved',
        'created_at',
        [
          literal(`
            (
              (
                product.buffer_size +
                (product.buffer_size * 0.005) +
                ProductStockEntry.sale_order_recieved
              )
              -
              (
                ProductStockEntry.quantity +
                ProductStockEntry.inventory_at_transit
              )
            )
          `),
          'inventory_needed'
        ]
      ],
      where: {
        ...where,
        [Op.and]: [
          literal(`
            (
              (
                product.buffer_size +
                (product.buffer_size * 0.005) +
                ProductStockEntry.sale_order_recieved
              )
              -
              (
                ProductStockEntry.quantity +
                ProductStockEntry.inventory_at_transit
              )
            ) > 0
          `)
        ]
      },
      order: [['id', 'DESC']],
      limit,
      offset,
      subQuery: false,
      include: [
        {
          association: 'product',
          attributes: [
            'id', 
            'product_name', 
            'sku_product', 
            'product_code', 
            'buffer_size', 
            'is_batch_applicable',
          ],
          where: productWhere,
          required: isProductRequired,
          include: [
            {
              association: 'productCategory',
              attributes: ['id', 'title'],
            },
            {
              association: 'masterProductType',
              attributes: ['name'],
            }
          ]
        },
        {
          association: 'warehouse',
          attributes: ['id', 'name'],
        },
      ],
    });

    // paginate stock entries
    const paginatedStockEntries = CommonHelper.paginate(stockEntries, page, limit);

    // return stock entries with pagination details
    return res.status(200).json({ 
      status: true, 
      message: "Indent required products fetched successfully", 
      data: paginatedStockEntries 
    });
  } catch (error) {
    console.error("Get indent required products error:", error);
    return res.status(500).json({ status: false, message: "Error getting indent required products", error: error.message });
  }
};

/**
 * Update product variants
 * @param {Object} productId - Product ID
 * @param {Object} variant - Variant object
 * @param {Object} user - User object
 * @param {Object} transaction - Transaction object
 * @returns {Promise<boolean>}
 */
const updateProductVariants = async (productId, variant, user, transaction) => {
  try {
    const { uom_id, weight } = variant;
    const companyId = user.company_id;
    const userId = user.id;

    // Check if variant exists for this product and UOM
    const existingVariant = await ProductVariant.findOne({
      attributes: ['id', 'price_per_unit'],
      where: {
        product_id: productId,
        uom_id: uom_id,
        company_id: companyId
      },
      transaction
    });

    if (existingVariant) {
      // Update existing variant
      await ProductVariant.update({
        weight_per_unit: weight,
        price_per_unit: existingVariant.price_per_unit || 0
      }, { where: { id: existingVariant.id }, transaction });
    } else {
      // Create new variant
      await ProductVariant.create({
        product_id: productId,
        uom_id: uom_id,
        company_id: companyId,
        user_id: userId,
        weight_per_unit: weight,
        price_per_unit: 0,
        status: 1
      }, { transaction });
    }
    return true;
  } catch (error) {
    console.error("Update product variants error:", error);
    throw error;
  }
};

/**
 * Get all variants of a product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.GetProductVariants = async (req, res) => {
  try {
    const productId = req.params.id;
    const companyId = req.user.company_id;
    const { uom_id, weight } = req.query;

    // Check if product exists and belongs to the company
    const product = await Product.findOne({
      attributes: ['id', 'product_code', 'product_name'],
      where: {
        id: productId,
        company_id: companyId
      },
      raw: true
    });

    // if product not found, return 404
    if (!product) {
      return res.status(404).json({
        status: false,
        message: "Product not found or does not belong to your company"
      });
    }

    // Build where clause for variants
    const variantWhere = {
      product_id: productId,
      company_id: companyId
    };

    // Filter by UOM if provided
    if (uom_id) {
      variantWhere.uom_id = parseInt(uom_id);
    }

    // Filter by weight if provided
    if (weight !== undefined && weight !== null && weight !== '') {
      variantWhere.weight_per_unit = parseInt(weight);
    }

    // Get all variants for this product
    const variants = await ProductVariant.findAll({
      attributes: [
        'id',
        'uom_id',
        'weight_per_unit',
        'price_per_unit',
        'status',
        'created_at',
        'updated_at'
      ],
      where: variantWhere,
      include: [
        {
          association: 'masterUOM',
          attributes: ['id', 'name', 'label']
        }
      ],
      order: [['id', 'ASC']]
    });

    return res.status(200).json({
      status: true,
      message: "Product variants fetched successfully",
      data: {
        product: {
          id: product.id,
          product_code: product.product_code,
          product_name: product.product_name
        },
        variants: variants
      }
    });
  } catch (error) {
    console.error("Get product variants error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching product variants",
      error: error.message
    });
  }
};

/**
 * Update product variants
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.UpdateProductVariants = async (req, res) => {
  let transaction = null;
  try {
    const productId = req.params.id;
    const { product_variants } = req.body;
    const companyId = req.user.company_id;

    // Validate product_variants array
    if (!Array.isArray(product_variants) || product_variants.length === 0) {
      return res.status(400).json({
        status: false,
        message: "product_variants array is required and must not be empty"
      });
    }

    // Validate each variant has required fields
    for (const variant of product_variants) {
      if (!variant.uom_id || variant.weight === undefined || variant.weight === null) {
        return res.status(400).json({
          status: false,
          message: "Each variant must have uom_id and weight"
        });
      }
    }

    // Check if product exists and belongs to the company
    const product = await Product.findOne({
      attributes: ['id'],
      where: {
        id: productId,
        company_id: companyId
      },
      raw: true
    });

    if (!product) {
      return res.status(404).json({
        status: false,
        message: "Product not found or does not belong to your company"
      });
    }

    // Begin transaction
    transaction = await sequelize.transaction();

    // Update product variants
    const updateVariantPromises = [];
    product_variants.forEach(variant => {
      updateVariantPromises.push(updateProductVariants(productId, variant, req.user, transaction));
    });
    // Execute update variant promises
    await Promise.all(updateVariantPromises);
    // Commit transaction
    await transaction.commit();

    // Return success response
    return res.status(200).json({ 
      status: true, 
      message: "Product variants updated successfully" 
    });
  } catch (error) {
    const errorMessage = error.message ? error.message : "Error updating product variants";
    console.error(errorMessage, error);
    
    // Rollback transaction if it exists
    if (transaction) {
      await transaction.rollback();
    }
    
    return res.status(500).json({
      status: false,
      message: errorMessage
    });
  }
};
