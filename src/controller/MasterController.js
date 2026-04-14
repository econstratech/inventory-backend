const { Op } = require("sequelize");
const { 
    MasterUOM, 
    MasterProductType, 
    ProductAttribute, 
    ProductCategory,
    MasterBrand,
    ProductionStepsMaster,
    CompanyProductionStep
} = require('../model');
const CommonHelper = require("../helpers/commonHelper");

/**
 * Create a new Master UOM record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.CreateMasterUOM = async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.name) {
            return res.status(400).json({ 
                status: false, 
                message: "Name is required" 
            });
        }

        // Check if UOM with same name already exists
        const existingUOM = await MasterUOM.findOne({
            where: {
                name: req.body.name
            }
        });

        if (existingUOM) {
            return res.status(400).json({ 
                status: false, 
                message: "UOM with this name already exists" 
            });
        }

        // Create new Master UOM record
        const masterUOM = await MasterUOM.create({
            name: req.body.name,
            label: req.body.label || null,
            is_active: req.body.is_active !== undefined ? req.body.is_active : true
        });

        return res.status(200).json({ 
            status: true, 
            message: "Master UOM created successfully", 
            data: masterUOM 
        });
    } catch (error) {
        console.error('Error creating Master UOM:', error);
        return res.status(500).json({ 
            status: false, 
            message: "Error creating Master UOM", 
            error: error.message 
        });
    }
};

/**
 * Get a list of all active Master UOM records
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.GetActiveMasterUOM = async (req, res) => {
    try {
        const items = await MasterUOM.findAll({
            where: { is_active: true },
            attributes: ['id', 'name', 'label'],
            order: [['name', 'ASC']],
            raw: true
        });

        return res.status(200).json({
            status: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Failed to fetch active Master UOM records',
            error: error.message
        });
    }
};

/**
 * Create a new Master Product Type record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.CreateMasterProductType = async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.name) {
            return res.status(400).json({ 
                status: false, 
                message: "Name is required",
            });
        }

        // Check if Product Type with same name already exists
        const existingProductType = await MasterProductType.findOne({
            attributes: ['id', 'name'],
            raw: true,
            where: {
                name: req.body.name
            }
        });

        // If product type with same name already exists, return error
        if (existingProductType) {
            return res.status(400).json({
                status: false,
                message: "Product Type with this name already exists",
            });
        }

        // Create new Master Product Type record
        await MasterProductType.create({
            name: req.body.name,
            is_active: req.body.is_active !== undefined ? req.body.is_active : 1
        });

        // Return success response
        return res.status(200).json({
            status: true,
            message: "Master Product Type created successfully",
        });
    } catch (error) {
        console.error('Error creating Master Product Type:', error);
        return res.status(400).json({ 
            status: false, 
            message: "Error creating Master Product Type", 
            error: error.message 
        });
    }
};

/**
 * Get list of all active product types
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.GetActiveMasterProductType = async (req, res) => {
    try {
        const items = await MasterProductType.findAll({
            where: { is_active: 1 },
            attributes: ['id', 'name'],
            order: [['name', 'ASC']],
            raw: true
        });

        return res.status(200).json({
            status: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Failed to fetch active product types',
            error: error.message
        });
    }
}

/**
 * Create a new Master Product Attribute record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.CreateMasterProductAttribute = async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.name) {
            return res.status(400).json({ 
                status: false, 
                message: "Name is required",
            });
        }

        // Check if Product Type with same name already exists
        const existingProductType = await ProductAttribute.findOne({
            attributes: ['id', 'name'],
            raw: true,
            where: {
                name: req.body.name
            }
        });

        // If product type with same name already exists, return error
        if (existingProductType) {
            return res.status(400).json({
                status: false,
                message: "Product Type with this name already exists",
            });
        }

        // Create new Master Product Attribute record
        await ProductAttribute.create({
            name: req.body.name,
            company_id: req.user.company_id ?? null, 
            is_required: req.body.is_required !== undefined ? req.body.is_required : 0,
            is_active: req.body.is_active !== undefined ? req.body.is_active : 1,
            is_filterable: req.body.is_filterable !== undefined ? req.body.is_filterable : 0,
            field_type: req.body.field_type !== undefined ? req.body.field_type : null,
        });

        // Return success response
        return res.status(200).json({
            status: true,
            message: "Master Product Attribute is created successfully",
        });
    } catch (error) {
        console.error('Error creating Master Product Attribute:', error);
        return res.status(400).json({ 
            status: false, 
            message: "Error creating Master Product Attribute", 
            error: error.message 
        });
    }
};

/**
 * Update a product attribute by id.
 * PUT /api/master/product-attribute/:id
 * Payload: name, is_required, field_type (all optional; only provided fields are updated)
 */
exports.UpdateMasterProductAttribute = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, is_required, field_type } = req.body;

        const attribute = await ProductAttribute.findByPk(id);
        if (!attribute) {
            return res.status(404).json({
                status: false,
                message: "Product attribute not found",
            });
        }

        if (name !== undefined) {
            const existingByName = await ProductAttribute.findOne({
                where: {
                    name,
                    id: { [Op.ne]: id },
                    ...(attribute.company_id != null && { company_id: attribute.company_id }),
                },
            });
            if (existingByName) {
                return res.status(400).json({
                    status: false,
                    message: "Another product attribute with this name already exists",
                });
            }
        }

        const updatePayload = {};
        if (name !== undefined) updatePayload.name = name;
        if (is_required !== undefined) updatePayload.is_required = is_required;
        if (field_type !== undefined) updatePayload.field_type = field_type;

        if (Object.keys(updatePayload).length === 0) {
            return res.status(400).json({
                status: false,
                message: "At least one of name, is_required, or field_type is required",
            });
        }

        await ProductAttribute.update(updatePayload, { where: { id } });

        return res.status(200).json({
            status: true,
            message: "Product attribute updated successfully",
        });
    } catch (error) {
        console.error("Error updating product attribute:", error);
        return res.status(500).json({
            status: false,
            message: "Error updating product attribute",
            error: error.message,
        });
    }
};

/**
 * Get list of all active product attributes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.GetActiveMasterAttribute = async (req, res) => {
    try {
        const where = { is_active: 1 };

        // If company id is provided then apply filter
        if (req.query.company_id) {
            where[Op.or] = [
              { company_id: req.query.company_id },
              { company_id: { [Op.is]: null } }
            ];
        } else {
            where.company_id = { [Op.is]: null };
        }

        // Get list of all active product attributes
        const items = await ProductAttribute.findAll({
            where,
            attributes: ['id', 'name', 'is_required', 'is_filterable', 'field_type'],
            order: [['id', 'DESC']],
            include: [
                {
                    association: 'productAttributeValues',
                    attributes: ['id', 'value'],
                }
            ]
        });

        return res.status(200).json({
            status: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Failed to fetch active product attributes',
            error: error.message
        });
    }
}

/**
 * Get list of all active product categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.GetActiveMasterProductCategory = async (req, res) => {
    try {
        // pagination params
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        // base where
        const where = {
            company_id: req.user.company_id
        };

        // if searchkey is provided then add it to the where clause
        if (req.query.searchkey) {
            where.title = { [Op.like]: `%${req.query.searchkey.trim()}%` };
        }
        // if status is provided then add it to the where clause
        if (req.query.status) {
            where.status = req.query.status;
        }

        // get list of all active product categories
        const productCategories = await ProductCategory.findAndCountAll({
            attributes: ['id', 'title', 'status', 'created_at', 'updated_at'],
            where,
            order: [['title', 'ASC']],
            distinct: true,
            raw: true,
            limit,
            offset,
        });

        // Get paginated data
        const paginatedProductCategoryData = CommonHelper.paginate(productCategories, page, limit);

        // return response
        return res.status(200).json({
            status: true,
            message: "Product Categories fetched successfully",
            data: paginatedProductCategoryData
        });
    } catch (error) {
        console.error('Error fetching active product categories:', error);
        return res.status(500).json({
            status: false,
            message: 'Failed to fetch active product categories', 
            error: error.message
        });
    }
}

/**
 * Create a new Master Brand record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.CreateMasterBrand = async (req, res) => {
    try {
        // Validate required fields
        const { name, description } = req.body;

        // Check if Master Brand with same name already exists
        const existingMasterBrand = await MasterBrand.findOne({
            attributes: ['id'],
            raw: true,
            where: {
                name,
                company_id: req.user.company_id,
            },
        });

        // If Master Brand with same name already exists, return error
        if (existingMasterBrand) {
            return res.status(400).json({
                status: false,
                message: "Master Brand with this name already exists",
            });
        }

        // Create new Master Brand record
        await MasterBrand.create({
            name: name.trim(),
            description: description.trim() ?? null,
            company_id: req.user.company_id,
        });

        // Return success response
        return res.status(200).json({ status: true, message: "Master Brand created successfully" });
    } catch (error) {
        console.error('Error creating Master Brand:', error);
        return res.status(500).json({ 
            status: false, 
            message: "Error creating Master Brand", 
            error: error.message 
        });
    }
}

/**
 * Get list of all active master brands
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.GetActiveMasterBrand = async (req, res) => {
    try {
        const { brandName } = req.query;

        // base where
        const where = { company_id: req.user.company_id };

        // if brand name is provided then add it to the where clause
        if (brandName) {
            where.name = { [Op.like]: `%${brandName}%` };
        }
        // Get list of all active master brands
        const masterBrands = await MasterBrand.findAll({
            attributes: ['id', 'name', 'description'],
            where,
            order: [['name', 'ASC']],
            raw: true
        });

        // Return success response
        return res.status(200).json({
            status: true,
            message: "Master Brands fetched successfully",
            data: masterBrands
        });
    } catch (error) {
        console.error('Error fetching active master brands:', error);
        return res.status(500).json({
            status: false,
            message: 'Failed to fetch active master brands',
            error: error.message
        });
    }
}

/**
 * Update a master brand by id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.UpdateMasterBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        // check if master brand with same name already exists
        const masterBrand = await MasterBrand.findOne({
            attributes: ['id'],
            raw: true,
            where: { id: id, company_id: req.user.company_id },
        });
        // if master brand with same name already exists, return error
        if (!masterBrand) {
            return res.status(400).json({
                status: false,
                message: "Master Brand not found",
            });
        }
        // update master brand
        await MasterBrand.update({ name, description }, { where: { id } });

        // return success response
        return res.status(200).json({ status: true, message: "Master Brand updated successfully" });
    } catch (error) {
        console.error('Error updating Master Brand:', error);
        return res.status(500).json({
            status: false,
            message: "Error updating Master Brand",
            error: error.message
        });
    }
}

/**
 * Delete a master brand by id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.DeleteMasterBrand = async (req, res) => {
    try {
        const { id } = req.params;
        // check if master brand with same name already exists
        const masterBrand = await MasterBrand.findOne({
            attributes: ['id'],
            raw: true,
            where: { id: id, company_id: req.user.company_id },
        });
        // if master brand with same name already exists, return error
        if (!masterBrand) {
            return res.status(404).json({
                status: false,
                message: "Master Brand not found",
            });
        }
        // delete master brand
        await MasterBrand.destroy({ where: { id } });
        // return success response
        return res.status(200).json({ status: true, message: "Master Brand deleted successfully" });
    } catch (error) {
        console.error('Error deleting Master Brand:', error);
        return res.status(500).json({
            status: false,
            message: "Error deleting Master Brand",
            error: error.message
        });
    }
}

/**
 * Get all production steps
 * @param {Object} req - request object
 * @param {Object} res - response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.GetProductionSteps = async (req, res) => {
    try {
        // get all production steps
        const productionSteps = await ProductionStepsMaster.findAll({
            where: { is_active: 1 },
            attributes: ['id', 'name', 'description', 'is_active'],
            order: [['id', 'ASC']],
            raw: true
        });

        // return success response
        return res.status(200).json({
            status: true,
            message: 'Production steps fetched successfully',
            data: productionSteps
        });
    } catch (error) {
        console.log("Error while getting production steps:", error);
        return res.status(400).json({ status: false, message: error })
    }
}

/**
 * Create a new production step
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.CreateProductionSteps = async (req, res) => {
    try {
        const stepName = req.body.name.trim();
        const stepDescription = req.body.description.trim() ?? null;

        // Check if production step with same name already exists
        const existingProductionStep = await ProductionStepsMaster.findOne({
            attributes: ['id'],
            raw: true,
            where: { name: stepName },
        });
        // If production step with same name already exists, return error
        if (existingProductionStep) {
            return res.status(400).json({ status: false, message: "Production step with this name already exists" });
        }
        // create a new production step
        const productionStep = await ProductionStepsMaster.create({ name: stepName, description: stepDescription, is_active: 1 });

        // Create a new company production step
        await CompanyProductionStep.create({
            company_id: req.user.company_id,
            master_step_id: productionStep.id,
            name: stepName,
            description: stepDescription,
            is_active: 1,
        });
        // return success response
        return res.status(200).json({ status: true, message: "Production step created successfully" });
    } catch (error) {
        console.error('Error creating production step:', error);
        return res.status(500).json({ status: false, message: "Error creating production step", error: error.message });
    }
}