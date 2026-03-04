const XLSX = require("xlsx");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Op } = require("sequelize");
const { uploadDir } = require("../utils/handlersbluk");
const { Vendor } = require("../model");
// const Bank = require("../model/Bank");
const CommonHelper = require('../helpers/commonHelper');


/**
 * Upload vendors from CSV file
 * @param {APIRequest} req 
 * @param {APIResponse} res 
 * @returns {Promise<void>}
 * @returns {Object}
 * @returns {Object} status
 * @returns {Object} message
 * @returns {Object} created_records
 * @returns {Object} error
 */
exports.UploadVendors = async (req, res) => {
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

      const vendor_name = row.name?.trim();
      const address = row.address?.trim();
      const mobile = row.mobile?.trim();
      const email = row.email?.trim()?.toLowerCase();

      const isRowEmpty = !vendor_name && !address && !mobile && !email;
      if (isRowEmpty) continue;

      batch.push({
        user_id: req.user.id,
        company_id: req.user.company_id,
        vendor_name,
        address,
        mobile,
        email,
      });

      // Insert in batches
      if (batch.length >= batchSize) {
        const result = await Vendor.bulkCreate(batch, {
          validate: true,
          ignoreDuplicates: true, // optional
        });

        createdCount += result.length;
        batch = [];
      }
    }

    // Insert remaining records
    if (batch.length > 0) {
      const result = await Vendor.bulkCreate(batch, {
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

// Function to save vendors to the database
const saveVendors = async (categories, userId, companyId) => {
  for (const category of categories) {
    const vendor = await Vendor.create({
      user_id: userId,
      company_id: companyId,
      vendor_name: category.vendor_name,
      // type: category.type,
      address: category.address,
      // address2: category.address2,
      // city: category.city,
      // state: category.state,
      // zip: category.zip,
      // country: category.country,
      // gst_treatment: category.gst_treatment,
      // gstin: category.gstin,
      // pan: category.pan,
      // phone: category.phone,
      mobile: category.mobile,
      email: category.email,
      // website: category.website,
    });

    // await Bank.create({
    //   account_number: category.account_number,
    //   bank_name: category.bank_name,
    //   account_holder: category.account_holder,
    //   ifsc_code: category.ifsc_code,
    //   vendor_id: vendor.id,
    // });
  }
};

// async function findGSTN(gstn) {
//   const gst = await Vendor.findOne({ where: { gstin: gstn } });
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
    console.log(uploadResult, "File uploaded to S3");

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

exports.AddVendor = async (req, res) => {
  try {
    await Vendor.create({
      user_id: req.user.id,
      company_id: req.user.company_id,
      vendor_name: req.body.vendor_name,
      // type: req.body.type,
      address: req.body.address,
      // address2: req.body.address2,
      // city: req.body.city,
      // state: req.body.state,
      // zip: req.body.zip,
      // country: req.body.country,
      // gst_treatment: req.body.gst_treatment,
      // gstin: req.body.gstin,
      // pan: req.body.pan,
      // phone: req.body.phone,
      mobile: req.body.mobile,
      // email: req.body.email,
      // website: req.body.website,
      // tags: req.body.tags,
    });


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
    //     attachment_file = uploadResult.url;
    //     await Vendor.update(
    //       { attachment_file: uploadResult.url },
    //       { where: { id: VendorData.id } }
    //     );
    //   } else {
    //     return res.status(500).json({ status: false, message: uploadResult.message });
    //   }
    // }


    // if (req.body.account_number) {
    //   const BankData = await Bank.create({
    //     vendor_id: VendorData.id,
    //     account_number: req.body.account_number,
    //     bank_name: req.body.bank_name,
    //     account_holder: req.body.account_holder,
    //     ifsc_code: req.body.ifsc_code,
    //   });
    // }

    return res.status(200).json({ status: true, message: "Vendor added successfully" });

  } catch (err) {
    console.error("Error adding vendor:", err);
    return res.status(500).json({ status: false, message: "Error adding vendor", error: err.message });
  }
};

exports.UpdateVendor = async (req, res) => {
  try {
    const VendorId = req.params.id;
    // let attachment_file = null;

    await Vendor.update(
      {
        vendor_name: req.body.vendor_name,
        address: req.body.address,
        mobile: req.body.mobile,
        email: req.body.email,
        user_id: req.user.id,
        company_id: req.user.company_id,
      },
      { where: { id: VendorId } }
    );

    // if (req.file) {
    //   const company = await Company.findOne({
    //     where: { id: req.user.company_id },
    //     attributes: ['company_name'],
    //   });

    //   const companyName = company?.company_name || "DefaultCompany";
    //   const uploadResult = await UploadFileToAWS(req.file, companyName);
    //   if (uploadResult.status) {
    //     attachment_file = uploadResult.url;
    //     await Vendor.update(
    //       { attachment_file: uploadResult.url },
    //       { where: { id: VendorId } }
    //     );
    //   } else {
    //     return res.status(500).json({ status: false, message: uploadResult.message });
    //   }
    // }

    // const BankData = await Bank.update(
    //   {
    //     account_number: req.body.account_number,
    //     bank_name: req.body.bank_name,
    //     account_holder: req.body.account_holder,
    //     ifsc_code: req.body.ifsc_code,
    //   },
    //   { where: { vendor_id: VendorId } }
    // );

    // Return with success message
    return res.status(200).json({ status: true, message: "Vendor details has been updated successfully" });

  } catch (err) {
    console.error("Error updating vendor:", err);
    return res.status(400).json({ status: false, message: "Error updating vendor", error: err.message });
  }
};

/**
 * Get all vendors for the company
 * @param {APIRequest} req 
 * @param {APIResponse} res 
 * @returns {Promise<void>}
 * @returns {Object}
 * @returns {Object} data
 * @returns {Object} pagination
 * @returns {Object} rows
 */
exports.GetAllVendors = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    // pagination params
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const searchkey = (req.query.searchkey || '').trim();

    // base where
    const where = { status: 1, company_id: company_id };

    if (searchkey !== '') {
      where[Op.or] = [
          { vendor_name: { [Op.like]: `%${searchkey}%` } },
          { email: { [Op.like]: `%${searchkey}%` } },
          { mobile: { [Op.like]: `%${searchkey}%` } }
      ];
    }

    // Get all vendors for the company
    const vendors = await Vendor.findAndCountAll({
      attributes: ['id','vendor_name','email','address','mobile'],
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
      raw: true
    });

    // Get paginated data
    const paginatedVendorData = CommonHelper.paginate(vendors, page, limit);

    // return response
    return res.status(200).json({ 
      status: true, 
      message: "Vendors fetched successfully", 
      data: paginatedVendorData 
    });
  } catch (err) {
    console.error("Error fetching vendors:", err);
    return res.status(400).json({ 
      status: false, 
      message: "Error fetching vendors", 
      error: err.message 
    });
  }
};

exports.DeleteVendors = async (req, res) => {
  try {
    const VendorId = req.params.id;

    if (!VendorId || isNaN(VendorId)) {
      return res.status(400).json({ message: "Invalid Vendor ID" });
    }

    const vendor = await Vendor.findOne({ where: { id: VendorId } });

    if (vendor) {
      //await Vendor.destroy({ where: { id: VendorId } });
      // Update only the status field to 1
       await Vendor.update(
        { status: "2" },
        { where: { id: VendorId } }
      );
      res.json({ message: "Item removed" });
    } else {
      res.status(404).json({ message: "Item not found" });
    }
  } catch (error) {
    console.error("Error deleting Vendor:", error);
    res.status(500).json({ message: "Server error" });
  }
};




///import to tally
