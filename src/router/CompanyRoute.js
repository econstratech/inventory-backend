const express = require("express");
const { authToken } = require("../utils/Middleware");
const {  UserListCompanyWise,ExtraTableData,RenewUpdate, GetActiveCompany, CreateCompany, CretaeUserAPi } = require("../controller/CompanyManagement");
const router = express.Router();

// router.get('/get-company-detail', authToken, companyDetails);
// router.get("/activity-log/:id", authToken, ActivityLog);
router.get("/user-list/:id", authToken, UserListCompanyWise);
router.get('/active-company', GetActiveCompany)
router.get("/company-info/:id", authToken, ExtraTableData)
router.put("/company-update/:id", authToken, RenewUpdate)
router.post('/create-company', authToken, CreateCompany)
router.post('/create-user-growthh', CretaeUserAPi);

module.exports = router;