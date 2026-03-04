
const express = require("express");
const { AddTaskTracker, GetAllTask } = require("../controller/TaskTrackerController");
const { authToken } = require("../utils/Middleware");
const { upload } = require("../utils/ImageUpload");
const router = express.Router();

router.post('/add',authToken, upload.single('file'), AddTaskTracker);
router.get("/all-task",authToken,GetAllTask);

module.exports = router;