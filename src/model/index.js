const User = require('./User');
const Company = require('./Company');
const Module = require('./Module');
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const Warehouse = require('./Warehouse');
const ProductAttribute = require('./ProductAttribute')
const ProductAttributeValue = require('./ProductAttributeValue')
const MasterUOM = require('./MasterUOM')
const MasterBrand = require('./MasterBrand')
const Product = require('./Product')
const ProductCategory = require('./ProductCategory')
const FinishedGoods = require('./FinishedGoods')

const TrackProductStock = require('./TrackProductStock');
const MasterProductType = require('./MasterProductType');
const ProductStockEntry = require('./ProductStockEntry');
const Customer = require('./Customer');
const Customerbank = require('./CustomerBank');
const Vendor = require('./Vendor');
const Purchase = require('./Purchase');
const PurchaseProduct = require('./PurchaseProduct');
const Remarks = require('./Remarks');
const Followup = require('./Followup');
const AdvancePayment = require('./AdvancePayment');
const Payment = require('./Payment');
const Bill = require('./Bill');
const BillProduct = require('./BillProduct');
const Recv = require('./Recv');
const RecvProduct = require('./RecvProduct');
const ReceiveProductBatch = require('./ReceiveProductBatch');
const Sale = require('./Sales');
const SalesProduct = require('./SalesProduct');
const SalesProductReceived = require('./SalesProductReceived');
const SalesRemarks = require('./SalesRemarks');
const MasterBOM = require('./MasterBOM');

const StockTransferLog = require('./StockTransferLog');
const StockTransferProducts = require('./StockTransferProducts');
const TrackBatchProductLog = require('./TrackBatchProductLog');
const StockTransferBatch = require('./StockTransferBatch');
const { GeneralSettings } = require('./CompanyModel');
const ProductVariant = require('./ProductVariant');
const ServiceAuditLog = require('./ServiceAuditLog');
const ProductionStepsMaster = require('./ProductionStepsMaster');
const CompanyProductionFlow = require('./CompanyProductionFlow');
const WorkOrder = require('./WorkOrder');
const WorkOrderStep = require('./WorkOrderStep');
const WorkOrderMaterialIssue = require('./WorkOrderMaterialIssue');
const ProductionActivityLog = require('./ProductionActivityLog');
const CompanyProductionStep = require('./CompanyProductionStep');

User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasOne(GeneralSettings, { foreignKey: 'company_id', as: 'generalSettings' });
Company.hasMany(User, { foreignKey: 'company_id', as: 'users' });

Customer.hasOne(Customerbank, { constraints: false, foreignKey: 'customer_id', as: 'bank' });

Product.hasOne(FinishedGoods, { foreignKey: "product_id", as: "FinishedGoodsItem" });
Product.belongsTo(ProductCategory, { foreignKey: 'product_category_id', as: 'productCategory' });

Product.belongsTo(MasterBrand, { foreignKey: 'brand_id', as: 'masterBrand' });
Product.belongsTo(MasterUOM, {foreignKey: 'uom_id', as: 'masterUOM'});

FinishedGoods.belongsTo(Product, {
    foreignKey: "product_id",
    as: "ProductsItem",
});

Product.belongsTo(MasterProductType, {
    foreignKey: 'product_type_id',
    as: 'masterProductType'
});

Product.hasMany(TrackProductStock, {
    foreignKey: 'product_id',
    as: 'TrackProductStock',
});

Product.hasMany(ProductStockEntry, {
    foreignKey: 'product_id',
    as: 'productStockEntries',
});

Product.hasMany(ProductAttributeValue, {
    foreignKey: 'product_id',
    as: 'productAttributeValues',
});

Product.hasMany(RecvProduct, {
    foreignKey: 'product_id',
    as: 'receiveProducts',
});

Product.hasMany(ReceiveProductBatch, {
    foreignKey: 'product_id',
    as: 'batches',
});

Product.hasMany(ProductVariant, {
    foreignKey: 'product_id',
    as: 'productVariants',
});

ProductAttribute.hasMany(ProductAttributeValue, {
    foreignKey: 'product_attribute_id',
    as: 'productAttributeValues',
});

ProductAttributeValue.belongsTo(ProductAttribute, {
    foreignKey: 'product_attribute_id',
    as: 'productAttribute'
});
// ProductStockEntry associations
ProductStockEntry.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
});

ProductStockEntry.belongsTo(Warehouse, {
    foreignKey: 'warehouse_id',
    as: 'warehouse'
});

ProductStockEntry.belongsTo(Company, {
    foreignKey: 'company_id',
    as: 'company'
});

ProductStockEntry.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

ProductStockEntry.belongsTo(ProductVariant, {
    foreignKey: 'product_variant_id',
    as: 'productVariant'
});

ProductVariant.hasMany(ProductStockEntry, { foreignKey: 'product_variant_id', as: 'productStockEntries' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductVariant.belongsTo(MasterUOM, { foreignKey: 'uom_id', as: 'masterUOM' });
ProductVariant.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
ProductVariant.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });


Purchase.hasMany(PurchaseProduct, { foreignKey: 'purchase_id', as:"products"});
Purchase.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
Purchase.hasOne(Remarks, { foreignKey: 'purchase_id', as: 'remarks' });
Remarks.belongsTo(Purchase, { foreignKey: 'purchase_id', as: 'remark' });
Remarks.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Purchase.hasMany(Followup, { foreignKey: 'purchase_id', as: 'followup' });
Purchase.hasOne(AdvancePayment, { foreignKey: 'purchase_id', as: 'advance' });
Purchase.belongsTo(User, { foreignKey: 'user_id', as: 'createdBy' });
Purchase.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Purchase.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
Purchase.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });
Purchase.hasOne(Bill, { foreignKey: "purchase_id", as: "bill" });
Purchase.hasMany(Recv, { foreignKey: 'purchase_id',as:"recv" });
Purchase.hasMany(RecvProduct, { foreignKey: 'purchase_id', as:"receivedProducts" });
Purchase.hasMany(ReceiveProductBatch, { foreignKey: 'purchase_id', as:"batches" });
Purchase.belongsTo(User, { foreignKey: 'management_approved_by', as: 'managementApprovedBy' });
Purchase.belongsTo(User, { foreignKey: 'floor_manager_approved_by', as: 'floorManagerApprovedBy' });
Purchase.belongsTo(User, { foreignKey: 'completed_by', as: 'completedBy' });
Purchase.belongsTo(User, { foreignKey: 'cancelled_by', as: 'cancelledBy' });

PurchaseProduct.belongsTo(Product, { foreignKey: 'product_id' , as: "ProductsItem"});
PurchaseProduct.hasMany(ReceiveProductBatch, { foreignKey: 'purchase_product_id', as: 'batches' });
PurchaseProduct.belongsTo(Purchase, { foreignKey: 'purchase_id', as: 'purchase' });
PurchaseProduct.belongsTo(Purchase, { foreignKey: 'purchase_id' });
PurchaseProduct.belongsTo(ProductVariant, { foreignKey: 'product_variant_id', as: 'productVariant' });

AdvancePayment.belongsTo(Payment, {foreignKey: 'purchase_id', as: 'bal'});

Bill.hasMany(BillProduct, { foreignKey: "bill_id", as: "products" });
BillProduct.belongsTo(Product, { foreignKey: 'product_id', as:"ProductsItem"});
Bill.hasOne(Payment, { foreignKey: "bill_id", as: "allBill" });
Bill.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendorname' });
Bill.belongsTo(Purchase, { foreignKey: "purchase_id", as: "purchase" });


// ReceiveProductBatch associations
RecvProduct.hasMany(ReceiveProductBatch, {
    foreignKey: 'receive_product_id',
    as: 'batches'
});
RecvProduct.belongsTo(Product, { foreignKey: 'product_id' ,as:"product"});
RecvProduct.belongsTo(Purchase, { foreignKey: 'purchase_id' ,as:"purchase"});
RecvProduct.belongsTo(ProductVariant, { foreignKey: 'product_variant_id', as: 'productVariant' });

Recv.hasMany(ReceiveProductBatch, {
    foreignKey: 'bill_id',
    as: 'batches'
});

ReceiveProductBatch.belongsTo(RecvProduct, {
    foreignKey: 'receive_product_id',
    as: 'receiveProduct'
});

ReceiveProductBatch.belongsTo(Recv, {
    foreignKey: 'bill_id',
    as: 'recv'
});

ReceiveProductBatch.belongsTo(Company, {
    foreignKey: 'company_id',
    as: 'company'
});

ReceiveProductBatch.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
});

ReceiveProductBatch.belongsTo(ProductVariant, {
    foreignKey: 'product_variant_id',
    as: 'productVariant'
});
ReceiveProductBatch.belongsTo(Purchase, { foreignKey: 'purchase_id', as: 'purchase' });
ReceiveProductBatch.hasMany(TrackBatchProductLog, { foreignKey: 'receive_product_batch_id', as: 'trackBatchProductLogs' });

// Sales associations
Sale.hasMany(SalesProduct, { foreignKey: 'sales_id', as: 'products' });
Sale.belongsTo(Customer, { foreignKey: 'customer_id',as: 'customer' });
Sale.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
Sale.belongsTo(User, { foreignKey: 'user_id', as: 'createdBy' });
Sale.hasMany(Purchase, { foreignKey: 'sale_id', as: 'purchases' });
SalesProduct.belongsTo(Product, { foreignKey: 'product_id', as: 'productData' });
SalesProduct.belongsTo(ProductVariant, { foreignKey: 'product_variant_id', as: 'productVariant' });
SalesProduct.belongsTo(Sale, { foreignKey: 'sales_id', as: 'sale' });
SalesProduct.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
SalesProduct.hasMany(SalesProductReceived, { foreignKey: 'sales_product_id', as: 'sales_product_received' });

// SalesProductReceived associations
SalesProductReceived.belongsTo(SalesProduct, { foreignKey: 'sales_product_id', as: 'sales_product' });
SalesProductReceived.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
SalesProductReceived.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
SalesProductReceived.belongsTo(Sale, { foreignKey: 'sales_id', as: 'sale' });
SalesProductReceived.belongsTo(User, { foreignKey: 'received_by', as: 'user' });
SalesProductReceived.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
SalesProductReceived.belongsTo(ProductVariant, { foreignKey: 'product_variant_id', as: 'productVariant' });
// SalesRemarks associations
SalesRemarks.belongsTo(Sale, { foreignKey: 'sales_id',as: 'remark' });
SalesRemarks.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
// Purchase.hasMany(Followup, { foreignKey: 'sales_id',as: 'followup' });
// Purchase.hasOne(AdvancePayment, { foreignKey: 'sales_id',as: 'advance' });
// PurchaseRe.hasMany(PurchaseProductRe, { foreignKey: 'sales_re_id' ,as:"productsre"});


Recv.hasMany(RecvProduct, { foreignKey: "bill_id", as: "receivedProducts" });
Recv.belongsTo(User, { foreignKey: "user_id", as: "receivedBy" });
Recv.hasOne(Payment, { foreignKey: "bill_id", as: "allBill" });
Recv.belongsTo(Vendor, { foreignKey: 'vendor_id',as: 'vendorname' });
// PurchaseProductRe.belongsTo(Product, { foreignKey: 'product_id' ,as:"ProductsItemre"});
// Purchase.belongsTo(User, { foreignKey: "user_id", as: "createdByUser" });

// PurchaseProduct.belongsTo(Product, {
//     foreignKey: 'product_id',
//     as: 'product'
//   });

// PurchaseProduct.belongsTo(Purchase, { foreignKey: 'sales_id', as: "purchase" });
// Purchase.belongsTo(CompanyManagementModel, {
//     foreignKey: 'company_id',
//     as: 'companyManagement'
// });

// Vendor.hasOne(Bank, {
//     constraints: false,
//     foreignKey: 'vendor_id',
//     as: 'bank'
// });

// TrackProductStock.belongsTo(CompanyManagementModel, {
//     foreignKey: 'company_id',
//     as: 'companyManagement'
// });

// TrackProductStock.belongsTo(Warehouse, {
//     foreignKey: 'store_id',
//     as: 'Store'
// });

// BOM associations
MasterBOM.belongsTo(Company, {
    foreignKey: 'company_id',
    as: 'company'
});
MasterBOM.belongsTo(Product, {
    foreignKey: 'final_product_id',
    as: 'finalProduct'
});
MasterBOM.belongsTo(Product, {
    foreignKey: 'raw_material_product_id',
    as: 'rawMaterialProduct'
});
MasterBOM.belongsTo(ProductVariant, {
    foreignKey: 'raw_material_variant_id',
    as: 'rawMaterialProductVariant'
});
MasterBOM.belongsTo(ProductVariant, {
    foreignKey: 'final_product_variant_id',
    as: 'finalProductVariant'
});

// TrackBatchProductLog associations
TrackBatchProductLog.belongsTo(ReceiveProductBatch, {
    foreignKey: 'receive_product_batch_id',
    as: 'receiveProductBatch'
});
TrackBatchProductLog.belongsTo(SalesProduct, {
    foreignKey: 'sales_product_id',
    as: 'salesProduct'
});

// StockTransferLog associations
StockTransferLog.hasMany(StockTransferProducts, {
    foreignKey: 'stock_transfer_log_id',
    as: 'stockTransferProducts'
});
StockTransferLog.hasMany(StockTransferBatch, {
    foreignKey: 'stock_transfer_log_id',
    as: 'stockTransferBatches'
});
StockTransferLog.belongsTo(Warehouse, { foreignKey: 'from_warehouse_id', as: 'fromWarehouse' });
StockTransferLog.belongsTo(Warehouse, { foreignKey: 'to_warehouse_id', as: 'toWarehouse' });
StockTransferLog.belongsTo(Sale, { foreignKey: 'sales_id', as: 'sales' });
StockTransferLog.belongsTo(Purchase, { foreignKey: 'purchase_id', as: 'purchase' });
StockTransferLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
StockTransferLog.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

StockTransferProducts.hasMany(StockTransferBatch, { foreignKey: 'stock_transfer_product_id', as: 'stockTransferBatches' });
StockTransferProducts.belongsTo(StockTransferLog, { foreignKey: 'stock_transfer_log_id', as: 'stockTransferLog' });
StockTransferProducts.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

StockTransferBatch.belongsTo(StockTransferLog, { foreignKey: 'stock_transfer_log_id', as: 'stockTransferLog' });
StockTransferBatch.belongsTo(StockTransferProducts, { foreignKey: 'stock_transfer_product_id', as: 'stockTransferProduct' });
StockTransferBatch.belongsTo(ReceiveProductBatch, { foreignKey: 'receive_product_batch_id', as: 'receiveProductBatch' });

ServiceAuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
ServiceAuditLog.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

// RolePermission associations
Permission.belongsTo(Module, { foreignKey: 'module_id', as: 'permission_module' });
RolePermission.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
RolePermission.belongsTo(Permission, { foreignKey: 'permission_id', as: 'permission' });
RolePermission.belongsTo(Module, { foreignKey: 'module_id', as: 'module' });

Role.hasMany(RolePermission, { foreignKey: 'role_id', as: 'rolePermissions' });
Role.belongsToMany(Permission, {
    through: { 
        model: RolePermission, 
        // unique: true 
    },
    foreignKey: 'role_id',
    otherKey: 'permission_id',
    // sourceKey: 'id',
    // targetKey: 'id',
    as: 'permissions'
});
Permission.belongsToMany(Role, {
    through: { model: RolePermission, unique: true },
    foreignKey: 'permission_id',
    otherKey: 'role_id',
    sourceKey: 'id',
    targetKey: 'id',
    as: 'roles'
});
Permission.hasMany(RolePermission, { foreignKey: 'permission_id', as: 'rolePermissions' });
Module.hasMany(RolePermission, { foreignKey: 'module_id', as: 'rolePermissions' });
Module.hasMany(Permission, { foreignKey: 'module_id', as: 'permissions' });

// Production module associations
CompanyProductionStep.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
CompanyProductionStep.belongsTo(ProductionStepsMaster, { foreignKey: 'master_step_id', as: 'masterStep' });
CompanyProductionStep.hasMany(CompanyProductionFlow, { foreignKey: 'step_id', as: 'companyProductionFlows' });
CompanyProductionFlow.belongsTo(CompanyProductionStep, { foreignKey: 'step_id', as: 'step' });

WorkOrder.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
WorkOrder.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
WorkOrder.belongsTo(ProductVariant, { foreignKey: 'final_product_variant_id', as: 'finalProductVariant' });
WorkOrder.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
WorkOrder.belongsTo(CompanyProductionStep, { foreignKey: 'production_step_id', as: 'productionStep' });
WorkOrder.hasMany(WorkOrderStep, { foreignKey: 'wo_id', as: 'workOrderSteps' });
WorkOrder.hasMany(WorkOrderMaterialIssue, { foreignKey: 'wo_id', as: 'workOrderMaterialIssues' });
WorkOrder.belongsTo(User, { foreignKey: 'material_issued_by', as: 'materialIssuedBy' });
WorkOrderStep.belongsTo(WorkOrder, { foreignKey: 'wo_id', as: 'workOrder' });
WorkOrderStep.belongsTo(CompanyProductionStep, { foreignKey: 'step_id', as: 'step' });
WorkOrderStep.belongsTo(MasterUOM, { foreignKey: 'uom_id', as: 'masterUOM' });

WorkOrderMaterialIssue.belongsTo(WorkOrder, { foreignKey: 'wo_id', as: 'workOrder' });
// WorkOrderMaterialIssue.belongsTo(Product, { foreignKey: 'rm_product_id', as: 'rmProduct' });
// WorkOrderMaterialIssue.belongsTo(ProductVariant, { foreignKey: 'rm_product_variant_id', as: 'rmProductVariant' });
// WorkOrderMaterialIssue.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

ProductionActivityLog.belongsTo(WorkOrder, { foreignKey: 'wo_id', as: 'workOrder' });
ProductionActivityLog.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });
ProductionActivityLog.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

module.exports = {
    Module,
    Role,
    Permission,
    User,
    Customer,
    Company,
    Warehouse,
    ProductStockEntry,
    ProductAttribute,
    MasterUOM,
    Product,
    MasterBrand,
    ProductAttributeValue,
    ProductCategory,
    MasterProductType,
    Vendor,
    Purchase,
    PurchaseProduct,
    Remarks,
    Followup,
    AdvancePayment,
    Payment,
    Bill,
    BillProduct,
    Recv,
    RecvProduct,
    ReceiveProductBatch,
    TrackProductStock,
    Sale,
    SalesProduct,
    SalesProductReceived,
    SalesRemarks,
    MasterBOM,
    StockTransferLog,
    StockTransferProducts,
    TrackBatchProductLog,
    StockTransferBatch,
    GeneralSettings,
    ProductVariant,
    ServiceAuditLog,
    RolePermission,
    ProductionStepsMaster,
    CompanyProductionFlow,
    WorkOrder,
    WorkOrderStep,
    WorkOrderMaterialIssue,
    ProductionActivityLog,
    CompanyProductionStep
};