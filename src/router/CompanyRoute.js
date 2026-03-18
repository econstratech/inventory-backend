const express = require("express");
const { authToken } = require("../utils/Middleware");
const { 
     UserListCompanyWise,
     GetActiveCompany, 
     CreateCompany, 
     CretaeUserAPi 
} = require("../controller/CompanyManagement");
const router = express.Router();


router.get("/user-list/:id", authToken, UserListCompanyWise);
router.get('/active-company', GetActiveCompany)
router.post('/create-company', authToken, CreateCompany)
router.post('/create-user-growthh', CretaeUserAPi);

module.exports = router;