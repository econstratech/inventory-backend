const express = require("express");
const { 
    getTotalPurchaseOfThisMonth, 
    getVendorWiseTotalPurchaseOfThisMonth,
    getMonthWiseRevenueReport,
    getItemWisePurchaseReport,
    getMonthlyPurchaseReport,
    getStatusWisePOReport,
    getPendingPOReport,
    exportPendingPOReport,
    getStockTransferReport,
    getMonthlySalesReport,
    getTotalSalesOfThisMonth,
    getStatusWiseSalesReport,
    getCustomerWiseTotalSalesOfThisMonth,
    getCustomerWiseSalesReport,
    getItemWiseSalesReport
} = require("../controller/ReportController");
const { authToken } = require("../utils/Middleware");

const router = express.Router();

router.get("/total-purchase-of-this-month", authToken, getTotalPurchaseOfThisMonth);
router.get("/vendor-wise-total-purchase-of-this-month", authToken, getVendorWiseTotalPurchaseOfThisMonth);
router.get("/month-wise-revenue-report", authToken, getMonthWiseRevenueReport);
router.get("/item-wise-purchase-report", authToken, getItemWisePurchaseReport);
router.get("/monthly-purchase-report", authToken, getMonthlyPurchaseReport);
router.get("/status-wise-po-report", authToken, getStatusWisePOReport);
router.get("/pending-po-report", authToken, getPendingPOReport);
router.get("/export/pending-po-report", authToken, exportPendingPOReport);
router.get("/stock-transfer-report", authToken, getStockTransferReport);

router.get("/monthly-sales-report", authToken, getMonthlySalesReport);
router.get("/total-sales-of-this-month", authToken, getTotalSalesOfThisMonth);
router.get("/status-wise-sales-report", authToken, getStatusWiseSalesReport);
router.get("/customer-wise-total-sales-of-this-month", authToken, getCustomerWiseTotalSalesOfThisMonth);
router.get("/customer-wise-sales-report", authToken, getCustomerWiseSalesReport);
router.get("/item-wise-sales-report", authToken, getItemWiseSalesReport);

module.exports = router;
