const { Op } = require("sequelize")
const sequelize = require("../database/db-connection");

const {
    WorkOrder,
    WorkOrderStep,
    MasterBOM,
    Warehouse,
    Product,
    ProductVariant,
    WorkOrderMaterialIssue
} = require("../model")
const CommonHelper = require("../helpers/commonHelper");

/**
 * Create a new work order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.CreateWorkOrder = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        // generate 6 digit unique reference number
        const referenceNumber = CommonHelper.generateUniqueReferenceNumber("WO", 6);
        // create work order payload
        const wo_payload = {
            ...req.body,
            company_id: req.user.company_id,
            wo_number: referenceNumber,
            status: 1, // 1: Pending
            progress_percent: 0,
        }
        // create the work order
        const workOrder = await WorkOrder.create(wo_payload, { transaction });

        if (req.body.work_order_steps.length > 0) {
            const workOrderSteps = req.body.work_order_steps.map(step => ({
                wo_id: workOrder.id,
                step_id: step.step_id,
                sequence: step.sequence,
            }));
            await WorkOrderStep.bulkCreate(workOrderSteps, { transaction });
        }

        // commit the transaction
        await transaction.commit();

        // return success response
        return res.status(200).json({
            status: true,
            message: "Work order created successfully",
            data: workOrder
        });
    } catch (error) {
        // rollback the transaction
        await transaction.rollback();
        console.error("Error creating work order:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}

/**
 * Get all work orders
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.GetAllWorkOrders = async (req, res) => {
    try {
        // isVariantBased: true if variant based company, false if not variant based company
        const isVariantBased = req.user.is_variant_based;
        // pagination params
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        // search params
        const search = req.query.search || '';
        // sort params
        const sort = req.query.sort || 'created_at';
        const order = req.query.order || 'desc';
        // base where
        const where = {
            company_id: req.user.company_id,
        };

        if (req.query.status) {
            if (req.query.status === 'active') {
                where.status = {[Op.in]: [1, 2, 3]};
            } else if (req.query.status === 'completed') {
                where.status = 4;
            } else if (req.query.status === 'cancelled') {
                where.status = 5;
            }
        }
        // if search is provided then add it to the where clause
        if (search) {
            where[Op.or] = [
                { wo_number: { [Op.like]: `%${search}%` } },
                { '$product.product_name$': { [Op.like]: `%${search}%` } },
                { '$customer.name$': { [Op.like]: `%${search}%` } },
            ];
        }

        // if wo_number is provided then add it to the where clause
        if (req.query.wo_number) {
            where.wo_number = req.query.wo_number;
        }
        // if product_id is provided then add it to the where clause
        if (req.query.product_id) {
            where.product_id = req.query.product_id;
        }
        // if customer_id is provided then add it to the where clause
        if (req.query.customer_id) {
            where.customer_id = req.query.customer_id;
        }
        // if production_step_id is provided then add it to the where clause
        if (req.query.production_step_id) {
            where.production_step_id = req.query.production_step_id;
        }
        // if due_date is provided then add it to the where clause
        if (req.query.due_date) {
            where.due_date = {
                [Op.gte]: req.query.due_date,
                [Op.lte]: req.query.due_date,
            };
        }
        // get the work orders
        const workOrders = await WorkOrder.findAndCountAll({
            attributes: [
                'id', 
                'wo_number', 
                'planned_qty', 
                'due_date', 
                'status',
                'material_issued_at',
                'progress_percent', 
                'created_at', 
                'updated_at'
            ],
            where: where,
            limit: limit,
            offset: offset,
            distinct: true,
            order: [[sort, order], ['workOrderSteps', 'sequence', 'asc']],
            include: [
                {
                    association: 'product',
                    attributes: ['id', 'product_name', 'product_code'],
                },
                ...(isVariantBased ? [{
                    association: 'finalProductVariant',
                    attributes: ['id', 'weight_per_unit'],
                    include: [
                        {
                            association: 'masterUOM',
                            attributes: ['id', 'label'],
                        }
                    ]
                }] : []),
                {
                    association: 'customer',
                    attributes: ['id', 'name'],
                },
                {
                    association: 'productionStep',
                    attributes: ['id', 'name'],
                },
                {
                    association: 'workOrderSteps',
                    attributes: ['id', 'step_id', 'status', 'sequence', 'input_qty', 'output_qty', 'waste_qty', 'yield_percent'],
                    include: [
                        {
                            association: 'step',
                            attributes: ['id', 'name'],
                        }
                    ]
                },
                {
                    association: 'materialIssuedBy',
                    attributes: ['id', 'name'],
                }
            ]
        });
        // get the paginated data
        const paginatedData = CommonHelper.paginate(workOrders, page, limit);
        // return the work orders with pagination
        return res.status(200).json({
            status: true,
            message: "Work orders fetched successfully",
            data: paginatedData
        });
    } catch (error) {
        console.error("Error getting all work orders:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}

/**
 * Delete a work order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.DeleteWorkOrder = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        // check if work order exists
        const workOrder = await WorkOrder.findOne({
            attributes: ['id'],
            raw: true,
            where: { id: id },
        });
        // if work order does not exist, return 404
        if (!workOrder) {
            return res.status(404).json({ status: false, message: "Work order not found" });
        }
        await WorkOrderStep.destroy({ where: { wo_id: id }, transaction });
        // delete work order
        await WorkOrder.destroy({ where: { id: id }, transaction });
        // commit the transaction
        await transaction.commit();
        // return success response
        return res.status(200).json({ status: true, message: "Work order deleted successfully" });
    } catch (error) {
        console.error("Error deleting work order:", error);
        // rollback the transaction
        await transaction.rollback();
        return res.status(500).json({
            status: false,
            message: "Error deleting work order",
            error: error.message
        });
    }
}

/**
 * Get BOM list for a work order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.GetBOMListForWorkOrder = async (req, res) => {
    try {
        const { wo_id } = req.params;
        const isVariantBased = req.user.is_variant_based;
        // check if work order exists
        const workOrder = await WorkOrder.findOne({
            attributes: ['id', 'product_id', 'final_product_variant_id', 'planned_qty', 'status'],
            where: { id: wo_id },
            include: [
                {
                    association: 'workOrderMaterialIssues',
                    attributes: ['id', 'rm_product_id', 'rm_product_variant_id', 'issued_qty'],
                }
            ]
        });
        // if work order does not exist, return 404
        if (!workOrder) {
            return res.status(404).json({ status: false, message: "Work order not found" });
        }
        let fg_uom = null;

        if (isVariantBased && workOrder.final_product_variant_id) {
            const finalProductVariant = await ProductVariant.findOne({
                attributes: ['id', 'weight_per_unit'],
                where: { id: workOrder.final_product_variant_id },
                include: [
                    {
                        association: 'masterUOM',
                        attributes: ['id', 'label'],
                    }
                ]
            });
            fg_uom = finalProductVariant?.masterUOM;
        } else {
            const finalProduct = await Product.findOne({
                attributes: ['id', 'uom_id'],
                where: { id: workOrder.product_id },
                include: [
                    {
                        association: 'masterUOM',
                        attributes: ['id', 'label'],
                    }
                ],
            });
            fg_uom = finalProduct?.masterUOM;
        }

        // get the raw material stores
        const rm_stores = await Warehouse.findAll({
            attributes: ['id', 'name'],
            where: {
                company_id: req.user.company_id,
                is_rm_store: 1,
            }
        });
        // get the raw material store ids
        const rm_store_ids = rm_stores.map(store => store.id);
        // get the BOM list for the work order
        const bomList = await MasterBOM.findAll({
            attributes: ['id', 'raw_material_product_id', 'raw_material_variant_id', 'quantity'],
            where: {
                final_product_id: workOrder.product_id,
                ...(workOrder.final_product_variant_id ? { final_product_variant_id: workOrder.final_product_variant_id } : {}),
            },
            include: [
                {
                    association: 'rawMaterialProduct',
                    attributes: ['id', 'product_name', 'product_code'],
                    include: [
                        ...(!isVariantBased ? [{
                            association: 'productStockEntries',
                            attributes: ['id', 'quantity'],
                            where: { warehouse_id: { [Op.in]: rm_store_ids } },
                        }] : []),
                    ]
                },
                {
                    association: 'rawMaterialProductVariant',
                    attributes: ['id', 'weight_per_unit'],
                    include: [
                        {
                            association: 'masterUOM',
                            attributes: ['id', 'label'],
                        },
                        ...(isVariantBased ? [{
                            association: 'productStockEntries',
                            attributes: ['id', 'quantity'],
                            where: { warehouse_id: { [Op.in]: rm_store_ids } },
                        }] : []),
                    ]
                }
            ]
        });

        // return the BOM list
        return res.status(200).json({ 
            status: true, 
            message: "BOM list fetched successfully", 
            data: {
                workOrder,
                fg_uom,
                materialList: bomList 
            }
        });
    } catch (error) {
        console.error("Error getting BOM list for work order:", error);
        return res.status(500).json({ status: false, message: "Error getting BOM list for work order", error: error.message });
    }
}

/**
 * Create a material issue for a work order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.CreateMaterialIssue = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { wo_id, rm_product_id, rm_product_variant_id, issued_qty, batch_id } = req.body;
        // check if work order exists
        const workOrder = await WorkOrder.findOne({
            attributes: ['id'],
            raw: true,
            where: { id: wo_id },
        });
        // if work order does not exist, return 404
        if (!workOrder) {
            return res.status(404).json({ status: false, message: "Work order not found" });
        }

        // check if the material issue already exists
        const workOrderMaterialIssue = await WorkOrderMaterialIssue.findOne({
            attributes: ['id'],
            raw: true,
            where: { 
                wo_id: wo_id, 
                rm_product_id: rm_product_id, 
                ...(rm_product_variant_id ? { rm_product_variant_id: rm_product_variant_id } : {}),
            },
        });
        // if the material issue already exists, then update the material issue
        if (workOrderMaterialIssue) {
            await WorkOrderMaterialIssue.update({
                issued_qty: issued_qty,
                batch_id: batch_id || null,
            }, {
                where: { id: workOrderMaterialIssue.id },
                transaction 
            });
        } else {
            // Create the material issue
            await WorkOrderMaterialIssue.create({
                company_id: req.user.company_id,
                wo_id: wo_id,
                rm_product_id: rm_product_id,
                rm_product_variant_id: rm_product_variant_id || null,
                issued_qty: issued_qty,
                batch_id: batch_id || null,
            }, { transaction });

            // update the work order status to in-progress
            await WorkOrder.update({
                status: 2, // 2: In-Progress
            }, {
                where: { id: wo_id },
                transaction,
            });
        }

        // commit the transaction
        await transaction.commit();
        // return success response
        return res.status(200).json({ status: true, message: "Material issue created successfully" });
    } catch (error) {
        console.error("Error creating material issue:", error);
        // rollback the transaction
        await transaction.rollback();
        return res.status(400).json({ status: false, message: "Error creating material issue", error: error.message });
    }
}

/**
 * Complete a material issue for a work order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.CompleteMaterialIssue = async (req, res) => {
    try {
        const { wo_id } = req.body;
        await WorkOrder.update({
            status: 3, // 3: Material Issued
            material_issued_by: req.user.id,
            material_issued_at: new Date(),
        }, {
            where: { id: wo_id },
        });
        // return success response
        return res.status(200).json({ status: true, message: "Material issue completed successfully" });
    } catch (error) {
        console.error("Error completing material issue:", error);
        // rollback the transaction
        await transaction.rollback();
        return res.status(400).json({ status: false, message: "Error completing material issue", error: error.message });
    }
}

/**
 * Save production data for a work order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.SaveProductionData = async (req, res) => {
    try {
        // validate the input and output quantities
        const { wo_id, wo_step_id, input_qty, output_qty, status } = req.body;
        if (!input_qty || !output_qty) {
            return res.status(400).json({ status: false, message: "Input quantity and output quantity are required" });
        } else if (input_qty < 0 || output_qty < 0) {
            return res.status(400).json({ status: false, message: "Input quantity and output quantity cannot be negative" });
        } else if (output_qty > input_qty) {
            return res.status(400).json({ status: false, message: "Output quantity cannot be greater than input quantity" });
        }

        // check if the work order is exist, if not then return 404
        const workOrder = await WorkOrder.findOne({
            attributes: ['id', 'production_step_id'],
            raw: true,
            where: { id: wo_id },
        });
        if (!workOrder) {
            return res.status(404).json({ status: false, message: "Work order not found" });
        }

        // get current step if exists, if not then return 404
        const currentStep = await WorkOrderStep.findOne({
            attributes: ['id', 'step_id', 'sequence'],
            raw: true,
            where: { id: wo_step_id },
        });
        if (!currentStep) {
            return res.status(404).json({ status: false, message: "Work order step not found" });
        }

        // get the next step
        const nextStep = await WorkOrderStep.findOne({
            attributes: ['id', 'step_id'],
            raw: true,
            where: { wo_id: wo_id, sequence: { [Op.gt]: currentStep.sequence } },
            order: [['sequence', 'ASC']],
        });

        // calculate the waste quantity and yield percentage
        const waste_qty = input_qty - output_qty;
        const yield_percent = (output_qty / input_qty) * 100;

        let stepStatus = status;
        if (status === 1) {
            stepStatus = 2; // Force to In-Progress status, if status is 1
        }

        // update the work order step
        await WorkOrderStep.update({
            input_qty: input_qty,
            output_qty: output_qty,
            waste_qty: waste_qty,
            yield_percent: yield_percent,
            status: stepStatus,
        }, {
            where: { id: wo_step_id },
        });

        // calculate the progress percentage
        const [totalSteps, totalStepsCompleted] = await Promise.all([
            WorkOrderStep.count({
                where: { wo_id: wo_id },
            }),
            WorkOrderStep.count({
                where: { wo_id: wo_id, status: 3 },
            }),
        ]);

        // calculate the progress percentage
        const progress_percent = (totalStepsCompleted / totalSteps) * 100;

        // update the work order progress percentage
        await WorkOrder.update({
            progress_percent: progress_percent,
            ...(nextStep && status === 3 ? { production_step_id: nextStep.step_id } : {}),
            status: progress_percent === 100 ? 4 : 3, // 4: Completed, 3: Material Issued (production is in progress)
        }, {
            where: { id: wo_id },
        });

        // return success response
        return res.status(200).json({ status: true, message: "Production data saved successfully" });
    } catch (error) {
        console.error("Error saving production data:", error);
        return res.status(400).json({ status: false, message: "Error saving production data", error: error.message });
    }
}