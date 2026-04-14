const express = require("express");
const { 
    CreateWorkOrder,
    GetAllWorkOrders,
    DeleteWorkOrder,
    GetBOMListForWorkOrder,
    CreateMaterialIssue,
    CompleteMaterialIssue,
    SaveProductionData,
    GetWorkOrderById,
    UpdateWorkOrder,
    CompleteProduction
} = require("../controller/ProductionController");
const { authToken } = require("../utils/Middleware");
// const uploadsproduction  = require("../utils/uploads.production");


const router = express.Router();

router.post('/work-order/create', authToken, CreateWorkOrder);
router.get('/work-order/list', authToken, GetAllWorkOrders);
router.get('/work-order/:wo_id', authToken, GetWorkOrderById);
router.put('/work-order/update/:wo_id', authToken, UpdateWorkOrder);
router.delete('/work-order/delete/:id', authToken, DeleteWorkOrder);

router.get('/work-order/bom-list/:wo_id', authToken, GetBOMListForWorkOrder);
router.post('/work-order/material-issue', authToken, CreateMaterialIssue);
router.post('/work-order/material-issue-complete', authToken, CompleteMaterialIssue);
router.post('/work-order/save-production-data', authToken, SaveProductionData);
router.post('/work-order/complete-production', authToken, CompleteProduction);

module.exports = router;