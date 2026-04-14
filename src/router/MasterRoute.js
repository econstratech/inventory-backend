const express = require("express");
const {
    CreateMasterUOM,
    GetActiveMasterUOM,
    CreateMasterProductType,
    GetActiveMasterProductType,
    CreateMasterProductAttribute,
    UpdateMasterProductAttribute,
    GetActiveMasterProductCategory,
    GetActiveMasterAttribute,
    CreateMasterBrand,
    GetActiveMasterBrand,
    UpdateMasterBrand,
    DeleteMasterBrand,
    GetProductionSteps,
    CreateProductionSteps
} = require("../controller/MasterController");
const { authToken } = require("../utils/Middleware");

const router = express.Router();

// Master UOM routes

// Create new UOM
router.post('/uom', authToken, CreateMasterUOM);
// List of all active UOMs
router.get('/uom/list', authToken, GetActiveMasterUOM);

// Create new product category
// router.post('/product-category', authToken, CreateMasterProductCategory);
// List of all active product categories
router.get('/product-category', authToken, GetActiveMasterProductCategory);

// Create new product type
router.post('/product-type', authToken, CreateMasterProductType);
// List of all active product types
router.get('/product-type/list', authToken, GetActiveMasterProductType);

// Create new master product attribute
router.post('/product-attribute', authToken, CreateMasterProductAttribute);
// Update product attribute by id
router.put('/product-attribute/:id', authToken, UpdateMasterProductAttribute);
// List of all active product attributes
router.get('/product-attribute/list', authToken, GetActiveMasterAttribute);

// Create new master brand
router.post('/brand', authToken, CreateMasterBrand);
// List of all active master brands
router.get('/brand/list', authToken, GetActiveMasterBrand);
// Update master brand by id
router.put('/brand/:id', authToken, UpdateMasterBrand);
// Delete master brand by id
router.delete('/brand/:id', authToken, DeleteMasterBrand);

// Get all production steps
router.get('/production-steps', authToken, GetProductionSteps);
router.post('/production-steps', authToken, CreateProductionSteps);

module.exports = router;
