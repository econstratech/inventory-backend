
const express = require("express");
const { 
    AddCustomer, 
    GetAllCustomer, 
    UpdateCustomer, 
    UploadCustomers, 
    DeleteCustomer,
    GetDemandedProducts
} = require("../controller/CustomersController");
const { authToken } = require("../utils/Middleware");
const { upload } = require("../utils/ImageUpload");
const bulkupload  = require("../utils/handlersbluk");
const router = express.Router();

router.post('/add',authToken, upload.single('file'), AddCustomer);
router.get("/all-customers",authToken,GetAllCustomer);
router.post("/update/:id",authToken, upload.single('file'), UpdateCustomer);
router.get("/demanded-products/:id", authToken, GetDemandedProducts);
router.delete('/:id', DeleteCustomer);
router.post('/upload', authToken, bulkupload.upload.single('file'), UploadCustomers);
module.exports = router;