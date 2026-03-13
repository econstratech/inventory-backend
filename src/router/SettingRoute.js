const express = require("express");
const { authToken } = require("../utils/Middleware");
// const generateInvoicePdf = require('../utils/generateInvoicePdf');
const { 
  AllDepartment, 
  CreateDepartment, 
  DeleteDepartment, 
  UpdateDepartment, 
  HolidayList, 
  CreateHoliday, 
  UpdateHoliday, 
  DeleteHoliday,
  GetOfficeTime, 
  ChangeOfficeTime, 
  GetNotification, 
  EditNotification, 
  GetWhatsappSetting, 
  GeneralSettings, 
  fetchSettings,
  CreateStore, 
  UpdateStore, 
  GetAllStores, 
  DeleteStore, 
  GetBarcode, 
  UpdateBarcode, 
  GetUomList, 
  addUom, 
  UpdateUom, 
  DeleteUom, 
  updateSwitchStatus, 
  updateAllSwitchStatuses, 
  updateAllIniState, 
  SelectStoreById, 
  GetUomById, 
  GetCompanyName, 
  permissionCreate, 
  permissionAll, 
  permissionDelete, 
  updatePermission, 
  addGateway, 
  getAllGateway, 
  deleteGateway, 
  UpdateStockOrder, 
  GetStockOrderSetting, 
  UpdateWhatsappSetting 
} = require("../controller/SettingController");
const router = express.Router();
const { addEwayBillAccount, updateEwayBillAccount, getAllEwayBillAccounts, deleteEwayBillAccount } = require("../controller/EwayBillController");
const { eaddEwayBillAccount, egetAllEwayBillAccounts, edeleteEwayBillAccount } = require("../controller/EinvoiceApiAccount");
const { placeOrder, verifyPayment, getOrderDetails, getOrderItemWiseDetails, markOrderItemDelivered, cancelOrderItem, downloadInvoice, getCancelledOrders, getMonthlyOrderSummary, getCustomerCountByCompany, getOrderStatusSummary, getOrderItemReport } = require("../controller/posController");
const { CompanyStatusChnage } = require("../controller/CompanyManagement");



router.get('/all-department', authToken, AllDepartment);
router.post('/create-department', authToken, CreateDepartment);
router.put('/update-department/:id', authToken, UpdateDepartment);
router.delete('/delete-department/:id', authToken, DeleteDepartment);
router.put('/update-stockorder', authToken, UpdateStockOrder);

//Holiday
router.get('/all-holiday-list', authToken, HolidayList);
router.post('/create-holiday', authToken, CreateHoliday);
router.put('/update-holiday/:id', authToken, UpdateHoliday);
router.delete('/delete-holiday/:id', authToken, DeleteHoliday);


router.get('/office-time', authToken, GetOfficeTime);
router.post('/office-time/change', authToken, ChangeOfficeTime);

//Notification   
router.get('/get-notification', authToken, GetNotification);
router.post('/edit-notification', authToken, EditNotification);

//Whatsapp setting         
router.get('/get-whatsapp-setting', authToken, GetWhatsappSetting);
//General Settings
router.post('/general_settings', authToken, GeneralSettings);
router.get('/general_settings', authToken, fetchSettings);
//store settings
router.post('/warehouse', authToken, CreateStore);
router.get('/warehouse', authToken, GetAllStores);
router.get('/warehouse/:id', authToken, SelectStoreById);
router.put('/warehouse/:id', authToken, UpdateStore);
router.delete('/warehouse/:id', authToken, DeleteStore);

router.get('/getbarcode', authToken, GetBarcode);
router.post('/updatebarcode', authToken, UpdateBarcode);

// Get all master UOM
router.get('/uom', authToken, GetUomList);
// Get master UOM by ID
router.get('/getuombyid/:id', authToken, GetUomById);

router.post('/adduom', authToken, addUom);
router.put('/updateuom/:id', authToken, UpdateUom);
router.delete('/iomdelete/:id', authToken, DeleteUom);
router.post('/updatedapproval',authToken, updateSwitchStatus);
router.post('/update_all',authToken, updateAllSwitchStatuses);
router.get('/get_initial_state',authToken, updateAllIniState);
router.post("/addwaybill", authToken, addEwayBillAccount);
router.post("/updatewaybill/:id", authToken, updateEwayBillAccount);
router.get("/allwaybill", authToken, getAllEwayBillAccounts);
router.delete("/deletewaybill/:id", authToken, deleteEwayBillAccount);

router.post("/eaddwaybill", authToken, eaddEwayBillAccount);

router.get("/eallwaybill", authToken, egetAllEwayBillAccounts);
router.delete("/edeletewaybill/:id", authToken, edeleteEwayBillAccount);
router.get('/getcompany_name/:id', authToken, GetCompanyName);

router.post('/permission/create', authToken, permissionCreate);
router.get('/permission/all', authToken, permissionAll);
router.delete("/permission/delete/:id", authToken, permissionDelete);
router.put("/permission/update/:id", authToken, updatePermission);
router.post("/pos/addgateway", authToken, addGateway);
router.get("/pos/allgateways", authToken, getAllGateway);
router.delete("/pos/deletegateway/:id", authToken, deleteGateway);
router.post("/pos/place-order", authToken, placeOrder);
router.post('/pos/verify-payment', authToken, verifyPayment);
router.get("/pos/order/:order_id", authToken,getOrderDetails);
router.get("/pos/getAllOrdersWithItems", authToken, getOrderItemWiseDetails);
router.put("/pos/mark-delivered", authToken, markOrderItemDelivered);
router.post("/pos/cancel-item", authToken, cancelOrderItem);
router.post('/pos/download-invoice', authToken, downloadInvoice);
router.get('/pos/cancelled-orders', authToken, getCancelledOrders);
router.get("/orders/monthly-summary", authToken, getMonthlyOrderSummary);
router.get("/customers/count", authToken, getCustomerCountByCompany);
router.get('/order-status-summary', authToken,getOrderStatusSummary);
router.get('/order-item-report',authToken, getOrderItemReport);
router.post('/update-status', authToken, CompanyStatusChnage)
router.post("/whatsapp-credential", authToken, UpdateWhatsappSetting)
// Update individual switch statusgit


// Update all switch statuses

  // router.get('/api/roles', async (req, res) => {
  //   try {
  //     const roles = await Role.findAll();
  //     res.json(roles);
  //   } catch (error) {
  //     res.status(500).json({ error: error.message });
  //   }
  // });
  
  // router.get('/api/permissions', async (req, res) => {
  //   try {
  //     const permissions = await Permission.findAll();
  //     res.json(permissions);
  //   } catch (error) {
  //     res.status(500).json({ error: error.message });
  //   }
  // });

module.exports = router;