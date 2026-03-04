const express = require("express");
const { createRole, updateRole, deleteRole, getRoles } = require("../controller/RoleController");
const { authToken } = require("../utils/Middleware");

const router = express.Router();

router.post('/add', authToken, createRole);
router.put('/update/:id', authToken, updateRole);
router.delete('/delete/:id', authToken, deleteRole);
router.get('/all-roles', authToken, getRoles);

module.exports = router;
