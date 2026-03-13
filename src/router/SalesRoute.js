
const express = require("express");
const { 
    AddSellQuotation, 
    GetAllPurchase, 
    DeletePurchase, 
    updateSalesQuotation, 
    getSalesQuotation, 
    AddPurchaseadditi, 
    getPurchaseaddi, 
    getPurchasecompare, 
    StatusUpdate, 
    GetAllPurchaseOrder, 
    pendingApproval, 
    getPurchasecompareManagment, 
    insertRemarks, 
    getManagmentReview, 
    insertAdvancePayment, 
    PaymentRecords, 
    StatusUpdateFromAdmin, 
    SendMailByPO, 
    SendMailUpdate, 
    insertfollowup, 
    AddRecv, 
    getRecv, 
    GetAllPurchaseOrderRecv, 
    GetAllPurchaseOrderFolloup, 
    GetAllPurchaseOrderDone, 
    GetAllPurchaseReject, 
    GetAllPurchaseRejectcount, 
    GetAllPurchasedonecount, 
    GetAllPurchaseRrfq, 
    GetAllPurchaseapp, 
    GetAllPurchasOconfir, 
    GetAllBillcreated, 
    GetDoneVendorwise, 
    getPatmentData, 
    generatePDFForvendor, 
    GetProducts, 
    UploadPo, 
    AddRevisedPurchase, 
    GetAllPurchaseOrderCompare, 
    GetAllCustomerCount, 
    GetAllSalesQuotetion, 
    GetAllSalesReview, 
    GetAllSalesreject, 
    GetAllWorkOrder, 
    dispatchGetWorkOrder, 
    getInvoiceById, 
    IsInvoice, 
    stockUpdate, 
    deductStock, 
    GetAllPurchaseOrderforFloormanagment, 
    GetAllWorkOrderForReport, 
    getSalesLedger, 
    salesLedger, 
    GetAlldispatchlist, 
    dispatchProduct, 
    GetAllDdone, 
    getProductsByPurchase,
    ApprovedByManagement,
    RejectedByManagement,
    receiveSalesProduct,
    finalDispatch,
    getAvailableBatchesForSaleOrder,
    fetchSalesDetails,
    GetSaleOrderRemarks
} = require("../controller/SalesController");

const { authToken } = require("../utils/Middleware");
const { upload, pdfUpload } = require("../utils/ImageUpload");

const router = express.Router();

router.post('/add', authToken, AddSellQuotation);
router.post('/add_addi', authToken, AddPurchaseadditi);
router.get('/get_addi/:id/:venid', authToken, getPurchaseaddi);
router.get("/getPurchasecompare/:id", authToken, getPurchasecompare);
router.get("/getPurchasecompareManagment/:id", authToken, getPurchasecompareManagment);
router.get("/getproductsbypurchase/:id", authToken, getProductsByPurchase);

router.get("/all-sales", authToken, GetAllPurchase);
router.get("/all-sale-quotation", authToken, GetAllSalesQuotetion);
router.get("/all-sales-quotetionreview", authToken, GetAllSalesReview);
router.get("/all-sales-quotetionreject", authToken, GetAllSalesreject);
router.put("/approved-by-management/:id", authToken, ApprovedByManagement);
router.put("/rejected-by-management/:id", authToken, RejectedByManagement);


router.get("/all-rejected-purchase", authToken, GetAllPurchaseReject);
router.get("/sales/:id", authToken, getSalesQuotation);
router.get("/sale-order-remarks/:id", authToken, GetSaleOrderRemarks);
router.get("/fetch-details", authToken, fetchSalesDetails);
router.get("/available-batches/:id", authToken, getAvailableBatchesForSaleOrder);
router.put("/update/:id", authToken, updateSalesQuotation);
router.delete('/:id', DeletePurchase);
router.put("/statuschange/:id/:sid", authToken, StatusUpdate);
router.put("/dispatch-product/:pid/:sid/:spid", authToken, dispatchProduct);
router.post("/sales-product-received", authToken, receiveSalesProduct);
router.put("/final-dispatch/:id", authToken, finalDispatch);
router.get("/getallpurchaseorder", authToken, GetAllPurchaseOrder);
router.get("/getallpurchaseorderdone", authToken, GetAllPurchaseOrderDone);
router.get("/generatePDFForvendor/:id", authToken, generatePDFForvendor);
router.get("/getallpurchaseorderfollowup", authToken, GetAllPurchaseOrderFolloup);
router.get("/getallpurchaseorderforfloor", authToken, GetAllPurchaseOrderforFloormanagment);
router.get("/getallpurchaseorderforrecv", authToken, GetAllPurchaseOrderRecv);
router.get("/pending-approval", authToken, pendingApproval);

router.post('/addremarks', authToken, insertRemarks);
router.get("/getremarks/:id", authToken, getManagmentReview);
router.post('/insertadvancepayment', authToken, insertAdvancePayment);
router.get('/getproducts/:id', authToken, GetProducts);
router.get('/getproductscompare/:id', authToken, GetAllPurchaseOrderCompare);

router.post('/payment/:id', authToken, PaymentRecords);
router.post('/emailsend/:id', authToken, SendMailByPO);
router.post('/emailsendupdate/:id', authToken, SendMailUpdate);
router.post('/addfollowup', authToken, insertfollowup);
router.post('/recv/new/:id', authToken, AddRecv);
router.put("/statuschangefromadmin/:id/:sid", authToken, StatusUpdateFromAdmin);
router.get('/recv/:id', authToken, getRecv);
router.get("/reject_count", authToken, GetAllPurchaseRejectcount);
router.get("/done_count", authToken, GetAllPurchasedonecount);
router.get("/rfq_count", authToken, GetAllPurchaseRrfq);
router.get("/appro", authToken, GetAllPurchaseapp);
router.get("/approcon", authToken, GetAllPurchasOconfir);
router.get("/apprbillcre", authToken, GetAllBillcreated);
router.get("/vendordonecount", authToken, GetDoneVendorwise);
router.get("/getperyrwise", authToken, getPatmentData);
router.get("/allusercount", authToken, GetAllCustomerCount);

router.post('/uploadpo/:id', authToken, pdfUpload.single('file'), UploadPo);
router.post('/revised/:salesid', authToken, AddRevisedPurchase);


router.get("/production/allworkorder", authToken, GetAllWorkOrder);
router.get("/production/GetAllDdone", authToken, GetAllDdone);
router.get("/production/allworkorderdispatch", authToken, GetAlldispatchlist);
router.post("/production/dispatch/", authToken, dispatchGetWorkOrder);
router.post("/production/is_invoice", authToken, IsInvoice);
router.get("/invoice/:id", authToken, getInvoiceById);
router.get("/dispatch/stockUpdate/:pid/:sid", authToken, stockUpdate);
router.post("/dispatch/deductStock", authToken, deductStock);
router.get("/dispatch/allworkorderdispatchfor_report", authToken, GetAllWorkOrderForReport);
router.post("/salesLedger", authToken, salesLedger);

module.exports = router;