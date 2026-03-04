
const express = require("express");
const { authToken } = require("../utils/Middleware");
const { GetRole, ShowPermission, CreateRole, UpdateRole, DeleteRole } = require("../controller/RolePermissionController");

const router = express.Router();


router.get("/get-role", authToken, GetRole)
// router.post('/register', Register);
// router.post('/login', Login);
router.get('/all-permission', authToken, ShowPermission);
router.post('/create-role', authToken, CreateRole)
router.put('/role-update/:id', authToken, UpdateRole)
router.delete('/delete-role/:id', authToken, DeleteRole)



module.exports = router;