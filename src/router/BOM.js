const express = require("express");
const { 
    AddBOM, 
    UpdateBOM, 
    GetAllBOM, 
    DeleteBOM, 
    GetBOMReport,
    BulkUploadBOM,
    getInventoryNeeded
} = require("../controller/BOMController");
const { authToken } = require("../utils/Middleware");
const { upload } = require("../utils/handlersbluk");

const router = express.Router();

router.post('/add', authToken, AddBOM);
router.post('/bulk-upload', authToken, upload.single('file'), BulkUploadBOM);
router.put('/:id', authToken, UpdateBOM);
router.get('/list', authToken, GetAllBOM);
router.delete('/:id', authToken, DeleteBOM);

router.get('/report', authToken, GetBOMReport);
router.get('/inventory-needed', authToken, getInventoryNeeded);

module.exports = router;
