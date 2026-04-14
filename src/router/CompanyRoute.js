const express = require("express");
const { authToken } = require("../utils/Middleware");
const { 
     UserListCompanyWise,
     GetActiveCompany, 
     CreateCompany, 
     CretaeUserAPi,
     CreateCompanyProductionFlow,
     GetCompanyProductionFlow,
     GetCompanyProductionSteps,
     CreateCompanyProductionStep,
     DeleteCompanyProductionStep
} = require("../controller/CompanyManagement");
const router = express.Router();


router.get("/user-list/:id", authToken, UserListCompanyWise);
router.get('/active-company', GetActiveCompany)
router.post('/create-company', authToken, CreateCompany)
router.post('/create-user-growthh', CretaeUserAPi);
router.post('/create-company-production-flow', authToken, CreateCompanyProductionFlow);
router.get('/get-company-production-flow/:id', authToken, GetCompanyProductionFlow);
router.get('/production-steps/:id', authToken, GetCompanyProductionSteps);
router.post('/production-steps', authToken, CreateCompanyProductionStep);
router.delete('/production-steps/:stepId', authToken, DeleteCompanyProductionStep);

module.exports = router;