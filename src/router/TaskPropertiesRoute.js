const express = require("express");
const { GetTaskRemainder, GetTaskPriority, GetTaskStatus, GetTaskMode } = require("../controller/TaskPropertiesController");
const { authToken } = require("../utils/Middleware");
const router = express.Router();

router.get('/get-task-remainder', authToken, GetTaskRemainder);
router.get('/get-task-priority', authToken, GetTaskPriority);
router.get('/get-task-mode', authToken, GetTaskMode);
router.get('/get-task-status', authToken, GetTaskStatus);

module.exports = router;