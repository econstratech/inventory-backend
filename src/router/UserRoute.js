
const express = require("express");
const { 
    Register, 
    Login, 
    usersList, 
    GetAllUser,
    UpdateUserRoles,
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
// router.get('/allusercount', authToken,GetAllUserCount);
router.post('/change-password', authToken, ChangePassword)
router.post('/update-user-roles',authToken, UpdateUserRoles);


// Define Routes

module.exports = router;
