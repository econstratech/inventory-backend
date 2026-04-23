const express = require("express");
const {
    CreateWorkOrder,
    CreateMultipleWorkOrders,
    GetAllWorkOrders,
    DeleteWorkOrder,
    GetBOMListForWorkOrder,
    CreateMaterialIssue,
    CompleteMaterialIssue,
    SaveProductionData,
    GetWorkOrderById,
    UpdateWorkOrder,
    CancelWorkOrder,
    CompleteProduction,
    ExportWorkOrders,
    GetWorkOrderStats,
    GetMonthlyTrend,
    GetDispatchList,
    GetDispatchStats,
    dispatchWorkOrder,
    GetDispatchHistory,
    CreateProductionPlanning,
    GetAllProductionPlannings,
    GetPlanningById,
    UpdateProductionPlanning,
    DeleteProductionPlanning,
    CreateProductionPlanningEntryRecord,
    GetProductionPlanningEntryRecordList,
} = require("../controller/ProductionController");
const { authToken } = require("../utils/Middleware");
// const uploadsproduction  = require("../utils/uploads.production");


const router = express.Router();

router.post('/work-order/create', authToken, CreateWorkOrder);
router.post('/work-order/create-multiple', authToken, CreateMultipleWorkOrders);
router.get('/work-order/stats', authToken, GetWorkOrderStats);
router.get('/work-order/export', authToken, ExportWorkOrders);
router.get('/work-order/list', authToken, GetAllWorkOrders);
router.get('/work-order/:wo_id', authToken, GetWorkOrderById);
router.put('/work-order/update/:wo_id', authToken, UpdateWorkOrder);
router.put('/work-order/cancel/:wo_id', authToken, CancelWorkOrder);
router.delete('/work-order/delete/:id', authToken, DeleteWorkOrder);

router.get('/work-order/bom-list/:wo_id', authToken, GetBOMListForWorkOrder);
router.post('/work-order/material-issue', authToken, CreateMaterialIssue);
router.post('/work-order/material-issue-complete', authToken, CompleteMaterialIssue);
router.post('/work-order/save-production-data', authToken, SaveProductionData);
router.post('/work-order/complete-production', authToken, CompleteProduction);

// Production dashboard routes
router.get('/dashboard/monthly-trend', authToken, GetMonthlyTrend);

// Production dispatch routes
router.get('/dispatch', authToken, GetDispatchList);
router.get('/dispatch/stats', authToken, GetDispatchStats);
router.post('/dispatch/:wo_id', authToken, dispatchWorkOrder);
router.get('/dispatch-history/:wo_id', authToken, GetDispatchHistory);

// Production planning routes
router.post('/planning/create', authToken, CreateProductionPlanning);
router.get('/planning/list', authToken, GetAllProductionPlannings);
router.get('/planning/:id', authToken, GetPlanningById);
router.put('/planning/update/:id', authToken, UpdateProductionPlanning);
router.delete('/planning/delete/:id', authToken, DeleteProductionPlanning);
router.get('/planning/:planning_id/entry-records', authToken, GetProductionPlanningEntryRecordList);
router.post('/planning/:planning_id/entry-record', authToken, CreateProductionPlanningEntryRecord);



module.exports = router;