const express = require("express");
const { createModule, updateModule, deleteModule, getModules } = require("../controller/ModuleController");
const { authToken } = require("../utils/Middleware");

const router = express.Router();

router.post('/add', authToken, createModule);
router.put('/update/:id', authToken, updateModule);
router.delete('/delete/:id', authToken, deleteModule);
router.get('/all-modules', authToken, getModules);

module.exports = router;
