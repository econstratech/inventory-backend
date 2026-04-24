const express = require("express");
const {
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
const workOrderRouter = require("./WorkOrderRoute");
const { authToken } = require("../utils/Middleware");

const router = express.Router();

// Work order routes live in WorkOrderRoute (mounted here to preserve /api/production/work-order/* paths)
router.use('/work-order', workOrderRouter);

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
