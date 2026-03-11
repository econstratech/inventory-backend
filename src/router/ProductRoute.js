
const express = require("express");
const { 
    AddProduct, 
    GetAllProducts, 
    DeleteProducts, 
    UpdateProduct, 
    GetAllDeletedProducts, 
    GetAllDeletedProductsRestore, 
    GetProductDetails, 
    GetAllProductsbyStore, 
    UpdateStockAndTrack, 
    UpdateStockOnly, 
    UpdateStockTranfer, 
    StockAdjustment, 
    GetAllActivity, 
    referenceNumberCount, 
    uploadProducts, 
    DeleteMultipleProducts, 
    getStockTransferReport, 
    getStockAgingReport, 
    getTotalProductCount, 
    getStorewiseMonthlyStockReport, 
    getProductStockMaintenanceReport, 
    getSlowMovingItemReport, 
    getDeadStockReport, 
    getInventoryPerformance, 
    getStockLevels, 
    getStockValuation, 
    getTopItems, 
    getInventoryOverview, 
    generateProductReport, 
    // GetLowQtyProducts, 
    // GetOverStockProducts, 
    AddToStock,
    BulkAddToStock,
    GetStockEntries,
    GetStockEntriesById,
    DeleteStockEntry,
    GetStoreWiseStock,
    UpdateStockEntry,
    GetIndentRequiredProducts,
    ProductAvailableBatches,
    UpdateProductVariants,
    GetProductVariants
} = require("../controller/ProductController");
const { authToken } = require("../utils/Middleware");
const { upload } = require("../utils/ImageUpload");
// const bulkupload  = require("../utils/handlersbluk");
const excelbulkproduct  = require("../utils/excelbulk");
const router = express.Router();

router.post('/add',authToken, upload.single('file'), AddProduct);
router.get("/list",authToken, GetAllProducts);
router.get("/all-deleted-products",authToken,GetAllDeletedProducts);
router.get('/stock-entries', authToken, GetStockEntries);
router.get("/indent-required-products", authToken, GetIndentRequiredProducts);

router.get('/stock-entries/:id', authToken, GetStockEntriesById);
router.put('/stock-entries/:id', authToken, UpdateStockEntry);
router.delete('/stock-entries/:id', authToken, DeleteStockEntry);
router.delete("/delete-multiple-restore",authToken,GetAllDeletedProductsRestore);
router.delete("/delete-multiple", authToken, DeleteMultipleProducts);
router.post("/update/:id",authToken, upload.single('file'), UpdateProduct);
router.post("/update-variants/:id", authToken, UpdateProductVariants);
router.get("/variants/:id", authToken, GetProductVariants);
router.get("/details/:id",authToken, GetProductDetails);
router.delete('/:id', authToken, DeleteProducts);
router.post('/bulk-upload', authToken, excelbulkproduct.single('file'), uploadProducts);
router.post('/add-to-stock', authToken, AddToStock);
router.post('/bulk-add-to-stock', authToken, excelbulkproduct.single('file'), BulkAddToStock);

router.get("/storewise-all-products/:id", authToken, GetAllProductsbyStore);
router.get("/product-available-batches/:id", authToken, ProductAvailableBatches);
router.post('/update-stock',authToken, UpdateStockAndTrack);
router.post('/update-stockonly',authToken, UpdateStockOnly);
router.post('/update-stocktransfer',authToken, UpdateStockTranfer);
router.get('/stockadjustment/:id',authToken, StockAdjustment);
router.get('/getallactivity',authToken, GetAllActivity);
router.get('/reference-number-count/:referenceNumber',authToken, referenceNumberCount);
router.get("/stock-transfer-report",authToken, getStockTransferReport);
router.get("/stock-aging-report",authToken,getStockAgingReport);
router.get("/total-count", authToken, getTotalProductCount);
router.get("/storewise-monthly-stock", authToken, getStorewiseMonthlyStockReport);
router.get("/product-stock-maintenance", authToken,getProductStockMaintenanceReport);
router.get('/slow-moving-items',authToken, getSlowMovingItemReport);
router.get("/dead-stock-report", authToken, getDeadStockReport);
router.get("/inventory/performance", authToken, getInventoryPerformance);
router.get("/inventory/stock-levels", authToken, getStockLevels);
router.get("/inventory/stock-valuation", authToken, getStockValuation);
router.get('/inventory/top-items', authToken,getTopItems);
router.get("/inventory/overview",authToken,getInventoryOverview);

router.post("/generate-report", authToken, generateProductReport);

// router.get("/low-quantity-products", GetLowQtyProducts);
// router.get("/over-stock-products", GetOverStockProducts);
router.get("/store-wise-stock/:id", authToken, GetStoreWiseStock);

module.exports = router;