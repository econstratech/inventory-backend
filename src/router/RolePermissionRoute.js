
const express = require("express");
const { authToken } = require("../utils/Middleware");
const { 
    GetAllRoles,
    createPermission,
    updatePermission,
    deletePermission,
    GetAllPermissions,
    CreateRole, 
    UpdateRole, 
    DeleteRole,
    assignPermissionsToRole
} = require("../controller/RolePermissionController");

const router = express.Router();

router.get('/get-all-roles',authToken, GetAllRoles);
router.post('/create-role',authToken, CreateRole);
router.post('/update-role/:id',authToken, UpdateRole);
router.delete('/delete-role/:id',authToken, DeleteRole);

router.post('/create-permission', authToken, createPermission);
router.put('/update-permission/:id', authToken, updatePermission);
router.delete('/delete-permission/:id', authToken, deletePermission);
router.get('/get-all-permissions', authToken, GetAllPermissions);

router.post('/assign-permissions-to-role/:role_id', authToken, assignPermissionsToRole);



module.exports = router;