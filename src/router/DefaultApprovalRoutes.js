
const express = require("express");
const { updateSwitchStatus, updateAllSwitchStatuses } = require("../controller/DefaultApprovalController");
const { authToken } = require("../utils/Middleware");
const router = express.Router();
// Update individual switch status
router.post('/update',authToken, updateSwitchStatus);

// Update all switch statuses
router.post('/update_all',authToken, updateAllSwitchStatuses);

module.exports = router;
