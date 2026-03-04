const express = require("express");
const { CreateProductionRoute, GetProductionRoute, UpdateProductionRoute,FinishedGoodsData, DeleteProductionRoute, getBOMById,  UpdateSequence, GetSequenceData, createBOM, getBOMDetailsByProductId, getBOMByProductCode, getBOMList, softDeleteBOMs, softDeleteWorkOrders, GetSelectedProductsForProcessing, getProductionDetailsAfterSubmit, getProductionDetails, submitBulkProductionupdate, getProduction, getCurrentStock, updateProductionProcess } = require("../controller/ProductionController");
const { authToken } = require("../utils/Middleware");
const uploadsproduction  = require("../utils/uploads.production");


const router = express.Router();

router.post('/create-production-route', authToken, CreateProductionRoute);
router.put('/update-production-route/:id', authToken, UpdateProductionRoute);
router.get('/get-production-route', authToken, GetProductionRoute);
router.delete('/delete-production-route/:id', authToken, DeleteProductionRoute);

router.post('/sequence-production-route', authToken, UpdateSequence);
router.get('/get-sequence-production-route', authToken, GetSequenceData);

router.get('/finishedgoods-select', authToken, FinishedGoodsData);

router.post("/upload-files", authToken, uploadsproduction.array("files"), (req, res) => {
    try {
        console.log("📂 Received Files:", req.files); // ✅ Log uploaded files
  
        if (!req.files || req.files.length === 0) {
            console.error("⚠️ No files received.");
            return res.status(400).json({ message: "No files uploaded" });
        }
  
        const fileUrls = req.files.map(file => file.filename);
        console.log("✅ Uploaded File URLs:", fileUrls); // ✅ Log file URLs
  
        res.status(200).json({ fileUrls });
    } catch (error) {
        console.error("❌ Upload error:", error);
        res.status(500).json({ message: "Upload failed", error: error.message });
    }
  });
  
  router.post("/create-bom", authToken, createBOM);
   router.get('/view-bom/:bomid', authToken, getBOMById);
//   router.put("/update-bom/:bomId", authToken, updateBOM);
   router.get("/get-bom-list",authToken, getBOMList);
   router.post("/soft-delete-boms", softDeleteBOMs);
   router.get("/get-allproduction-list",authToken, getProduction);
router.get("/bom-by-product/:product_code", authToken, getBOMDetailsByProductId);
router.get("/bom-by-product-code/:product_code", authToken, getBOMByProductCode);
router.post("/workordersoft-delete", authToken, softDeleteWorkOrders);
router.post("/getselectedproductsforprocessing", authToken, GetSelectedProductsForProcessing);
router.post("/getproductiondetailsaftersubmit", authToken, getProductionDetailsAfterSubmit);
router.get("/getProductionDetails/:id", authToken, getProductionDetails);
router.post("/submitBulkProductionupdate",authToken, submitBulkProductionupdate);
router.get('/get-current-stock',authToken, getCurrentStock);
router.post("/submit-production-process", authToken, updateProductionProcess);
module.exports = router;