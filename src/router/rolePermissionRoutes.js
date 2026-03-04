const express = require("express");
const { createRolePermission, getRolePermissions, deleteRolePermission } = require("../controller/RolePermissionController");
const { authToken } = require("../utils/Middleware");

const router = express.Router();

// router.post('/add', authToken, createRolePermission);
// router.get('/:role_id', authToken, getRolePermissions);
// router.delete('/delete/:id', authToken, deleteRolePermission);

module.exports = router;
