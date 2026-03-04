const express = require("express");
const { createPermission, updatePermission, deletePermission, getPermissions } = require("../controller/PermissionController");
const { authToken } = require("../utils/Middleware");

const router = express.Router();

router.post('/add', authToken, createPermission);
router.put('/update/:id', authToken, updatePermission);
router.delete('/delete/:id', authToken, deletePermission);
router.get('/all-permissions', authToken, getPermissions);

module.exports = router;
