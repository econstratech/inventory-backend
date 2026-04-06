const { Op, fn, col, literal, QueryTypes } = require("sequelize");

const XLSX = require("xlsx");
const csv = require("csv-parser");
const path = require("path");
const axios = require("axios");
const moment = require('moment');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const sequelize = require("../database/db-connection");

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
  MasterBrand,
  SalesProductReceived,
} = require("../model");
// const { CompressImage } = require("../utils/ImageUpload");
const CommonHelper = require('../helpers/commonHelper');


// const { error } = require("console");
const TrackProductStock = require("../model/TrackProductStock");
const generateUniqueReferenceNumber = require("../utils/generateReferenceNumber");
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
  BRAND: 'Brand',
  UOM: 'UOM',
  WEIGHT_PER_UNIT: 'Weight',
  BATCH_APPLICABLE: 'Batch Applicable',
  MARKUP_PERCENT: 'Markup Percent',
};

function getRowValueByHeader(row, headerName) {
  if (!row || typeof row !== 'object') return undefined;

  if (Object.prototype.hasOwnProperty.call(row, headerName)) {
    return row[headerName];
  }

  const normalizedHeader = String(headerName).trim().toLowerCase();
  for (const key of Object.keys(row)) {
    if (String(key).trim().toLowerCase() === normalizedHeader) {
      return row[key];
    }
  }

  return undefined;
}

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

/**
 * Find brand by name
 * @param {*} brandName 
 * @param {*} companyId 
 * @returns 
 */
async function findBrandByName(brandName, companyId) {
  const brand = await MasterBrand.findOne({
    attributes: ['id', 'name', 'description'],
    where: { name: { [Op.like]: `%${brandName}%` }, company_id: companyId },
    raw: true,
  });
  return brand ? brand.id : null;
}

/**
 * Insert brand
 * @param {*} brandName 
 * @param {*} userId 
 * @param {*} companyId 
 * @returns 
 */
async function insertBrand(brandName, userId, companyId) {
  const brand = await MasterBrand.create({ name: brandName, user_id: userId, company_id: companyId });
  return brand.id ? brand.id : null;
}

exports.uploadProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: false, message: 'No file uploaded' });
    }

    const companyId = req.user.company_id;
    const isVariantBased = req.user.is_variant_based;
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
        const itemCodeValue = getRowValueByHeader(row, UPLOAD_FIXED_HEADERS.ITEM_CODE);
        const itemNameValue = getRowValueByHeader(row, UPLOAD_FIXED_HEADERS.ITEM_NAME);
        const itemTypeValue = getRowValueByHeader(row, UPLOAD_FIXED_HEADERS.ITEM_TYPE);
        const categoryNameValue = getRowValueByHeader(row, UPLOAD_FIXED_HEADERS.CATEGORY);
        const brandNameValue = getRowValueByHeader(row, UPLOAD_FIXED_HEADERS.BRAND);
        const uomNameValue = getRowValueByHeader(row, UPLOAD_FIXED_HEADERS.UOM);
        const weightPerUnitValue = getRowValueByHeader(row, UPLOAD_FIXED_HEADERS.WEIGHT_PER_UNIT);
        const batchApplicableValue = getRowValueByHeader(row, UPLOAD_FIXED_HEADERS.BATCH_APPLICABLE);
        const markupPercentValue = getRowValueByHeader(row, UPLOAD_FIXED_HEADERS.MARKUP_PERCENT);

        const itemCode = itemCodeValue != null ? String(itemCodeValue).trim() : '';
        const itemName = itemNameValue != null ? String(itemNameValue).trim() : '';
        const itemType = itemTypeValue != null ? String(itemTypeValue).trim() : '';
        const categoryName = categoryNameValue != null ? String(categoryNameValue).trim() : '';
        const brandName = brandNameValue != null ? String(brandNameValue).trim() : '';
        const uomName = uomNameValue != null ? String(uomNameValue).trim() : '';

        const weightPerUnit = weightPerUnitValue != null ? parseInt(weightPerUnitValue, 10) : 0;
        const batchApplicable = parseBatchApplicable(batchApplicableValue);
        const markupPercent = markupPercentValue != null && markupPercentValue !== ''
          ? parseFloat(markupPercentValue)
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
        });
        if (isProductExist) {
          // If product already exist then add varient
          await productVatientInsert(isProductExist, uomId, weightPerUnit, req.user, transaction);
          continue;
        }

        let productCategoryId = null;
        let brandId = null;
        if (categoryName) {
          productCategoryId = await findCategoryByName(categoryName, companyId);
          if (!productCategoryId) {
            productCategoryId = await insertCategory(categoryName, req.user.id, companyId);
          }
        }
        if (brandName) {
          brandId = await findBrandByName(brandName, companyId);
          if (!brandId) {
            brandId = await insertBrand(brandName, req.user.id, companyId);
          }
        }

        const productTypeId = await findProductTypeByName(itemType);

        const productSKU = await generateUniqueProductSKU(companyId);

        // Create product
        const productData = await Product.create({
          company_id: companyId,
          user_id: req.user.id,
          product_code: itemCode,
          product_name: itemName,
          product_type_id: productTypeId,
          product_category_id: productCategoryId,
          brand_id: brandId,
          ...(!isVariantBased ? { uom_id: uomId } : {}),
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
        // Add product attribute values
        if (productAttributeValues.length > 0) {
          await ProductAttributeValue.bulkCreate(productAttributeValues, { transaction });
        }
        // If company is set to variant based then add product variants
        if (isVariantBased) {
          await productVatientInsert(productData, uomId, weightPerUnit, req.user, transaction);
        }

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
      uom_id,
      is_batch_applicable,
      product_category_id,
      markup_percentage
    } = req.body;

    // Set company ID
    const companyId = req.user.company_id;
    // Check if company is set to variant based
    const isVariantBased = req.user.is_variant_based;
    // Generate product SKU
    const productSKU = await generateUniqueProductSKU(companyId);

    // Check if product with same code exist, if exist then return error
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

    // Check if all required fields of dynamic attributes are filled
    if (dynamic_attributes.length > 0) {
      dynamic_attributes.forEach((eachAttributerow) => {
        if (eachAttributerow.is_required === 1 && eachAttributerow.value.trim() === '') {
          throw Error("Please fill all required fields");
        }
      });
    }

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
      uom_id: isVariantBased ? null : uom_id,
      brand_id,
      sku_product: productSKU,
      is_batch_applicable,
      markup_percentage,
    }, { transaction });

    // Set product attribute values before saving product attribute values
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

    // Save product variants if company is set to variant based
    const productVariants = [];
    if (isVariantBased) {
      product_variants.forEach((eachVariant) => {
        productVariants.push({
          company_id: companyId,
          user_id: req.user.id,
          product_id: productData.id,
          uom_id: eachVariant.uom_id,
          weight_per_unit: eachVariant.weight
        });
      });
      await ProductVariant.bulkCreate(productVariants, { transaction });
    }

    await transaction.commit();

    // Return product data with success message
    return res.status(200).json({
      status: true,
      message: "Product has been added successfully",
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

    productData.is_batch_applicable = parseInt(productData.is_batch_applicable);
    productData.markup_percentage = parseFloat(productData.markup_percentage);

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
    const isVariantBased = req.user.is_variant_based;

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
        ...(!isVariantBased ? [{
          association: "masterUOM",
          attributes: ["name", "label"],
        }] : []),
      ];
    }

    // Full product listing
    else {
      include = [
        ...(!isVariantBased ? [{
          association: "masterUOM",
          attributes: ["name", "label"],
        }] : []),
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
      ...(searchkey && { subQuery: false }),
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
          association: "masterUOM",
          attributes: ["name", "label"],
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

exports.DeleteProduct = async (req, res) => {
  // Start a transaction
  const transaction = await sequelize.transaction();
  try {
    const productId = req.params.id;
    if (!productId || isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    // Check if the product exists, if not return 404
    const product = await Product.findOne({ 
      attributes: ['id'],
      where: { id: productId },
      raw: true,
    });
    if (!product) {
      return res.status(404).json({ 
        status: false,
        message: "Product not found" 
      });
    }

    await Promise.all([
      // Soft delete the product variants
      ProductVariant.update(
        { status: "0" },
        { where: { product_id: productId }, transaction }
      ),

      ProductStockEntry.destroy(
        { where: { product_id: productId }, transaction }
      ),
    ]);

    // Soft delete the product
    await Product.update(
      { status: "0" },
      { where: { id: productId }, transaction }
    );

    // Commit the transaction
    await transaction.commit();

    // Return success response
    return res.status(200).json({ 
      status: true,
      message: "Product has benn been removed successfully" 
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    // Rollback the transaction
    await transaction.rollback();
    return res.status(500).json({ 
      status: false,
      message: "Error deleting product",
      error: error.message
    });
  }
};

/**
 * Restore a product
 * @param {number} productId - The ID of the product to restore
 * @returns {Promise<object>} - The restored product
 */
exports.RestoreProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    if (!productId || isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Restore the product variants, product stock entries and product
    await Promise.all([
      ProductVariant.update(
        { status: "1" },
        { where: { product_id: productId } }
      ),
      ProductStockEntry.update(
        { deleted_at: null },
        { where: { product_id: productId }, paranoid: false }
      ),
      Product.update(
        { status: "1" },
        { where: { id: productId } }
      ),
    ]);

    // Return success response
    return res.status(200).json({ 
      status: true,
      message: "Product has been restored successfully" 
    });
  } catch (error) {
    console.error("Error restoring product:", error);
    return res.status(500).json({ 
      status: false,
      message: "Error restoring product",
      error: error.message
    });
  }
};

/**
 * Delete multiple products
 * @param {number} productIds - The IDs of the products to delete
 * @param {Object} res - Express response object
 * @returns {Promise<object>} - The deleted products
 */
exports.DeleteMultipleProducts = async (req, res) => {
  // Start a transaction
  const transaction = await sequelize.transaction();
  try {
    const { ids } = req.body || {};

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid or missing product IDs" });
    }

    await Promise.all([
      Product.update(
        { status: "0" },
        { where: { id: ids }, transaction }
      ),
      ProductVariant.update(
        { status: "0" },
        { where: { product_id: ids }, transaction }
      ),
      ProductStockEntry.destroy(
        { where: { product_id: ids }, paranoid: false, transaction }
      ),
    ]);

    // Commit the transaction
    await transaction.commit();

    // Return success response
    return res.status(200).json({ 
      status: true,
      message: "Products deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting multiple products:", error);
    // Rollback the transaction
    await transaction.rollback();
    return res.status(500).json({ 
      status: false,
      message: "Error deleting multiple products",
      error: error.message
    });
  }
};

const mapExportDatafields = {
  product_name: 'Product Name',
  product_code: 'Product Code',
  is_batch_applicable: 'Batch Applicable',
  product_variants: 'Product Variants',
  product_attribute_values: 'Product Attribute Values',
  product_category: 'Product Category',
  product_brand: 'Product Brand',
  product_uom: 'Product UOM',
  product_weight_per_unit: 'Product Weight Per Unit',
}

/**
 * Export multiple products
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<object>} - The exported products
 */
exports.BulkExportProducts = async (req, res) => {
  try {
    const { ids, searchkey = null } = req.body || {};
    const companyId = req.user.company_id;
    const isVariantBased = req.user.is_variant_based;
    const batchSize = 50;

    const hasIdsFilter = Array.isArray(ids) && ids.length > 0;
    const validIds = hasIdsFilter
      ? [...new Set(
          ids
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0)
        )]
      : [];

    if (hasIdsFilter && validIds.length === 0) {
      return res.status(400).json({ message: "Invalid product IDs" });
    }

    const mapExportDatafields = [
      { key: "product_code", label: "Product Code" },
      { key: "product_name", label: "Product Name" },
      { key: "category_name", label: "Category" },
      { key: "product_type_name", label: "Product Type" },
      { key: "brand_name", label: "Brand" },
      { key: "is_batch_applicable", label: "Batch Product" },
      { key: "markup_percentage", label: "Markup Percentage" },
      { key: "uom", label: "UOM" },
      { key: "weight_per_unit", label: "Weight Per Unit" },
    ];

    const csvEscape = (value) => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      if (stringValue.includes('"') || stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes("\r")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const writeLine = async (line) => {
      const canContinue = res.write(line);
      if (!canContinue) {
        await new Promise((resolve) => res.once("drain", resolve));
      }
    };

    const timestamp = moment().format("YYYYMMDDHHmmss");
    const filename = `product_master_${timestamp}.csv`;

    const exportModelAttributes = mapExportDatafields.map((field) => field.key);

    const attributeHeaderQuery = `
      SELECT DISTINCT pa.name AS attribute_name
      FROM product p
      INNER JOIN product_attribute_values pav ON p.id = pav.product_id
      INNER JOIN product_attributes pa ON pa.id = pav.product_attribute_id
      WHERE p.company_id = :companyId
        ${hasIdsFilter ? "AND p.id IN (:ids)" : ""}
        AND pa.name IS NOT NULL
        AND pa.name <> ''
      ORDER BY pa.name ASC
    `;

    const dynamicAttributeHeaders = (await sequelize.query(attributeHeaderQuery, {
      replacements: hasIdsFilter ? { companyId, ids: validIds } : { companyId },
      type: QueryTypes.SELECT,
    })).map((row) => row.attribute_name);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const exportHeaderFields = [
      ...mapExportDatafields.map((field) => field.label),
      ...dynamicAttributeHeaders,
    ].map(csvEscape).join(",") + "\n";
    await writeLine(exportHeaderFields);

    const selectFieldsForVariants = isVariantBased
      ? ", pv.id AS variant_id, pv.uom_id, vuom.label AS variant_uom_label, pv.weight_per_unit AS variant_weight_per_unit"
      : "";
    const joinFieldsForVariants = isVariantBased
      ? "LEFT JOIN product_variants pv ON p.id = pv.product_id LEFT JOIN master_uom vuom ON pv.uom_id = vuom.id"
      : "";

    let whereClause = "";
    if (searchkey) {
      whereClause = "AND (p.product_name LIKE :searchkey OR p.product_code LIKE :searchkey)";
    }


    const productExportQuery = `
      SELECT
        p.id,
        p.product_code,
        p.product_name,
        p.is_batch_applicable,
        c.title AS category_name,
        pt.name AS product_type_name,
        b.name AS brand_name,
        p.markup_percentage
        ${!isVariantBased ? ",base_uom.label AS uom_label" : ""}
        ${selectFieldsForVariants}
      FROM product p
      LEFT JOIN product_categories c ON p.product_category_id = c.id
      LEFT JOIN master_product_types pt ON p.product_type_id = pt.id
      LEFT JOIN master_brands b ON p.brand_id = b.id
      LEFT JOIN master_uom base_uom ON p.uom_id = base_uom.id
      ${joinFieldsForVariants}
      WHERE p.company_id = :companyId AND p.id IN (:batchIds) ${whereClause}
      ORDER BY p.id ASC ${isVariantBased ? ", pv.id ASC" : ""}
    `;

    const productAttributeQuery = `
      SELECT
        pav.product_id,
        pa.name AS attribute_name,
        pav.value AS attribute_value
      FROM product_attribute_values pav
      INNER JOIN product_attributes pa ON pa.id = pav.product_attribute_id
      WHERE pav.product_id IN (:batchIds)
      ORDER BY pav.product_id ASC, pa.name ASC
    `;

    const mapQueryResultToExportFields = (queryRow) =>
      exportModelAttributes.reduce((acc, exportFieldKey) => {
        if (exportFieldKey === "uom") {
          acc[exportFieldKey] = queryRow?.variant_uom_label ?? queryRow?.uom_label ?? "";
          return acc;
        }
        if (exportFieldKey === "weight_per_unit") {
          acc[exportFieldKey] = queryRow?.variant_weight_per_unit ?? queryRow?.weight_per_unit ?? "";
          return acc;
        }
        acc[exportFieldKey] = queryRow?.[exportFieldKey] ?? "";
        return acc;
      }, {});

    const writeExportRows = async (batchIds) => {
      if (!batchIds.length) return;

      const queryRows = await sequelize.query(productExportQuery, {
        replacements: {
          companyId,
          batchIds,
          ...(searchkey ? { searchkey: `%${searchkey}%` } : {})
        },
        type: QueryTypes.SELECT,
      });

      if (!queryRows.length) return;

      const attributeRows = await sequelize.query(productAttributeQuery, {
        replacements: { batchIds },
        type: QueryTypes.SELECT,
      });

      const productAttributesMap = {};
      for (const attrRow of attributeRows) {
        const productId = attrRow.product_id;
        const attributeName = attrRow.attribute_name;
        const attributeValue = attrRow.attribute_value ?? "";
        if (!attributeName) continue;

        if (!productAttributesMap[productId]) {
          productAttributesMap[productId] = {};
        }
        if (!productAttributesMap[productId][attributeName]) {
          productAttributesMap[productId][attributeName] = new Set();
        }
        productAttributesMap[productId][attributeName].add(String(attributeValue));
      }

      for (const queryRow of queryRows) {
        const mappedProduct = mapQueryResultToExportFields(queryRow);
        const fixedValues = exportModelAttributes.map((field) => csvEscape(mappedProduct[field]));
        const dynamicValues = dynamicAttributeHeaders.map((attributeName) => {
          const attrSet = productAttributesMap?.[queryRow.id]?.[attributeName];
          if (!attrSet || !attrSet.size) return "";
          return csvEscape(Array.from(attrSet).join(" | "));
        });

        await writeLine([...fixedValues, ...dynamicValues].join(",") + "\n");
      }
    };

    if (hasIdsFilter) {
      for (let i = 0; i < validIds.length; i += batchSize) {
        const batchIds = validIds.slice(i, i + batchSize);
        await writeExportRows(batchIds);
      }
    } else {
      let offset = 0;
      while (true) {
        const batchProducts = await Product.findAll({
          attributes: ["id"],
          where: { company_id: companyId, status: 1 },
          order: [["id", "ASC"]],
          limit: batchSize,
          offset,
          raw: true,
        });

        if (!batchProducts.length) break;
        const batchIds = batchProducts.map((row) => row.id);

        await writeExportRows(batchIds);
        offset += batchSize;
      }
    }

    return res.end();
  } catch (error) {
    console.error("Error exporting multiple products:", error);
    if (res.headersSent) {
      return res.end();
    }
    return res.status(500).json({ 
      status: false,
      message: "Error exporting multiple products",
      error: error.message
    });
  }
};


exports.GetProductsActivity = async (req, res) => {
  try {
    const getAllProduct = await Product.findAll({
      where: {
        company_id: req.user.company_id,
      },
      order: [["id", "DESC"]],
      include: [
        { model: ProductCategory, as: "Categories", attributes: ["title"] },
        { association: "masterUOM", attributes: ["name", "label"] },
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

      // Get the previous stock entry from the to store
      const previousStockToStore = await ProductStockEntry.findOne({
        attributes: ['id', 'quantity'],
        where: {
          product_id: product.id,
          ...(product.product_variant_id ? { product_variant_id: product.product_variant_id } : {}),
          warehouse_id: 
            transfer_type === 'sales_order_return' || transfer_type === 'purchase_order_return' ? product.warehouse_id 
            : transfer_type === 'scrap_items' ? from_store : to_store,
        },
        raw: true,
      });

      // If the previous stock entry is not found, then return null
      if (!previousStockToStore) {
        return resolve(null);
      }

      // Create the stock transfer product
      const stockTransferProduct = await StockTransferProducts.create({
        stock_transfer_log_id: stockTransferLogId,
        product_id: product.id,
        product_variant_id: product.product_variant_id ? product.product_variant_id : null,
        transferred_quantity: product.transferred_quantity,
      }, { transaction });

      let previousStockFromStore = null;

      if (transfer_type === 'stock_transfer' || transfer_type === 'scrap_items') {
        previousStockFromStore = await ProductStockEntry.findOne({
          attributes: ['id', 'quantity'],
          raw: true,
          where: {
            product_id: product.id,
            warehouse_id: from_store,
            ...(product.product_variant_id ? { product_variant_id: product.product_variant_id } : {}),
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
      if (['scrap_items', 'sales_order_return','purchase_order_return'].includes(transfer_type) && product.is_batch_applicable) {
        const processBatchOperations = [];
        product.batches.forEach(batch => {
            processBatchOperations.push(
              new Promise(async (resolve, reject) => {
                try {
                  const receiveProductBatch = await ReceiveProductBatch.findOne({
                    attributes: ['id', 'available_quantity', 'returned_quantity'],
                    where: { id: batch.id },
                    transaction,
                    include: [
                      {
                        association: 'receiveProduct',
                        attributes: ['id', 'available_quantity'],
                      }
                    ]
                  });
                  // If the receive product batch is not found, then return null
                  if (!receiveProductBatch) {
                    return resolve(null);
                  }

                  const previouslyReturnedQuantity = receiveProductBatch.returned_quantity || 0;

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
                  } else if (transfer_type === 'purchase_order_return') {
                    // Increase the quantity of the batch from the receive product batch
                    await ReceiveProductBatch.update({
                      returned_quantity: previouslyReturnedQuantity + batch.quantity,
                    }, {
                      where: { id: batch.id }, transaction 
                    });
                  } else if (transfer_type === 'sales_order_return') {
                    // Increase the quantity of the batch from the receive product batch
                    await ReceiveProductBatch.update({
                      returned_quantity: previouslyReturnedQuantity + batch.quantity,
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

      if (transfer_type === 'purchase_order_return') {
        // Reduce the quantity of the receive product from the receive product
        await RecvProduct.update({
          returned_quantity: product.returned_quantity + product.transferred_quantity,
        }, {
          where: {
            id: product.id
          }, transaction 
        });
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

    // Check if the total quantity is greater than 0 to proceed with the stock transfer
    const totalQuantity = products.reduce((acc, product) => acc + product.transferred_quantity, 0);
    if (totalQuantity <= 0) {
      return res
        .status(400)
        .json({ 
          status: false, 
          message: "Total quantity must be greater than 0"
        });
    }

    // Begin transaction
    transaction = await sequelize.transaction();

    let salesOrder = null;
    let purchaseOrder = null;

    if (sales_order_reference_number) {
      // Check if the sales order reference number is already used
      salesOrder = await Sale.findOne({
        attributes: ['id'],
        where: { reference_number: sales_order_reference_number.replace(/\s+/g, '').trim() },
        raw: true,
        transaction,
      });
    }

    if (purchase_order_reference_number) {
      // Check if the purchase order reference number is already used
      purchaseOrder = await Purchase.findOne({
        attributes: ['id'],
        raw: true,
        where: { reference_number: purchase_order_reference_number.replace(/\s+/g, '').trim() },
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

    console.log("bbb", transaction.finished);
    // Prepare the stock transfer products promises
    const stockTransferProductsPromises = products.map(product => {
      // If the transferred quantity is less than or equal to 0, then return null
      if (product.transferred_quantity <= 0) {
        return null;
      }

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
    if (transaction) {
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


// api for low qty alert -------------------------------------------------------------------

// exports.GetLowQtyProducts = async (req, res) => {
//   try {
//     const getAllProduct = await Product.findAll({
//       where: { status: 1 },
//       order: [["id", "DESC"]],
//       include: [
//         { model: MasteruomModel, as: "Masteruom", attributes: ["unit_name"] },
//         {
//           model: TrackProductStock,
//           as: "TrackProductStock",
//           attributes: ["store_id", "quantity_changed", "status_in_out"],
//         },
//       ],
//     });

//     // Group low stock products by company_id
//     const companyLowStockMap = {};

//     for (const product of getAllProduct) {
//       const productData = product.toJSON();

//       let stockIn = 0, stockOut = 0;

//       productData.TrackProductStock.forEach((entry) => {
//         const qty = parseFloat(entry.quantity_changed || 0);
//         if (entry.status_in_out === 1) stockIn += qty;
//         else stockOut += qty;
//       });

//       const currentStock = stockIn - stockOut;
//       const minStock = parseFloat(productData.minimum_stock_level || 0);

//       if (currentStock < minStock) {
//         if (!companyLowStockMap[productData.company_id]) {
//           companyLowStockMap[productData.company_id] = {
//             products: [],
//           };
//         }

//         companyLowStockMap[productData.company_id].products.push({
//           product_name: productData.product_name,
//           current_stock: currentStock,
//           minimum_stock_level: minStock,
//         });
//       }
//     }

//     const sentMessages = [];

//     // Loop through companies that have low stock products
//     for (const companyId in companyLowStockMap) {
//       const companyDetails = await Company.findOne({
//         where: { id: companyId },
//         attributes: ["company_name", "whatsapp_number", "p_isd"]
//       });

//       const whatsappConfig = await GeneralSettings.findOne({
//         where: { company_id: companyId, is_active: 1 },
//         attributes: ["gupshup_token", "gupshup_phone"]
//       });

//       if (!companyDetails?.whatsapp_number || !whatsappConfig?.gupshup_token || !whatsappConfig?.gupshup_phone) {
//         // console.log(`⚠️ Skipping company ${companyId} due to missing WhatsApp config.`);
//         continue;
//       }

//       const lowStockList = companyLowStockMap[companyId].products;
//       const totalLowStock = lowStockList.length;

//       const productSummary = lowStockList.map((p, idx) =>
//         `${idx + 1}) ${p.product_name} [C:${p.current_stock}, M:${p.minimum_stock_level}]`
//       ).join(' | '); // Avoid line breaks for WhatsApp template compatibility

//       const templateParams = [
//         companyDetails.company_name,                                   // {{1}} Company Name
//         `${totalLowStock} product${totalLowStock > 1 ? 's' : ''}`,     // {{2}} Count
//         productSummary,                                                 // {{3}} Product list
//       ];

//       // Send WhatsApp via GupShup
//       await GupShupMessage(
//         companyDetails.p_isd || "91",                                  // ISD
//         companyDetails.whatsapp_number,
//         whatsappConfig.gupshup_token,
//         whatsappConfig.gupshup_phone,
//         "ad66535c-ded4-484b-b1b7-372c576deba6",                         // Your approved 5-var template ID
//         templateParams
//       );

//       sentMessages.push({
//         company_name: companyDetails.company_name,
//         whatsapp_number: companyDetails.whatsapp_number,
//         total_low_stock: totalLowStock,
//         products: lowStockList,
//       });
//     }

//     return res.status(200).json({
//       message: true,
//       companies_notified: sentMessages.length,
//       details: sentMessages
//     });

//   } catch (err) {
//     console.error("Low stock error:", err);
//     return res.status(400).json({ error: err.message });
//   }
// };


// exports.GetOverStockProducts = async (req, res) => {
//   try {
//     const getAllProduct = await Product.findAll({
//       where: { status: 1 },
//       order: [["id", "DESC"]],
//       include: [
//         { 
//           association: "masterUOM", 
//           attributes: ["name"]
//         },
//         {
//           model: TrackProductStock,
//           as: "TrackProductStock",
//           attributes: ["store_id", "quantity_changed", "status_in_out"],
//         },
//       ],
//     });

//     const companyOverStockMap = {};

//     for (const product of getAllProduct) {
//       const productData = product.toJSON();

//       let stockIn = 0, stockOut = 0;

//       productData.TrackProductStock.forEach((entry) => {
//         const qty = parseFloat(entry.quantity_changed || 0);
//         if (entry.status_in_out === 1) stockIn += qty;
//         else stockOut += qty;
//       });

//       const currentStock = stockIn - stockOut;
//       const maxStock = parseFloat(productData.maximum_stock_level || 0);

//       if (maxStock && currentStock > maxStock) {
//         if (!companyOverStockMap[productData.company_id]) {
//           companyOverStockMap[productData.company_id] = {
//             products: [],
//           };
//         }

//         companyOverStockMap[productData.company_id].products.push({
//           product_name: productData.product_name,
//           current_stock: currentStock,
//           maximum_stock_level: maxStock,
//         });
//       }
//     }

//     const sentMessages = [];

//     for (const companyId in companyOverStockMap) {
//       const companyDetails = await Company.findOne({
//         where: { id: companyId },
//         attributes: ["company_name", "whatsapp_number", "p_isd"]
//       });

//       const whatsappConfig = await GeneralSettings.findOne({
//         where: { company_id: companyId, is_active: 1 },
//         attributes: ["gupshup_token", "gupshup_phone"]
//       });

//       if (!companyDetails?.whatsapp_number || !whatsappConfig?.gupshup_token || !whatsappConfig?.gupshup_phone) {
//         // console.log(`⚠️ Skipping company ${companyId} due to missing or inactive WhatsApp config.`);
//         continue;
//       }

//       const overStockList = companyOverStockMap[companyId].products;
//       const totalOverStock = overStockList.length;

//       const productSummary = overStockList.map((p, idx) =>
//         `${idx + 1}) ${p.product_name} [C:${p.current_stock}, M:${p.maximum_stock_level}]`
//       ).join(' | ');

//       const templateParams = [
//         companyDetails.company_name,                                      // {{1}}
//         `${totalOverStock} product${totalOverStock > 1 ? 's' : ''}`,      // {{2}}
//         productSummary,                                                   // {{3}}                           
//       ];

//       await GupShupMessage(
//         companyDetails.p_isd || "91",
//         companyDetails.whatsapp_number,
//         whatsappConfig.gupshup_token,
//         whatsappConfig.gupshup_phone,
//         "c626d7aa-f02a-457c-920d-1e3af84cc463",                           // Template ID
//         templateParams
//       );

//       sentMessages.push({
//         company_name: companyDetails.company_name,
//         whatsapp_number: companyDetails.whatsapp_number,
//         total_over_stock: totalOverStock,
//         products: overStockList,
//       });
//     }

//     return res.status(200).json({
//       message: true,
//       companies_notified: sentMessages.length,
//       details: sentMessages
//     });

//   } catch (err) {
//     console.error("Overstock error:", err);
//     return res.status(400).json({ error: err.message });
//   }
// };







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
          model: ProductCategory,
          as: 'Categories',
          attributes: ['title']
        },
        {
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
    const uniqueStockEntries = [];
    const isVariantBased = req.user.is_variant_based;


    for (let i = 0; i < stockEntries.length; i++) {
      const entry = stockEntries[i];
      const index = i + 1;

      // Required fields validation
      if (!entry.product_id) {
        validationErrors.push(`Entry ${index}: product_id is required`);
      }
      if (!entry.product_variant_id && isVariantBased) {
        validationErrors.push(`Entry ${index}: product_variant_id is required`);
      }
      if (!entry.warehouse_id) {
        validationErrors.push(`Entry ${index}: warehouse_id is required`);
      }
      if (entry.quantity === undefined || entry.quantity === null) {
        validationErrors.push(`Entry ${index}: quantity is required`);
      }

      // Check for duplicate combination in payload
      if (entry.product_id && entry.warehouse_id) {
        const key = isVariantBased
          ? `${entry.product_id}_${entry.product_variant_id}_${entry.warehouse_id}`
          : `${entry.product_id}_${entry.warehouse_id}`;

        if (seen.has(key)) {
          duplicates.push({
            product_id: entry.product_id,
            ...(isVariantBased ? { product_variant_id: entry.product_variant_id } : {}),
            warehouse_id: entry.warehouse_id,
            entry_index: index
          });
          continue;
        } else {
          seen.add(key);
        }
      }

      uniqueStockEntries.push(entry);
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: false,
        message: "Validation errors found",
        errors: validationErrors
      });
    }

    // If all payload rows are duplicates, nothing to process
    if (uniqueStockEntries.length === 0) {
      return res.status(200).json({
        status: true,
        message: "No unique stock entries to process",
        data: [],
        ignored_duplicates_count: duplicates.length,
        ignored_duplicates: duplicates
      });
    }

    // Validate that no duplicate product_id & warehouse_id combinations exist in the payload
    const productWarehousePairs = uniqueStockEntries.map(e => ({
      product_id: e.product_id,
      warehouse_id: e.warehouse_id,
      ...(isVariantBased ? { product_variant_id: e.product_variant_id } : {}),
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
    const entriesToCreate = [];
    const trackProductstockEntries = [];

    uniqueStockEntries.forEach(entry => {
      const entryToCreate = {
        company_id: req.user.company_id,
        product_id: entry.product_id,
        ...(isVariantBased ? { product_variant_id: entry.product_variant_id } : {}),
        warehouse_id: entry.warehouse_id,
        buffer_size: entry.buffer_size,
        user_id: req.user.id,
        quantity: entry.quantity
      };
      const trackProductstockEntry = {
        product_id: entry.product_id,
        ...(isVariantBased ? { product_variant_id: entry.product_variant_id } : {}),
        store_id: entry.warehouse_id,
        user_id: req.user.id,
        company_id: req.user.company_id,
        quantity_changed: entry.quantity,
        final_quantity: entry.quantity,
        status_in_out: 1,
        reference_number: "INV" + Math.floor(1000000 + Math.random() * 9000000),
        barcode_number: Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString(),
        item_name: entry.product_name || null,
        default_price: entry.default_price,
        item_unit: entry.uom,
        final_quantity: entry.quantity,
        comment: "Stock added from bulk add to stock from web app",
        adjustmentType: "Stock added from bulk add to stock from web app",
        is_dispatched: 0,
      }
      entriesToCreate.push(entryToCreate);
      trackProductstockEntries.push(trackProductstockEntry);
    });

    // Bulk create stock entries and track product stock entries
    const [createdEntries, createdTrackProductstockEntries] = await Promise.all([
      ProductStockEntry.bulkCreate(entriesToCreate, {
        transaction,
        returning: true
      }),
      TrackProductStock.bulkCreate(trackProductstockEntries, {
        transaction,
        returning: true
      })
    ]);

    // Commit transaction
    await transaction.commit();

    // Return success message and created entries
    return res.status(200).json({
      status: true,
      message: `${createdEntries.length} stock entries added successfully`,
      data: createdEntries,
      ignored_duplicates_count: duplicates.length,
      ...(duplicates.length > 0 ? { ignored_duplicates: duplicates } : {})
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

/** Get value from row */
const getValue = (row, key) => {
  const foundKey = Object.keys(row).find(
    k => k.trim().toLowerCase() === key.toLowerCase()
  );
  return foundKey ? row[foundKey] : undefined;
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

    const isVariantBased = req.user.is_variant_based;
    const aggregated = new Map();

    for (const row of rows) {
      const product_code = String(getValue(row, BULK_STOCK_HEADERS.PRODUCT_CODE) || '').trim();
      const store_name = String(getValue(row, BULK_STOCK_HEADERS.STORE_NAME) || '').trim();
      const quantityRaw = getValue(row, BULK_STOCK_HEADERS.QUANTITY);
      const quantity = Number(String(quantityRaw || '').replace(/,/g, '').trim());

      const uom = String(row[BULK_STOCK_HEADERS.UOM] || '').trim();
      const weight_per_unit = Number(row[BULK_STOCK_HEADERS.WEIGHT_PER_UNIT] || 0);
      const buffer_size = Number(row[BULK_STOCK_HEADERS.BUFFER_SIZE] || 0);

      if (
        !product_code ||
        !store_name ||
        (!uom && isVariantBased) ||
        (isVariantBased && !weight_per_unit) ||
        isNaN(quantity) ||
        quantity < 0
      ) continue;

      const key = isVariantBased
      ? `${product_code}__${store_name}__${uom}__${weight_per_unit}`
      : `${product_code}__${store_name}`;

      if (!aggregated.has(key)) {
        aggregated.set(key, { quantity: 0, buffer_size });
      }

      const entry = aggregated.get(key);
      entry.quantity += quantity;
      entry.buffer_size = buffer_size; // last value wins
      entry.uom = isVariantBased ? uom : null;
      entry.weight_per_unit = isVariantBased ? weight_per_unit : null;
    }

    if (!aggregated.size) {
      return res.status(400).json({
        status: false,
        message:
          'No valid rows. Each row must have Product Code, Store Name, UOM, Weight Per Unit, and non-negative Quantity.',
      });
    }

    const rowsToProcess = [...aggregated.entries()].map(([key, val]) => {
      const parts = key.split('__');

      return {
        product_code: parts[0],
        store_name: parts[1],
        uom: isVariantBased ? parts[2] : null,
        weight_per_unit: isVariantBased ? Number(parts[3]) : null,
        ...val,
      };
    });

    /* -----------------------------------------------------
       STEP 2: Fetch Products & Warehouses
       ----------------------------------------------------- */

    const productCodes = [...new Set(rowsToProcess.map(r => r.product_code))];
    const storeNames = [...new Set(rowsToProcess.map(r => r.store_name))];
    const uoms = isVariantBased
      ? [...new Set(rowsToProcess.map(r => r.uom))]
      : [];
  
    const weight_per_units = isVariantBased
      ? [...new Set(rowsToProcess.map(r => r.weight_per_unit))]
      : [];

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
      !isVariantBased ? [] : MasterUOM.findAll({
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
    if (isVariantBased) {
      for (const u of masterUoms) {
        if (u.label) uomMap.set(String(u.label).trim().toLowerCase(), u.id);
        if (u.name) uomMap.set(String(u.name).trim().toLowerCase(), u.id);
      }
    }

    const productIds = [...new Set(products.map(p => p.id))];
    const uomIds = isVariantBased ? [...new Set(masterUoms.map(u => u.id))] : [];
    const variants =
      isVariantBased && productIds.length && uomIds.length
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

    const variantMap = isVariantBased ? new Map(
      variants.map(v => [
        `${v.product_id}_${v.uom_id}_${Number(v.weight_per_unit)}`,
        v.id,
      ])
    ) : new Map();

    /* -----------------------------------------------------
       STEP 3: Resolve IDs
       ----------------------------------------------------- */

    const resolved = [];
    const errors = [];

    for (const r of rowsToProcess) {
      const product_id = productMap.get(r.product_code);
      const warehouse_id = warehouseMap.get(r.store_name);
    
      const uom_id = isVariantBased
        ? uomMap.get(String(r.uom).trim().toLowerCase())
        : null;
    
      if (!product_id) {
        errors.push({ ...r, reason: 'Product not found' });
        continue;
      }
    
      if (!warehouse_id) {
        errors.push({ ...r, reason: 'Store not found' });
        continue;
      }
    
      // ✅ Only validate UOM if variant-based
      if (isVariantBased && !uom_id) {
        errors.push({ ...r, reason: 'UOM not found' });
        continue;
      }
    
      let product_variant_id = null;
    
      if (isVariantBased) {
        const variantKey = `${product_id}_${uom_id}_${Number(r.weight_per_unit)}`;
        product_variant_id = variantMap.get(variantKey);
    
        if (!product_variant_id) {
          errors.push({
            ...r,
            reason: 'Product variant not found for UOM and Weight Per Unit',
          });
          continue;
        }
      }
    
      resolved.push({
        product_id,
        warehouse_id,
        product_variant_id, // will be null if not variant-based
        ...r,
      });
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
          product_variant_id: r.product_variant_id || null,
        })),
      },
      attributes: ['id', 'product_id', 'warehouse_id', 'product_variant_id', 'quantity'],
      raw: true,
      transaction,
    });

    const existingMap = new Map(
      existing.map(e => [
        isVariantBased
          ? `${e.product_id}_${e.warehouse_id}_${e.product_variant_id}`
          : `${e.product_id}_${e.warehouse_id}`,
        e,
      ])
    );

    const toCreate = [];
    const toUpdate = [];
    const trackProductstockEntries = [];

    for (const r of resolved) {
      const key = isVariantBased
        ? `${r.product_id}_${r.warehouse_id}_${r.product_variant_id}`
        : `${r.product_id}_${r.warehouse_id}`;
      const found = existingMap.get(key);

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
          product_variant_id: r.product_variant_id || null,
          warehouse_id: r.warehouse_id,
          quantity: r.quantity,
          buffer_size: r.buffer_size,
          user_id: userId,
        });
      }

      const trackProductstockEntry = {
        product_id: r.product_id,
        product_variant_id: r.product_variant_id || null,
        store_id: r.warehouse_id,
        user_id: userId,
        company_id: companyId,
        quantity_changed: r.quantity,
        final_quantity: r.quantity,
        status_in_out: 1,
        reference_number: "INV" + Math.floor(1000000 + Math.random() * 9000000),
        barcode_number: Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString(),
        item_name: r.product_name || null,
        default_price: r.default_price || 0,
        item_unit: r.uom,
        final_quantity: r.quantity,
        comment: "Stock added from bulk add to stock by CSV file",
        adjustmentType: "Stock added from bulk add to stock by CSV file",
        is_dispatched: 0,
      }
      trackProductstockEntries.push(trackProductstockEntry);
    }

    /* -----------------------------------------------------
       STEP 5: DB Operations
       ----------------------------------------------------- */

    // Bulk create stock entries
    if (toCreate.length > 0) {
      await ProductStockEntry.bulkCreate(toCreate, { transaction });
    }

    // Bulk update stock entries
    for (const row of toUpdate) {
      await ProductStockEntry.update(
        {
          quantity: row.quantity,
          buffer_size: row.buffer_size,
        },
        { where: { id: row.id }, transaction }
      );
    }

    // Bulk create track product stock entries
    if (trackProductstockEntries.length > 0) {
      await TrackProductStock.bulkCreate(trackProductstockEntries, { transaction });
    }

    // Commit transaction
    await transaction.commit();

    // Return success message and created entries
    return res.status(200).json({
      status: true,
      message: `${toCreate.length} stock entries added and ${toUpdate.length} stock entries updated successfully`,
      data: {
        created_stock_entries: toCreate.length,
        updated_stock_entries: toUpdate.length,
        track_product_stock_entries: trackProductstockEntries.length,
      }
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
 * @param {number} req.query.product_variant_id - Product variant ID
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */
exports.GetStoreWiseStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_variant_id, sales_id } = req.query;
    let receivedProductVariantsCount = 0;

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
    // if product variant id and sales id are provided, get the received product variant count
    if (product_variant_id && sales_id) {
      receivedProductVariantsCount = await SalesProductReceived.count({
        where: {
          product_id: id,
          company_id: req.user.company_id,
          sales_id: sales_id,
          product_variant_id: product_variant_id,
        },
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
        company_id: req.user.company_id,
        ...(product_variant_id ? { product_variant_id: product_variant_id } : {}),
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
      },
      available_stock: entry.quantity || 0,
      inventory_at_transit: entry.inventory_at_transit || 0,
      inventory_at_production: entry.inventory_at_production || 0,
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
        total_stock_across_all_stores: totalStock,
        received_product_variants_count: parseInt(receivedProductVariantsCount)
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
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { product_id, warehouse_id, quantity, product_variant_id } = req.body;

    // check if the stock entry exists
    const wherecondition = {
      company_id: req.user.company_id,
      id: id,
    };
    // get the stock entry
    const [productStockEntry, trackProductStock] = await Promise.all([
      ProductStockEntry.findOne({
        attributes: ['id', 'quantity'],
        where: wherecondition,
        raw: true,
        nest: true,
        include: [
          {
            association: 'product',
            attributes: ['id', 'product_name'],
          }
        ]
      }),
      TrackProductStock.findOne({
        attributes: ['id', 'final_quantity', 'default_price'],
        where: {
          company_id: req.user.company_id,
          product_id: product_id, 
          store_id: warehouse_id,
          ...(product_variant_id ? { product_variant_id: product_variant_id } : {}),
        },
        order: [['id', 'DESC']],
        limit: 1,
      }),
    ]);
    // if the stock entry does not exist, return 404
    if (!productStockEntry) {
      return res.status(404).json({ status: false, message: "Stock entry not found" });
    }

    // calculate the new quantity
    const finalStockQuantity = parseInt(quantity) + parseInt(productStockEntry.quantity);
    // update the stock entry
    await ProductStockEntry.update({ quantity: finalStockQuantity }, { where: { id: productStockEntry.id }, transaction });

    // create a new track product stock entry
    await TrackProductStock.create({
      product_id: product_id,
      store_id: warehouse_id,
      user_id: req.user.id,
      company_id: req.user.company_id,
      product_variant_id: product_variant_id ?? null,
      item_name: productStockEntry.product.product_name,
      default_price: trackProductStock ? trackProductStock.default_price : 0,
      item_unit: 1,
      quantity_changed: quantity,
      final_quantity: trackProductStock ? parseInt(trackProductStock.final_quantity) + parseInt(quantity) : parseInt(quantity),
      status_in_out: 1,
      reference_number: "INV" + Math.floor(1000000 + Math.random() * 9000000),
      barcode_number: Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString(),
    }, { transaction });

    // commit transaction
    await transaction.commit();
    // return success message
    return res.status(200).json({ status: true, message: "Stock entry updated successfully" });
  } catch (error) {
    // rollback transaction if error occurs
    if (transaction) {
      await transaction.rollback();
    }
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
      include: [
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
        },
      ]
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
        product,
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
