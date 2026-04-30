
const express = require("express");
const { 
    CreateProductCategory, 
    GetAllProductCategories, 
    UpdateProductCat, 
    DeleteProductscat,
    UploadCategory 
} = require("../controller/ProductCategoryController");
const { authToken } = require("../utils/Middleware");
const { upload }  = require("../utils/handlersbluk");

const router = express.Router();

router.post('/',authToken, CreateProductCategory);
router.get("/",authToken,GetAllProductCategories);
router.put("/:id",authToken,UpdateProductCat);
router.delete('/:id',authToken, DeleteProductscat);
router.post('/upload', authToken, upload.single('file'), UploadCategory);

module.exports = router;