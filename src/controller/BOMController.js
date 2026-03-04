const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { MasterBOM, Product, ProductStockEntry } = require('../model');
const { Op, QueryTypes } = require('sequelize');
const sequelize = require('../database/db-connection');
const CommonHelper = require('../helpers/commonHelper');
const { uploadDir } = require('../utils/handlersbluk');

/**
 * Generate unique BOM number
 * Format: BOM + 6-digit number (e.g., BOM098734)
 * @returns {Promise<string>} Unique BOM number
 */
const generateUniqueBOMNumber = async () => {
    let bomNumber;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop

    while (!isUnique && attempts < maxAttempts) {
        // Generate 6-digit number with leading zeros
        const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
        bomNumber = `BOM${randomDigits}`;
        
        // Check if BOM number already exists
        const existingBOM = await MasterBOM.findOne({ 
            where: { bom_no: bomNumber } 
        });
        
        if (!existingBOM) {
            isUnique = true;
        }
        attempts++;
    }

    if (!isUnique) {
        throw new Error('Unable to generate unique BOM number after multiple attempts');
    }

    return bomNumber;
};

const validateBOMItem = (user, bomItem) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { final_product_id, raw_material_product_id, quantity } = bomItem;
        
            // Validate required fields
            if (!final_product_id || !raw_material_product_id || quantity === undefined || quantity === null) {
                return res.status(400).json({
                    status: false,
                    message: "final_product_id, raw_material_product_id, and quantity are required"
                });
            }
    
            // Validate quantity is positive
            if (quantity <= 0) {
                return res.status(400).json({
                    status: false,
                    message: "quantity must be greater than 0"
                });
            }
    
            // Validate that products exist and belong to the company
            const [finalProduct, rawMaterialProduct] = await Promise.all([
                Product.findOne({
                    where: {
                        id: final_product_id,
                        company_id: user.company_id
                    }
                }),
                Product.findOne({
                    where: {
                        id: raw_material_product_id,
                        company_id: user.company_id
                    }
                })
            ]);
    
            if (!finalProduct) {
                return res.status(404).json({
                    status: false,
                    message: "Final product not found or does not belong to your company"
                });
            }
    
            if (!rawMaterialProduct) {
                return res.status(404).json({
                    status: false,
                    message: "Raw material product not found or does not belong to your company"
                });
            }
            resolve(true);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Add a new BOM (Bill of Materials) record
 * @param {object} req - The request object
 * @param {object} req.body - The request body
 * @param {number} req.body.final_product_id - Final product ID
 * @param {number} req.body.raw_material_product_id - Raw material product ID
 * @param {number} req.body.quantity - Quantity required
 * @param {object} req.user - Authenticated user object
 * @param {number} req.user.company_id - Company ID from authenticated user
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */
exports.AddBOM = async (req, res) => {    
    try {
        const validationResults = await Promise.all(req.body.map(bomItem => validateBOMItem(req.user, bomItem)));

        if (validationResults.some(result => !result)) {
            return res.status(400).json({
                status: false,
                message: "Invalid BOM items"
            });
        }

        // Generate unique BOM number
        const bomNo = await generateUniqueBOMNumber();

        // Create BOM records
        await MasterBOM.bulkCreate(
            req.body.map(bomItem => ({
                company_id: req.user.company_id,
                final_product_id: bomItem.final_product_id,
                raw_material_product_id: bomItem.raw_material_product_id,
                bom_no: bomNo,
                quantity: bomItem.quantity
            })
        ));

        // return the created BOM data
        return res.status(201).json({
            status: true,
            message: "BOM created successfully"
        });

    } catch (error) {
        console.error("Add BOM error:", error);
        return res.status(500).json({
            status: false,
            message: "Error creating BOM",
            error: error.message
        });
    }
};

/**
 * Parse CSV file to array of rows
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<object[]>} Array of row objects (keys = header names)
 */
const parseCSVFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => rows.push(row))
            .on('end', () => resolve(rows))
            .on('error', reject);
    });
};

/**
 * Bulk upload BOM records from CSV file
 * CSV headers: "Final Product Code", "Raw Material Product Code", "Quantity"
 * Maps to fg_product_code, rm_product_code, quantity. Validates product codes exist in Product model, then bulkCreates into MasterBOM.
 * @param {object} req - The request object
 * @param {object} req.file - Multer file object (file.filename)
 * @param {number} req.user.company_id - Company ID from authenticated user
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */
exports.BulkUploadBOM = async (req, res) => {
    let filePath = null;
    const transaction = await sequelize.transaction();

    try {
        if (!req.file?.filename) {
            return res.status(400).json({
                status: false,
                message: "No file uploaded."
            });
        }

        const company_id = req.user.company_id;
        filePath = path.join(uploadDir, req.file.filename);

        if (path.extname(req.file.filename).toLowerCase() !== '.csv') {
            fs.unlinkSync(filePath);
            return res.status(400).json({
                status: false,
                message: "Only CSV files allowed."
            });
        }

        // Parse CSV file to array of rows
        const rows = await parseCSVFile(filePath);

        const parsed = [];
        const allProductCodes = new Set();

        for (const row of rows) {
            const fg = row["Final Product Code"]?.trim();
            const rm = row["Raw Material Product Code"]?.trim();
            const qty = parseInt(row["Quantity"], 10);

            if (!fg || !rm || isNaN(qty) || qty < 1) continue;

            parsed.push({ fg, rm, qty, _row: row });
            allProductCodes.add(fg);
            allProductCodes.add(rm);
        }

        if (!parsed.length) {
            throw new Error("No valid rows found.");
        }

        // Get all products by product codes
        const products = await Product.findAll({
            where: {
                company_id,
                product_code: [...allProductCodes],
                status: 1
            },
            attributes: ['id', 'product_code'],
            raw: true,
        });

        const productMap = {};
        products.forEach(p => {
            productMap[p.product_code] = p.id;
        });

        const validRecords = [];
        const errors = [];

        for (const item of parsed) {
            const fgId = productMap[item.fg];
            const rmId = productMap[item.rm];

            if (!fgId) {
                errors.push({ row: item._row, reason: `Final product not found: ${item.fg}` });
                continue;
            }

            if (!rmId) {
                errors.push({ row: item._row, reason: `Raw material not found: ${item.rm}` });
                continue;
            }

            validRecords.push({
                company_id,
                final_product_id: fgId,
                raw_material_product_id: rmId,
                quantity: item.qty
            });
        }

        // Generate unique BOM reference number
        const bomReferenceNumber = await generateUniqueBOMNumber();

        // Batch BOM number generation
        for (const record of validRecords) {
            record.bom_no = bomReferenceNumber;
        }

        await MasterBOM.bulkCreate(validRecords, { transaction });

        await transaction.commit();
        fs.unlinkSync(filePath);

        return res.status(201).json({
            status: true,
            created: validRecords.length,
            errors
        });

    } catch (error) {
        await transaction.rollback();
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

/**
 * Update BOM quantity by ID
 * Only quantity field can be updated
 * @param {object} req - The request object
 * @param {object} req.params - The request parameters
 * @param {number} req.params.id - BOM ID
 * @param {object} req.body - The request body
 * @param {number} req.body.quantity - New quantity value
 * @param {object} req.user - Authenticated user object
 * @param {number} req.user.company_id - Company ID from authenticated user
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */
exports.UpdateBOM = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        // Validate quantity is provided
        if (quantity === undefined || quantity === null) {
            return res.status(400).json({
                status: false,
                message: "quantity is required"
            });
        }

        // Validate quantity is positive
        if (quantity <= 0) {
            return res.status(400).json({
                status: false,
                message: "quantity must be greater than 0"
            });
        }

        // Find BOM by ID and company_id
        const bom = await MasterBOM.findOne({
            attributes: ['id'],
            raw: true,
            where: { id: id }
        });

        // if BOM not found, return 404
        if (!bom) {
            return res.status(404).json({
                status: false,
                message: "BOM not found or does not belong to your company"
            });
        }

        // Update only the quantity field
        await MasterBOM.update(
            { quantity: quantity },
            {
                where: { id: id }
            }
        );

        // Fetch updated BOM data
        // const updatedBOM = await MasterBOM.findOne({
        //     where: {
        //         id: id,
        //         company_id: req.user.company_id
        //     }
        // });

        return res.status(200).json({
            status: true,
            message: "BOM updated successfully",
            // data: updatedBOM
        });

    } catch (error) {
        console.error("Update BOM error:", error);
        return res.status(500).json({
            status: false,
            message: "Error updating BOM",
            error: error.message
        });
    }
};

/**
 * Get paginated list of all BOM records with filter by bom_no
 * @param {object} req - The request object
 * @param {object} req.query - Query parameters
 * @param {number} req.query.page - Page number (default: 1)
 * @param {number} req.query.limit - Items per page (default: 10)
 * @param {string} req.query.bom_no - Filter by BOM number (optional)
 * @param {object} req.user - Authenticated user object
 * @param {number} req.user.company_id - Company ID from authenticated user
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */
exports.GetAllBOM = async (req, res) => {
    try {
        const { bom_no, fg_product_id } = req.query;
        // Pagination params
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        // Base where clause - always filter by company_id
        const where = {
            company_id: req.user.company_id
        };

        // Add bom_no filter if provided
        if (bom_no) {
            where.bom_no = { [Op.like]: `%${bom_no.trim()}%` };
        }

        // filter by fg_product_id if provided
        if (fg_product_id) {
            where.final_product_id = parseInt(fg_product_id);
        }

        // Get paginated BOM records with associations
        const bomList = await MasterBOM.findAndCountAll({
            attributes: [
                'id',
                'company_id',
                'final_product_id',
                'raw_material_product_id',
                'bom_no',
                'quantity',
                'created_at',
                'updated_at'
            ],
            where,
            order: [['id', 'DESC']],
            limit,
            offset,
            include: [
                {
                    association: 'finalProduct',
                    attributes: ['id', 'product_name', 'product_code', 'sku_product']
                },
                {
                    association: 'rawMaterialProduct',
                    attributes: ['id', 'product_name', 'product_code', 'sku_product']
                },
            ]
        });

        // Get paginated data
        const paginatedBOMData = CommonHelper.paginate(bomList, page, limit);

        return res.status(200).json({
            status: true,
            message: "BOM list fetched successfully",
            data: paginatedBOMData
        });

    } catch (error) {
        console.error("Get all BOM error:", error);
        return res.status(500).json({
            status: false,
            message: "Error fetching BOM list",
            error: error.message
        });
    }
};

/**
 * Delete BOM by ID (soft delete)
 * @param {object} req - The request object
 * @param {object} req.params - The request parameters
 * @param {number} req.params.id - BOM ID
 * @param {object} req.user - Authenticated user object
 * @param {number} req.user.company_id - Company ID from authenticated user
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */
exports.DeleteBOM = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!id || isNaN(id)) {
            return res.status(400).json({
                status: false,
                message: "Invalid BOM ID"
            });
        }

        // Check if BOM exists and belongs to the company
        const bom = await MasterBOM.findOne({
            attributes: ['id'],
            raw: true,
            where: { id: id }
        });

        // if BOM not found, return 404
        if (!bom) {
            return res.status(404).json({
                status: false,
                message: "BOM not found or does not belong to your company"
            });
        }

        // Perform soft delete
        const deletedBOM = await MasterBOM.destroy({
            where: { id: id }
        });

        // Check if deletion was successful
        if (!deletedBOM) {
            return res.status(404).json({
                status: false,
                message: "BOM not found or could not be deleted"
            });
        }

        // return with success message
        return res.status(200).json({
            status: true,
            message: "BOM deleted successfully"
        });

    } catch (error) {
        console.error("Delete BOM error:", error);
        return res.status(500).json({
            status: false,
            message: "Error deleting BOM",
            error: error.message
        });
    }
};

/**
 * Get BOM report with pagination and filter by bom_no
 * @param {object} req - The request object
 * @param {object} req.query - Query parameters
 * @param {number} req.query.page - Page number (default: 1)
 * @param {number} req.query.limit - Items per page (default: 10)
 * @param {string} req.query.bom_no - Filter by BOM number (optional)
 * @param {object} res - The response object
 * @returns {Promise<void>}
 */
exports.GetBOMReport = async (req, res) => {
    try {
        const { fg_product_id, product_type_id } = req.query;
        // Pagination params
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        // Filter by bom_no (optional)
        const bomNo = (req.query.bom_no || '').trim();

        // Use raw SQL query for efficient database-level pagination
        // This JOIN creates one row per stock entry per BOM combination
        // Pagination happens at database level, not in memory
        
        // Build WHERE conditions for SQL
        let bomWhereSQL = `mb.company_id = :companyId`;
        const replacements = { companyId: req.user.company_id };
        
        if (bomNo) {
            bomWhereSQL += ` AND mb.bom_no LIKE :bomNo`;
            replacements.bomNo = `%${bomNo}%`;
        }
        
        if (fg_product_id) {
            bomWhereSQL += ` AND mb.final_product_id = :fg_product_id`;
            replacements.fg_product_id = parseInt(fg_product_id);
        }

        // filter by product_type_id if provided
        if (product_type_id) {
            bomWhereSQL += ` AND mpt.id = :product_type_id`;
            replacements.product_type_id = parseInt(product_type_id);
        } else {
            bomWhereSQL += ` AND mpt.id in (:product_type_ids)`;
            replacements.product_type_ids = [3, 4];
        }

        const selectFields = `
            mb.id,
            mb.bom_no,
            mb.quantity as bom_quantity,
            mb.raw_material_product_id,
            fp.id as final_product_id,
            fp.product_name as final_product_name,
            fp.product_code as final_product_code,
            fp.buffer_size,
            fp.product_type_id,
            mpt.name as product_type_name,
            pse.id as stock_entry_id,
            pse.quantity as stock_quantity,
            pse.inventory_at_transit,
            pse.sale_order_recieved,
            w.id as warehouse_id,
            w.name as warehouse_name,
            rmp.id as raw_material_id,
            rmp.product_name as raw_material_name,
            rmp.product_code as raw_material_code,
            pse_rm.quantity as raw_material_quantity,
            /* INVENTORY NEEDED */
            (
                (
                    fp.buffer_size
                    + (fp.buffer_size * 0.005)
                    + pse.sale_order_recieved
                )
                -
                (
                    pse.quantity
                    + pse.inventory_at_transit
                )
            ) AS inventory_needed
        `;

        const joiningAndConditions = `FROM product_stock_entries pse
            INNER JOIN master_bom mb ON mb.final_product_id = pse.product_id
            INNER JOIN product fp ON fp.id = pse.product_id
            INNER JOIN product rmp ON rmp.id = mb.raw_material_product_id
            LEFT JOIN product_stock_entries pse_rm ON pse_rm.product_id = fp.id
            LEFT JOIN warehouses w_rm ON w_rm.id = pse_rm.warehouse_id
            LEFT JOIN master_product_types mpt ON mpt.id = fp.product_type_id
            LEFT JOIN warehouses w ON w.id = pse.warehouse_id

            WHERE pse.company_id = :companyId
            AND w.is_fg_store = 1 AND w_rm.is_rm_store = 1
            AND pse.deleted_at IS NULL
            AND mb.deleted_at IS NULL
            AND ${bomWhereSQL}
            /* INVENTORY NEEDED FILTER */
            AND (
                (
                    fp.buffer_size
                    + (fp.buffer_size * 0.005)
                    + pse.sale_order_recieved
                )
                -
                (
                    pse.quantity
                    + pse.inventory_at_transit
                )
            ) > 0
            ORDER BY mb.final_product_id, mb.raw_material_product_id DESC`;

        // Get total count efficiently (no select list - count only)
        const countQuery = `SELECT COUNT(*) as total ${joiningAndConditions}`;

        replacements.limit = limit;
        replacements.offset = offset;

        // Main query with JOINs and pagination at database level
        const dataQuery = `
            SELECT ${selectFields} ${joiningAndConditions}
            LIMIT :limit OFFSET :offset
        `;

        // Get total count
        const countResult = await sequelize.query(countQuery, {
            replacements,
            type: QueryTypes.SELECT,
            raw: true
        });

        const totalRows = countResult[0]?.total || 0;

        // Get data
        const rows = await sequelize.query(dataQuery, {
            replacements,
            type: QueryTypes.SELECT,
            raw: true
        });

        // Transform SQL results to match expected structure
        const transformedRows = rows.map(row => ({
            id: row.id,
            bom_no: row.bom_no,
            quantity: row.bom_quantity,
            finalProduct: {
                id: row.final_product_id,
                product_name: row.final_product_name,
                product_code: row.final_product_code,
                buffer_size: row.buffer_size,
                product_type_id: row.product_type_id,
                masterProductType: row.product_type_name ? {
                    name: row.product_type_name
                } : null
            },
            productStockEntry: {
                id: row.stock_entry_id,
                quantity: row.stock_quantity,
                inventory_at_transit: row.inventory_at_transit,
                sale_order_recieved: row.sale_order_recieved,
                inventory_needed: row.inventory_needed,
                warehouse: row.warehouse_id ? {
                    id: row.warehouse_id,
                    name: row.warehouse_name
                } : null
            },
            rawMaterialProduct: row.raw_material_id ? {
                id: row.raw_material_id,
                product_name: row.raw_material_name,
                product_code: row.raw_material_code,
                quantity: row.raw_material_quantity
            } : null
        }));

        // Get paginated data
        const paginatedBOMReport = {
            pagination: {
                total: totalRows,
                page: page,
                limit: limit,
                totalPages: Math.ceil(totalRows / limit),
                hasNextPage: page < Math.ceil(totalRows / limit),
                hasPreviousPage: page > 1
            },
            rows: transformedRows
        };

        // return the paginated data
        return res.status(200).json({
            status: true,
            message: "BOM report fetched successfully",
            data: paginatedBOMReport
        });
    } catch (error) {
        console.error("Get BOM report error:", error);
        return res.status(500).json({
            status: false,
            message: "Error getting BOM report",
            error: error.message
        });
    }
};

/**
 * Get sum of inventory needed grouped by product_id (raw material product ids).
 * Query param: rm_product_ids - comma-separated raw material product IDs.
 * Uses same logic as BOM report: inventory_needed = (buffer_size + buffer_size*0.005 + sale_order_recieved) - (quantity + inventory_at_transit);
 * Returns sum(inventory_needed * bom_quantity) per raw_material_product_id.
 */
exports.getInventoryNeeded = async (req, res) => {
    try {
        const company_id = req.user.company_id;
        const rmProductIdsParam = req.query.rm_product_ids;
        if (!rmProductIdsParam || typeof rmProductIdsParam !== 'string' || !rmProductIdsParam.trim()) {
            return res.status(400).json({
                status: false,
                message: "Query parameter rm_product_ids (comma-separated product IDs) is required",
            });
        }
        const rawMaterialProductIdArray = rmProductIdsParam
            .split(',')
            .map((id) => parseInt(id.trim(), 10))
            .filter((id) => !Number.isNaN(id) && id > 0);
        if (rawMaterialProductIdArray.length === 0) {
            return res.status(200).json({
                status: true,
                message: "Inventory needed fetched successfully",
                data: [],
            });
        }

        const inventoryNeededExpr = `(
            (fp.buffer_size + (fp.buffer_size * 0.005) + pse.sale_order_recieved)
            - (pse.quantity + pse.inventory_at_transit)
        )`;
        const query = `
            SELECT
                mb.raw_material_product_id AS product_id,
                SUM(${inventoryNeededExpr} * mb.quantity) AS total_required_quantity
            FROM product_stock_entries pse
            INNER JOIN master_bom mb ON mb.final_product_id = pse.product_id
            INNER JOIN product fp ON fp.id = pse.product_id
            INNER JOIN product rmp ON rmp.id = mb.raw_material_product_id
            LEFT JOIN warehouses w ON w.id = pse.warehouse_id
            WHERE pse.company_id = :companyId
                AND pse.deleted_at IS NULL
                AND mb.deleted_at IS NULL
                AND mb.raw_material_product_id IN (:rmProductIds)
                AND w.is_fg_store = 1
                AND (${inventoryNeededExpr}) > 0
            GROUP BY mb.raw_material_product_id
        `;
        const rows = await sequelize.query(query, {
            replacements: {
                companyId: company_id,
                rmProductIds: rawMaterialProductIdArray,
            },
            type: QueryTypes.SELECT,
            raw: true,
        });

        return res.status(200).json({
            status: true,
            message: "Inventory needed fetched successfully",
            data: rows,
        });
    } catch (error) {
        console.error("Get inventory needed error:", error);
        return res.status(500).json({
            status: false,
            message: "Error getting inventory needed",
            error: error.message,
        });
    }
};
