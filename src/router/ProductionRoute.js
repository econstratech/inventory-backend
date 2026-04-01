const express = require("express");
const { 
    CreateWorkOrder,
    GetAllWorkOrders
} = require("../controller/ProductionController");
const { authToken } = require("../utils/Middleware");
// const uploadsproduction  = require("../utils/uploads.production");


const router = express.Router();

router.post('/work-order/create', authToken, CreateWorkOrder);
router.get('/work-order/list', authToken, GetAllWorkOrders);


module.exports = router;