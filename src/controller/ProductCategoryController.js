const { Op } = require("sequelize");
const { User, ProductCategory } = require("../model");

const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { uploadDir } = require("../utils/handlersbluk");


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
          title: category.title,
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
            title: req.body.title,
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
      const { error } = await ProductCategory.validate({
        "title": req.body.catname,
    });
    if (error) {
      return res.status(400).json({ error: error.details });
  }
        const productId = req.params.id;
        await ProductCategory.update(
            {  title: req.body.catname,
                status: req.body.status,
             },
            { where: { id: productId } }
          );

        return res.status(200).json({ status: true, message: "Record Updated" });
    } catch (err) {
        return res.status(400).json(err)
    }

}

exports.GetAllProductCategories = async (req, res) => {
    try {
        const productCategories = await ProductCategory.findAll({
          attributes: ['id', 'title', 'status', 'created_at', 'updated_at'],
          raw: true,
            where: {
              user_id: req.user.id,
              company_id: req.user.company_id,
                status: {
                    [Op.ne]: 2
                }
            }, order: [
                ['title', 'ASC']
            ]
        })
        return res.status(200).json({ status: true, message: "Success", data: productCategories });

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