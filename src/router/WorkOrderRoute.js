const express = require("express");
const {
    CreateWorkOrder,
    CreateMultipleWorkOrders,
    GetAllWorkOrders,
    DeleteWorkOrder,
    GetMaterialListWithoutBOMForWorkOrder,
    GetBOMListForWorkOrder,
    CreateMaterialIssue,
    DeleteMaterialIssue,
    CompleteMaterialIssue,
    SaveProductionData,
    GetWorkOrderById,
    UpdateWorkOrder,
    CancelWorkOrder,
    CompleteProduction,
    ExportWorkOrders,
    GetWorkOrderStats,
    CreateMaterialMapping,
    GetAllMaterialMappings,
    GetMaterialMappingById,
    UpdateMaterialMapping,
    DeleteMaterialMapping,
} = require("../controller/WorkOrderController");
const { authToken } = require("../utils/Middleware");

const router = express.Router();

router.post('/create', authToken, CreateWorkOrder);
router.post('/create-multiple', authToken, CreateMultipleWorkOrders);
router.get('/stats', authToken, GetWorkOrderStats);
router.get('/export', authToken, ExportWorkOrders);
router.get('/list', authToken, GetAllWorkOrders);
router.get('/:wo_id', authToken, GetWorkOrderById);
router.put('/update/:wo_id', authToken, UpdateWorkOrder);
router.put('/cancel/:wo_id', authToken, CancelWorkOrder);
router.delete('/delete/:id', authToken, DeleteWorkOrder);

router.get('/materials-list/:wo_id', authToken, GetMaterialListWithoutBOMForWorkOrder);
router.get('/bom-list/:wo_id', authToken, GetBOMListForWorkOrder);
router.post('/material-issue', authToken, CreateMaterialIssue);
router.delete('/material-issue/:id', authToken, DeleteMaterialIssue);
router.post('/material-issue-complete', authToken, CompleteMaterialIssue);
router.post('/save-production-data', authToken, SaveProductionData);
router.post('/complete-production', authToken, CompleteProduction);

// Work order material mapping (FG ↔ RM mapping)
router.post('/material-mapping/create', authToken, CreateMaterialMapping);
router.get('/material-mapping/list', authToken, GetAllMaterialMappings);
router.get('/material-mapping/:id', authToken, GetMaterialMappingById);
router.put('/material-mapping/update/:id', authToken, UpdateMaterialMapping);
router.delete('/material-mapping/delete/:id', authToken, DeleteMaterialMapping);

module.exports = router;
