
const express = require("express");
const { 
    Register, 
    Login, 
    usersList, 
    GetAllUser, 
    GetAllUserCount, 
    GetAllRole, 
    UpdateUser, 
    GetPermission, 
    ChangePassword, 
    ValidateUser, 
    ValidateThirdPartyUser,
    ResetPassword 
} = require("../controller/UserController");
const { authToken } = require("../utils/Middleware");

 
const router = express.Router();
router.post('/register', Register);
router.post('/login', Login);
router.post('/validate', ValidateUser);
router.post('/validate-third-party-user', ValidateThirdPartyUser);
router.post('/reset-password', ResetPassword);
router.get('/all-user',authToken, GetAllUser);
router.get('/list',authToken, usersList);
router.get('/allusercount', authToken,GetAllUserCount);
router.post('/change-password', authToken, ChangePassword)

router.get('/get-role',authToken, GetAllRole);
router.post('/update-user',authToken, UpdateUser);
router.get('/get-permission',authToken, GetPermission);
// Define Routes

module.exports = router;
