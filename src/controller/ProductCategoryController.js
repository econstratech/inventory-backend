const { Op } = require("sequelize");
const { ProductCategory } = require("../model");

const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { uploadDir } = require("../utils/handlersbluk");
const CommonHelper = require("../helpers/commonHelper");


exports.UploadCategory = async (req, res) => {
   try {
      if (!req.file) {
          console.error('No file uploaded');
          return res.status(400).json({ status: false, message: 'No file uploaded' });
      }
      const filePath = path.join(uploadDir, req.file.filename);

      console.log(`File path: ${filePath}`); // Log the file path

      const ext = path.extname(req.file.filename).toLowerCase();
      console.log(`File extension: ${ext}`); // Log the file extension

      const categories = [];

      if (ext == '.xlsx' || ext == '.xls') {
          // Read Excel file
          const workbook = XLSX.readFile(filePath);
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(sheet);

          data.forEach(row => {
              categories.push({ title: row.Category });
          });
          await saveCategories(categories, req.user.id, req.user.company_id);
          res.status(200).json({ status: true, message: "Success", data: categories });
      } else if (ext === '.csv') {
          // Read CSV file
          fs.createReadStream(filePath)
              .pipe(csv())
              .on('data', (row) => {
                  categories.push({ title: row.title });
              })
              .on('end', async () => {
                  await saveCategories(categories, req.user.id, req.user.company_id);
                  return res.status(200).json({ status: true, message: "Success", data: categories });
              });
      } else {
          console.error('Invalid file type');
          return res.status(400).json({ status: false, message: 'Invalid file type' });
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

  } catch (err) {
      console.error("Error processing file:", err);
      res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
  }
};

// Function to save categories to the database
const saveCategories = async (categories, userId, companyId) => {
  for (const category of categories) {
      await ProductCategory.create({
          title: category.title.trim(),
          user_id: userId,
          company_id: companyId,
      });
  }
};

exports.CreateProductCategory = async (req, res) => {
    try {
        // Check if the category already exists
        const existingCategory = await ProductCategory.findOne({
          attributes: ['id'],
          where: { title: req.body.title, company_id: req.user.company_id },
          raw: true,
        });
        if (existingCategory) {
            return res.status(400).json({ status: false, message: "Product category with this name already exists" });
        }
        // Create the category
        const productCategory = await ProductCategory.create({
            title: req.body.title.trim(),
            user_id: req.user.id,
            company_id: req.user.company_id,
        })
        return res.status(200).json({ status: true, message: "Success", data: productCategory  });
    } catch (err) {
      // Log the error and return error response
      console.error("Error inserting data:", err);
      return res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
  }

}

exports.UpdateProductCat = async (req, res) => {
    try {
      const productCategoryId = req.params.id;
      const { title, status } = req.body;
      // Check if the category already exists
      const existingCategory = await ProductCategory.findOne({
        attributes: ['id'],
        where: { id: productCategoryId },
        raw: true,
      });
      // If category is not found, then throw 404 error
      if (!existingCategory) {
        return res.status(404).json({ 
          status: false, 
          message: "Product category is not found" 
        });
      }
      // Update the category
      await ProductCategory.update(
        {  
          ...(title &&  { title: title.trim() }),
          status: status,
        },
        { where: { id: productCategoryId } }
      );

      // Return success response
      return res.status(200).json({ 
        status: true, 
        message: "Product category has been updated successfully" 
      });
    } catch (err) {
      console.error("Error updating product category:", err);
      return res.status(400).json({ 
        status: false,
        message: "Unable to update product category", 
        error: err.message 
      });
    }

}

/**
 * Get list of all categories of a particular company
 */
exports.GetAllProductCategories = async (req, res) => {
  try {
    // pagination params
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // base where
    const where = { company_id: req.user.company_id };

    // if searchkey is provided then add it to the where clause
    if (req.query.title) {
        where.title = { [Op.like]: `%${req.query.title.trim()}%` };
    }
    // if status is provided then add it to the where clause
    if (req.query.status) {
        where.status = req.query.status;
    } else {
      where.status = { [Op.ne]: 2 }
    }

    // Query to get all active & inactive categories
    const productCategories = await ProductCategory.findAndCountAll({
      attributes: ['id', 'title', 'status', 'created_at', 'updated_at'],
      distinct: true,
      raw: true,
      limit,
      offset,
      where,
      order: [['title', 'ASC']]
    });

    // Get paginated data
    const paginatedProductCategoryData = CommonHelper.paginate(productCategories, page, limit);

    // return response
    return res.status(200).json({
      status: true,
      message: "Product Categories fetched successfully",
      data: paginatedProductCategoryData
    });

  } catch (err) {
    console.error("Error fetching product categories:", err);
    return res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
  }
}

exports.GetAllProductscatupdate = async (req, res) => {
  
  try {
    const catid = req.params.id;
    
    const getAllProductdata = await ProductCategory.findOne({ where: { id: catid } });
    //return res.send(getAllProductdata);
    if (!getAllProductdata) {
      return res.status(404).json({ message: "Product category not found" });
    }

    return res.status(200).json({ message: "success", data: getAllProductdata });
  } catch (err) {
    console.error('Error fetching product category:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

  exports.DeleteProductscat = async (req, res) => {
    try {
      const productId = req.params.id;
      
      if (!productId || isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }
      const product = await ProductCategory.findOne({ where: { id: productId } });
      if (product) {
        // Update only the status field to 1
        await ProductCategory.update(
            { status: '2' },
            { where: { id: productId } }
          );
          
        res.json({ message: "Item removed" });
      } else {
        res.status(404).json({ message: "Item not found" });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };