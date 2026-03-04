const { Op, fn, col, literal } = require("sequelize");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const csv = require("csv-parser");


const { Customer, SalesProduct, SalesProductReceived } = require("../model");

const { uploadDir } = require("../utils/handlersbluk");
const Customerbank = require("../model/CustomerBank");
const CommonHelper = require("../helpers/commonHelper");
// const CompanyManagementModel = require("../model/Company");

/**
 * Upload customers from CSV file
 * @param {APIRequest} req 
 * @param {APIResponse} res 
 * @returns {Promise<void>}
 * @returns {Object}
 * @returns {Object} status
 * @returns {Object} message
 * @returns {Object} created_records
 * @returns {Object} error
 */
exports.UploadCustomers = async (req, res) => {
  let createdCount = 0;

  try {
    if (!req.file) {
      throw new Error("No file uploaded");
    }

    const filePath = path.join(uploadDir, req.file.filename);
    const ext = path.extname(req.file.filename).toLowerCase();

    if (ext !== ".csv") {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        status: false,
        message: "Only CSV file is allowed",
      });
    }

    const batchSize = 100; // Insert in batches
    let batch = [];

    const stream = fs.createReadStream(filePath).pipe(
      csv({
        mapHeaders: ({ header }) =>
          header
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_"), // Vendor Name → vendor_name
      })
    );


    for await (const row of stream) {

      const name = row.name?.trim();
      const address = row.address?.trim();
      const phone = row.mobile?.trim();
      const email = row.email?.trim()?.toLowerCase();

      const isRowEmpty = !name && !address && !phone && !email;
      if (isRowEmpty) continue;

      batch.push({
        user_id: req.user.id,
        company_id: req.user.company_id,
        name,
        address,
        phone,
        email,
      });

      // Insert in batches
      if (batch.length >= batchSize) {
        const result = await Customer.bulkCreate(batch, {
          validate: true,
          ignoreDuplicates: true, // optional
        });

        createdCount += result.length;
        batch = [];
      }
    }

    // Insert remaining records
    if (batch.length > 0) {
      const result = await Customer.bulkCreate(batch, {
        validate: true,
        ignoreDuplicates: true,
      });

      createdCount += result.length;
    }

    // Delete file after processing
    fs.unlinkSync(filePath);

    return res.status(200).json({
      status: true,
      message: "Bulk upload completed successfully",
      created_records: createdCount,
    });

  } catch (err) {
    console.error("Error processing CSV:", err);

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

// exports.UploadCustomers = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ status: false, message: "No file uploaded" });
//     }

//     if (!req.user || !req.user.id || !req.user.company_id) {
//       return res.status(401).json({ status: false, message: "Unauthorized" });
//     }

//     const filePath = path.join(uploadDir, req.file.filename);
//     const ext = path.extname(req.file.filename).toLowerCase();
//     const categories = [];

//     if (ext === ".xlsx" || ext === ".xls") {
//       const workbook = XLSX.readFile(filePath);
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       const data = XLSX.utils.sheet_to_json(sheet);

//       data.forEach((row) => {
//         // console.log("Excel Row:", row);
//         categories.push({
//           name: row.name,
//           type: row.type,
//           address: row.address,
//           address2: row.address2,
//           city: row.city,
//           state: row.state,
//           zip: row.zip,
//           country: row.country,
//           sales_person: row.sales_person,
//           gstin: row.gstin,
//           pan: row.pan,
//           phone: row.phone,
//           mobile: row.mobile,
//           email: row.email,
//           website: row.website,
//           account_number: row.account_number,
//           bank_name: row.bank_name,
//           account_holder: row.account_holder,
//           ifsc_code: row.ifsc_code,
//           user_id: req.user.id,
//           company_id: req.user.company_id,
//         });
//       });

//       await saveVendors(categories, req.user.id, req.user.company_id);
//       fs.unlinkSync(filePath); // safe to delete here
//       return res.status(200).json({ status: true, message: "Success", data: categories });

//     } else if (ext === ".csv") {
//       fs.createReadStream(filePath)
//         .pipe(csv())
//         .on("data", (row) => {
//           console.log("CSV Row:", row);
//           categories.push({
//             ...row,
//             user_id: req.user.id,
//             company_id: req.user.company_id,
//           });
//         })
//         .on("end", async () => {
//           try {
//             await saveVendors(categories, req.user.id, req.user.company_id);
//             fs.unlinkSync(filePath);
//             return res.status(200).json({ status: true, message: "Success", data: categories });
//           } catch (err) {
//             console.error("Error saving CSV vendors:", err);
//             return res.status(500).json({ status: false, message: "CSV Save Error", error: err.message });
//           }
//         });

//     } else {
//       return res.status(400).json({ status: false, message: "Invalid file type" });
//     }

//   } catch (err) {
//     console.error("Error processing file:", err);
//     return res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
//   }
// };


// Function to save vendors to the database
const saveVendors = async (categories, userId, companyId) => {
  for (const category of categories) {
    const vendor = await Customer.create({
      name: category.name,
      type: category.type,
      address: category.address,
      address2: category.address2,
      city: category.city,
      state: category.state,
      zip: category.zip,
      country: category.country,
      sales_person: category.sales_person,
      gstin: category.gstin,
      pan: category.pan,
      phone: category.phone,
      mobile: category.mobile,
      email: category.email,
      website: category.website,
      user_id: userId,
      company_id: companyId,


    });

    await Customerbank.create({
      account_number: category.account_number,
      bank_name: category.bank_name,
      account_holder: category.account_holder,
      ifsc_code: category.ifsc_code,
      customer_id: vendor.id,
    });
  }
};

// async function findGSTN(gstn) {
//   const gst = await Customer.findOne({ where: { gstin: gstn } });
//   return gst ? gst.id : null;
// }
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
exports.AddCustomer = async (req, res) => {
  try {
    // sanitize the request body
    const payload = {
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      phone: req.body.phone.trim(),
      address: req.body.address.trim()
    };
    // create the customer
    const CustomerData = await Customer.create({
      ...payload,
      user_id: req.user.id,
      company_id: req.user.company_id,
    });

    // if (req.file) {
    //   const company_id = req.user?.company_id;
    
    //   // Fetch company name from the database
    //   const company = await CompanyManagementModel.findOne({
    //     where: { id: company_id },
    //     attributes: ['company_name'],
    //   });
    //   const companyName = company?.company_name || "DefaultCompany";
    //   const uploadResult = await UploadFileToAWS(req.file, companyName);
    //   if (uploadResult.status) {
    //     attachment_file = uploadResult.url;
    //     await Customer.update(
    //       { attachment_file: uploadResult.url },
    //       { where: { id: CustomerData.id } }
    //     );
    //   } else {
    //     return res.status(500).json({ status: false, message: uploadResult.message });
    //   }
    // }
    // if (req.body.account_number) {
    //   const BankData = await Customerbank.create({
    //     customer_id: CustomerData.id,
    //     account_number: req.body.account_number,
    //     bank_name: req.body.bank_name,
    //     account_holder: req.body.account_holder,
    //     ifsc_code: req.body.ifsc_code,
    //   });
    // }

    return res.status(200).json({ 
      status: true, 
      message: "success", 
      data: CustomerData,
    });

  } catch (err) {
    console.error("Error adding customer:", err);
    return res.status(err.status || 500).json({ status: false, message: "Internal Server Error", error: err.message });
  }
};

/**
 * API to update a customer
 * @param {APIRequest} req 
 * @param {APIResponse} res 
 * @returns 
 */
exports.UpdateCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;

    // update the customer
    const updatedRowsCount = await Customer.update(req.body, { where: { id: customerId } });

    // if the customer is not found, return 404
    if (updatedRowsCount === 0) {
      return res.status(404).json({ status: false, message: "Customer not found" });
    }

    // if (req.file) {
    //   const company_id = req.user?.company_id;
    
    //   // Fetch company name from the database
    //   const company = await CompanyManagementModel.findOne({
    //     where: { id: company_id },
    //     attributes: ['company_name'],
    //   });
    //   const companyName = company?.company_name || "DefaultCompany";
    //   const uploadResult = await UploadFileToAWS(req.file, companyName);
    //   if (uploadResult.status) {
    //     attachment_file = uploadResult.url;
    //     await Customer.update(
    //       { attachment_file: uploadResult.url },
    //       { where: { id:VendorId } }
    //     );
    //   } else {
    //     return res.status(500).json({ status: false, message: uploadResult.message });
    //   }
    // }
    // const BankData = await Customerbank.update(
    //   {
    //     account_number: req.body.account_number,
    //     bank_name: req.body.bank_name,
    //     account_holder: req.body.account_holder,
    //     ifsc_code: req.body.ifsc_code,
    //   },
    //   { where: { customer_id: VendorId } }
    // );

    return res
      .status(200)
      .json({ status: true, message: "Customer updated successfully" });
  } catch (err) {
    console.error("Error updating customer:", err);
    return res.status(err.status || 500).json({ status: false, message: "Internal Server Error", error: err.message });
  }
};
/**
 * Fetch all customers
 * @param {*} req 
 * @param {*} res 
 * @returns {Promise<void>}
 * @returns {Object}
 * @returns {Object} data
 * @returns {Object} total
 * @returns {Object} page
 * @returns {Object} pageSize
 */
exports.GetAllCustomer = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * pageSize;

    // optional email filter (query param)
    const searchkey = (req.query.searchkey || '').trim();

    // base where
    const where = {
      status: 1,
      company_id: req.user.company_id
    };

    // If searchkey is provided, add it to the where clause
    if (searchkey) {
      where[Op.or] = [
          { name: { [Op.like]: `%${searchkey}%` } },
          { email: { [Op.like]: `%${searchkey}%` } },
          { phone: { [Op.like]: `%${searchkey}%` } }
      ];
    }

    // get the customers
    const { count, rows } = await Customer.findAndCountAll({
      attributes: ['id', 'name', 'email', 'phone', 'address', 'city', 'created_at'],
      where,
      order: [['id', 'DESC']],
      limit: pageSize,
      offset: offset,
      raw: true,
    });

    // return the customers with pagination
    return res.status(200).json({
      message: "Customer list fetched successfully",
      data: {
        total: count,
        page,
        pageSize,
        rows,
      }
    });
  } catch (err) {
    console.log("Error in GetAllCustomer:", err);
    return res.status(400).json(err);
  }
};


exports.DeleteCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;

    if (!customerId || isNaN(customerId)) {
      return res.status(400).json({ message: "Invalid Customer ID" });
    }

    const customer = await Customer.findOne({
      attributes: ['id'],
      where: { id: customerId },
      raw: true,
    });

    // if the customer is not found, return 404
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Update only the status field to 1
    await Customer.update(
      { status: '2' }, { where: { id: customerId } }
    );
    return res.status(200).json({ message: "Customer is removed successfully" });
  } catch (error) {
    console.error("Error deleting Customer:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


/**
 * Get demanded products for a customer
 * @param {APIRequest} req 
 * @param {APIResponse} res 
 * @returns {Promise<void>}
 * @returns {Object}
 * @returns {Object} message
 * @returns {Object} data
 * @returns {Object} pagination
 * @returns {Object} rows
 */
exports.GetDemandedProducts = async (req, res) => {
  try {
    const customerId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * pageSize;

    const receivedProducts = await SalesProduct.findAll({
      attributes: [
        'id', 
        'qty',
        'status', 
        'created_at',
        [fn('SUM', col('sales_product_received.received_quantity')), 'total_received'],
        [fn('SUM', col('sales_product_received.taxIncl')), 'total_amount']
      ],
      where: {
        customer_id: customerId,
        status: { [Op.in]: [9, 10, 11] }, // Partial, fully dispatched, completed
        company_id: req.user.company_id 
      },
      raw: true,
      nest: true,
      order: [[literal('created_at'), 'DESC']],
      limit: pageSize,
      offset: offset,
      subQuery: false,
      group: [
        'sales_product_received.warehouse.id',
        'sales_product_received.warehouse.name',
        'SalesProduct.id',
        'productData.id'
      ],
      include: [
        {
          association: 'sale',
          attributes: ['id', 'reference_number'],
        },
        {
          association: 'productData',
          attributes: ['id', 'product_name', 'product_code'],
        },
        {
          association: 'sales_product_received',
          attributes: [],
          required: true,
          include: [
            {
              association: 'warehouse',
              attributes: ['id', 'name'],
              required: true,
            },
          ]
        }
      ]
    });

      // 🔹 Count Query (count distinct warehouse per sales product)
      const countResult = await SalesProduct.findAll({
        attributes: [
          [fn('COUNT', fn('DISTINCT', col('sales_product_received.warehouse.id'))), 'total']
        ],
        where: {
          customer_id: customerId,
          status: { [Op.in]: [10, 11] },
          company_id: req.user.company_id
        },
        include: [
          {
            association: 'sales_product_received',
            attributes: [],
            required: true,
            include: [
              {
                association: 'warehouse',
                attributes: [],
                required: true
              }
            ]
          }
        ],
        raw: true
      });
  
      const totalRecords = countResult[0]?.total || 0;
  
      return res.status(200).json({
        status: true,
        message: "Demanded products (warehouse-wise) fetched successfully",
        data: receivedProducts,
        pagination: {
          total: parseInt(totalRecords),
          page,
          pageSize,
          totalPages: Math.ceil(totalRecords / pageSize),
        }
      });
  } catch (err) {
    console.error("Error getting demanded products:", err);
    return res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
  }
};
