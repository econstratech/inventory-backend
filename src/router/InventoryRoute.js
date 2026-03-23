const express = require("express");
const { authToken } = require("../utils/Middleware");
const router = express.Router();
const { 
    GetStockColourCounts,
    GetStockValuation,
    InventoryOverview, 
    InventoryPerformance,
    TopItems
} = require("../controller/InventoryController");

router.get("/stock-colour-counts", authToken, GetStockColourCounts);
router.get("/stock-valuation", authToken, GetStockValuation);
router.get("/overview", authToken, InventoryOverview);
router.get("/performance", authToken, InventoryPerformance);
router.get('/top-items', authToken, TopItems);



module.exports = router;