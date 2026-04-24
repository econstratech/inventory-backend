const { Op } = require("sequelize")
const sequelize = require("../database/db-connection");

const {
    WorkOrder,
    WorkOrderStep,
    MasterBOM,
    Warehouse,
    Product,
    ProductVariant,
    WorkOrderMaterialIssue,
    WorkOrderMaterialMapping,
    CompanyProductionStep,
    ProductStockEntry,
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

        // if warehouse_id is provided then update the inventory_at_production in product stock entery
        if (wo_payload.warehouse_id) {
            await ProductStockEntry.update({
                inventory_at_production: wo_payload.planned_qty
            },
            { 
                where: { 
                    product_id: wo_payload.product_id, 
                    warehouse_id: wo_payload.warehouse_id,
                    ...(wo_payload.final_product_variant_id ? { product_variant_id: wo_payload.final_product_variant_id } : {}), 
                }, 
                transaction 
            });
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
 * Create multiple work orders in a single transaction
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.CreateMultipleWorkOrders = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const workOrdersInput = Array.isArray(req.body?.work_orders) ? req.body.work_orders : null;
        if (!workOrdersInput || workOrdersInput.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                status: false,
                message: "work_orders must be a non-empty array",
            });
        }

        const createdWorkOrders = [];

        for (let index = 0; index < workOrdersInput.length; index++) {
            const input = workOrdersInput[index];

            // generate 6 digit unique reference number per work order
            const referenceNumber = CommonHelper.generateUniqueReferenceNumber("WO", 6);
            const wo_payload = {
                ...input,
                company_id: req.user.company_id,
                wo_number: referenceNumber,
                status: 1, // 1: Pending
                progress_percent: 0,
            };

            const workOrder = await WorkOrder.create(wo_payload, { transaction });

            const steps = Array.isArray(input.work_order_steps) ? input.work_order_steps : [];
            if (steps.length > 0) {
                const workOrderSteps = steps.map(step => ({
                    wo_id: workOrder.id,
                    step_id: step.step_id,
                    sequence: step.sequence,
                }));
                await WorkOrderStep.bulkCreate(workOrderSteps, { transaction });
            }

            // if warehouse_id is provided then update the inventory_at_production in product stock entry
            if (wo_payload.warehouse_id) {
                await ProductStockEntry.update(
                    { inventory_at_production: wo_payload.planned_qty },
                    {
                        where: {
                            product_id: wo_payload.product_id,
                            warehouse_id: wo_payload.warehouse_id,
                            ...(wo_payload.final_product_variant_id ? { product_variant_id: wo_payload.final_product_variant_id } : {}),
                        },
                        transaction,
                    }
                );
            }

            createdWorkOrders.push(workOrder);
        }

        await transaction.commit();

        return res.status(200).json({
            status: true,
            message: "Work orders created successfully",
            count: createdWorkOrders.length,
            data: createdWorkOrders,
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Error creating multiple work orders:", error);
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
        let sortParam = req.query.sort || 'created_at';
        const orderParam = req.query.order || 'desc';

        // convert sort param to array of strings
        if (sortParam === 'customer_name') {
            sortParam = ['customer', 'name'];
        } else if (sortParam === 'product_name') {
            sortParam = ['product', 'product_name'];
        } else if (sortParam === 'wo_number') {
            sortParam = ['wo_number'];
        } else if (sortParam === 'due_date') {
            sortParam = ['due_date'];
        } else if (sortParam === 'created_at') {
            sortParam = ['created_at'];
        }
        
        // base where
        const where = {
            company_id: req.user.company_id,
        };

        if (req.query.status) {
            const statusVal = req.query.status;
            if (statusVal === 'active') {
                where.status = {[Op.in]: [1, 2, 3]};
            } else if (statusVal === 'completed') {
                where.status = 4;
            } else if (statusVal === 'cancelled') {
                where.status = 5;
            } else if (!isNaN(Number(statusVal))) {
                where.status = Number(statusVal);
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
                'final_qty', 
                'due_date', 
                'status',
                'material_issued_at',
                'progress_percent',
                'material_issue_percent',
                'created_at', 
                'updated_at'
            ],
            where: where,
            limit: limit,
            offset: offset,
            distinct: true,
            order: [[...sortParam, orderParam], ['workOrderSteps', 'sequence', 'asc']],
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
                    association: 'warehouse',
                    attributes: ['id', 'name'],
                },
                {
                    association: 'productionStep',
                    attributes: ['id', 'name'],
                },
                {
                    association: 'workOrderSteps',
                    attributes: ['id', 'step_id', 'status', 'uom_id', 'sequence', 'input_qty', 'output_qty', 'waste_qty', 'yield_percent'],
                    include: [
                        {
                            association: 'step',
                            attributes: ['id', 'name', 'colour_code'],
                        }, 
                        {
                            association: 'masterUOM',
                            attributes: ['id', 'label'],
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
 * Get a work order by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.GetWorkOrderById = async (req, res) => {
    try {
        const { wo_id } = req.params;
        const isVariantBased = req.user.is_variant_based;
        // check if work order exists
        const workOrder = await WorkOrder.findOne({
            attributes: [
                'id',
                'wo_number',
                'warehouse_id',
                'planned_qty',
                'due_date',
                'status',
                // 'material_issued_at',
                // 'progress_percent',
                // 'material_issue_percent',
                // 'created_at',
                // 'updated_at',
            ],
            where: { id: wo_id },
            include: [
                {
                    association: 'product',
                    attributes: ['id', 'product_name', 'product_code'],
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
                    association: 'customer',
                    attributes: ['id', 'name'],
                },
                {
                    association: 'warehouse',
                    attributes: ['id', 'name', 'city'],
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
            ]
        });
        // if work order does not exist, return 404
        if (!workOrder) {
            return res.status(404).json({ status: false, message: "Work order not found" });
        }
        // return the work order
        return res.status(200).json({ status: true, message: "Work order fetched successfully", data: workOrder });
    } catch (error) {
        console.error("Error getting work order by ID:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}

/**
 * Update a work order (header fields; replaces `work_order_steps` only while status is Pending)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.UpdateWorkOrder = async (req, res) => {
    // start a transaction
    const transaction = await sequelize.transaction();
    try {
        // get the work order id
        const { wo_id } = req.params;
        // get the user company id
        const company_id = req.user.company_id;
        // get the user is variant based
        const isVariantBased = !!req.user.is_variant_based;

        // get the request body
        const {
            customer_id,
            product_id,
            final_product_variant_id,
            warehouse_id,
            planned_qty,
            due_date,
            production_step_id,
            work_order_steps,
        } = req.body;

        // check if work_order_steps is an array
        if (work_order_steps !== undefined && !Array.isArray(work_order_steps)) {
            await transaction.rollback();
            return res.status(400).json({ status: false, message: "work_order_steps must be an array" });
        }
        const stepsPayload = work_order_steps ?? [];

        // check if customer_id, product_id, planned_qty, due_date, and production_step_id are provided
        if (
            customer_id == null ||
            product_id == null ||
            planned_qty == null ||
            due_date == null ||
            production_step_id == null
        ) {
            await transaction.rollback();
            return res.status(400).json({
                status: false,
                message: "customer_id, product_id, planned_qty, due_date, and production_step_id are required",
            });
        }

        // convert the work order id to a number
        const woIdNum = parseInt(wo_id, 10);
        // check if the work order id is a number
        if (Number.isNaN(woIdNum)) {
            await transaction.rollback();
            return res.status(400).json({ status: false, message: "Invalid work order id" });
        }

        // check if the work order exists
        const workOrder = await WorkOrder.findOne({
            where: { id: woIdNum, company_id },
            attributes: ["id", "status"],
            transaction,
            include: [
                {
                    association: 'workOrderSteps',
                    attributes: ['id', 'sequence', 'step_id'],
                }
            ]
        });

        // check if the work order does not exist
        if (!workOrder) {
            await transaction.rollback();
            return res.status(404).json({ status: false, message: "Work order not found" });
        }

        // check if the work order steps are provided
        for (const s of stepsPayload) {
            // check if the step_id and sequence are provided
            if (s.step_id == null || s.sequence == null) {
                await transaction.rollback();
                return res.status(400).json({
                    status: false,
                    message: "Each work order step requires step_id and sequence",
                });
            }
        }
        // get the step ids to check
        const stepIdsToCheck = [production_step_id, ...stepsPayload.map((s) => s.step_id)];
        // get the unique step ids
        const uniqueStepIds = [...new Set(stepIdsToCheck)];
        // get the valid steps
        const validSteps = await CompanyProductionStep.findAll({
            where: { company_id, id: { [Op.in]: uniqueStepIds }, is_active: 1 },
            attributes: ["id"],
            transaction,
        });
        // check if the valid steps are the same as the unique step ids, if not then return 400
        if (validSteps.length !== uniqueStepIds.length) {
            await transaction.rollback();
            return res.status(400).json({
                status: false,
                message: "Invalid or inactive production step for this company",
            });
        }

        // Check if steps have actually changed (compare step_id + sequence)
        const existingSteps = (workOrder.workOrderSteps || [])
            .map((s) => `${s.step_id}:${s.sequence}`)
            .sort()
            .join(",");
        const incomingSteps = stepsPayload
            .map((s) => `${s.step_id}:${s.sequence}`)
            .sort()
            .join(",");
        const stepsChanged = existingSteps !== incomingSteps;

        if (workOrder.status !== 1 && stepsChanged) {
            await transaction.rollback();
            return res.status(400).json({
                status: false,
                message: "Cannot replace work order steps after the work order has left Pending status",
            });
        }
        // update the work order
        await WorkOrder.update(
            {
                customer_id,
                product_id,
                planned_qty,
                due_date,
                production_step_id,
                warehouse_id,
                ...(isVariantBased
                    ? { final_product_variant_id: final_product_variant_id ?? null }
                    : { final_product_variant_id: null }),
            },
            {
                where: { id: woIdNum, company_id },
                transaction,
            }
        );

        // check if the work order status is 1, if so then delete the work order steps and create new ones
        if (workOrder.status === 1) {
            // delete the work order steps
            await WorkOrderStep.destroy({ where: { wo_id: woIdNum }, transaction });
            // check if the steps payload is not empty, if so then create new work order steps
            if (stepsPayload.length > 0) {
                // create the work order steps
                const rows = stepsPayload.map((step) => ({
                    wo_id: woIdNum,
                    step_id: step.step_id,
                    sequence: step.sequence,
                }));
                await WorkOrderStep.bulkCreate(rows, { transaction });
            }
        }

        // commit the transaction
        await transaction.commit();

        return res.status(200).json({
            status: true,
            message: "Work order updated successfully"
        });
    } catch (error) {
        // rollback the transaction if exists
        if (transaction) {
            await transaction.rollback();
        }
        // return error response
        console.error("Error updating work order:", error);
        return res.status(500).json({ status: false, message: "Error updating work order", error: error.message });
    }
};

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
 * Cancel a work order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.CancelWorkOrder = async (req, res) => {
    try {
        const { wo_id } = req.params;
        // check if work order exists
        const workOrder = await WorkOrder.findOne({
            attributes: ['id', 'status'],
            where: { id: wo_id },
        });
        // if work order does not exist, return 404
        if (!workOrder) {
            return res.status(404).json({ status: false, message: "Work order not found" });
        }
        if (workOrder.status === 4) {
            return res.status(400).json({ status: false, message: "Completed work order cannot be cancelled" });
        }
        await WorkOrder.update({
            status: 5, // 5: Cancelled
        }, {
            where: { id: wo_id },
        });
        // return success response
        return res.status(200).json({ status: true, message: "Work order cancelled successfully" });
    } catch (error) {
        console.error("Error cancelling work order:", error);
        return res.status(500).json({ status: false, message: "Error cancelling work order", error: error.message });
    }
}

/**
 * Get material list without BOM for a work order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.GetMaterialListWithoutBOMForWorkOrder = async (req, res) => {
    try {
        const { wo_id } = req.params;
        const company_id = req.user.company_id;
        const isVariantBased = req.user.is_variant_based;

        // check if work order exists
        const workOrder = await WorkOrder.findOne({
            attributes: ['id', 'product_id', 'final_product_variant_id', 'planned_qty', 'status'],
            where: { id: wo_id },
            include: [
                {
                    association: 'workOrderMaterialIssues',
                    attributes: ['id', 'rm_product_id', 'rm_product_variant_id', 'issued_qty', 'batch_id', 'warehouse_id'],
                },
                {
                    association: 'finalProductVariant',
                    attributes: ['id', 'weight_per_unit', 'weight_per_pack'],
                    include: [
                        {
                            association: 'masterUOM',
                            attributes: ['id', 'label']
                        }
                    ]
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
            const fgUOM = finalProductVariant?.masterUOM.dataValues;
            fg_uom = { ...fgUOM, weight_per_unit: finalProductVariant.weight_per_unit };
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
            const fgUOM = finalProduct?.masterUOM.dataValues;

            fg_uom = { ...fgUOM, weight_per_unit: 1 };
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
        // console.log("rm_store_ids", rm_store_ids);
        // get the BOM list for the work order
        const materialList = await WorkOrderMaterialMapping.findAll({
            attributes: ['id', 'rm_product_id'],
            where: {
                company_id,
                fg_product_id: workOrder.product_id,
                ...(workOrder.final_product_variant_id ? { fg_product_variant_id: workOrder.final_product_variant_id } : {}),
            },
            include: [
                {
                    association: 'rmProduct',
                    attributes: ['id', 'product_name', 'product_code'],
                    include: [
                        {
                            association: 'productStockEntries',
                            attributes: ['id', 'quantity'],
                            required: false,
                            where: { warehouse_id: { [Op.in]: rm_store_ids } },
                            include: [
                                {
                                    association: 'warehouse',
                                    attributes: ['id', 'name'],
                                },
                                {
                                    association: 'productVariant',
                                    attributes: ['id', 'weight_per_unit', 'weight_per_pack'],
                                    include: [
                                        {
                                            association: 'masterUOM',
                                            attributes: ['id', 'label']
                                        }
                                    ]
                                }
                            ]
                        },
                    ]
                },
            ]
        });

        // return the BOM list
        return res.status(200).json({ 
            status: true, 
            message: "Work order materials list fetched successfully", 
            data: {
                workOrder,
                fg_uom,
                materialList 
            }
        });
    } catch (error) {
        console.error("Error getting work order materials list:", error);
        return res.status(500).json({ status: false, message: "Error getting materials list for work order", error: error.message });
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
                    attributes: ['id', 'rm_product_id', 'rm_product_variant_id', 'issued_qty', 'batch_id', 'warehouse_id'],
                },
                {
                    association: 'finalProductVariant',
                    attributes: ['id', 'weight_per_unit', 'weight_per_pack'],
                    include: [
                        {
                            association: 'masterUOM',
                            attributes: ['id', 'label']
                        }
                    ]
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
            const fgUOM = finalProductVariant?.masterUOM.dataValues;
            fg_uom = { ...fgUOM, weight_per_unit: finalProductVariant.weight_per_unit };
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
            const fgUOM = finalProduct?.masterUOM.dataValues;

            fg_uom = { ...fgUOM, weight_per_unit: 1 };
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
                             required: false,
                            where: { warehouse_id: { [Op.in]: rm_store_ids } },
                            include: [
                                {
                                    association: 'warehouse',
                                    attributes: ['id', 'name'],
                                }
                            ]
                        }] : []),
                    ]
                },
                {
                    association: 'rawMaterialProductVariant',
                    attributes: ['id', 'weight_per_unit'],
                    required: false,
                    include: [
                        {
                            association: 'masterUOM',
                            attributes: ['id', 'label'],
                            required: false,
                        },
                        ...(isVariantBased ? [{
                            association: 'productStockEntries',
                            attributes: ['id', 'quantity'],
                            required: false,
                            where: { warehouse_id: { [Op.in]: rm_store_ids } },
                            include: [
                                {
                                    association: 'warehouse',
                                    attributes: ['id', 'name'],
                                }
                            ]
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
        const { 
            wo_id, 
            rm_product_id, 
            rm_product_variant_id, 
            issued_qty, 
            batch_id,
            warehouse_id,
            fg_uom,
            rm_uom,
            fg_weight_per_unit,
            rm_weight_per_unit
        } = req.body;

        const isVariantBased = req.user.is_variant_based;
        // check if work order exists
        const workOrder = await WorkOrder.findOne({
            attributes: ['id', 'planned_qty', 'status'],
            raw: true,
            where: { id: wo_id },
        });
        // if work order does not exist, return 404
        if (!workOrder) {
            return res.status(404).json({ status: false, message: "Work order not found" });
        }

        const [workOrderMaterialIssue, totalIssuedQty] = await Promise.all([
            // check if the material issue already exists
            WorkOrderMaterialIssue.findOne({
                attributes: ['id'],
                raw: true,
                transaction,
                where: { 
                    wo_id: wo_id, 
                    rm_product_id: rm_product_id, 
                    ...(rm_product_variant_id ? { rm_product_variant_id: rm_product_variant_id } : {}),
                    ...(warehouse_id ? { warehouse_id: warehouse_id } : {}),
                },
            }),
            // get the total issued quantity
            WorkOrderMaterialIssue.sum('issued_qty', {
                where: { wo_id: wo_id },
                transaction,
            })
        ]);

        // calculate the material issue percentage
        let materialIssuePercent = 0;
        const workOrderPayload = {};

        if (isVariantBased && rm_product_variant_id) {
            const palnnedUnitsQty = fg_uom === 'kg' ? Number(workOrder.planned_qty) * fg_weight_per_unit * 1000 : Number(workOrder.planned_qty) * fg_weight_per_unit;
            const totalIssuedUnitsQty = rm_uom === 'kg' ? (Number(totalIssuedQty) + Number(issued_qty)) * rm_weight_per_unit * 1000 : (Number(totalIssuedQty) + Number(issued_qty)) * rm_weight_per_unit;
            materialIssuePercent = Math.ceil((totalIssuedUnitsQty / palnnedUnitsQty) * 100);

        } else {
            materialIssuePercent = ((Number(totalIssuedQty) + Number(issued_qty)) / Number(workOrder.planned_qty)) * 100;
        }

        workOrderPayload.material_issue_percent = materialIssuePercent;


        // if the material issue already exists, then update the material issue
        let materialIssueId = null;
        if (workOrderMaterialIssue) {
            await WorkOrderMaterialIssue.update({
                issued_qty: issued_qty,
                batch_id: batch_id || null,
                warehouse_id: warehouse_id || null,
            }, {
                where: { id: workOrderMaterialIssue.id },
                transaction
            });
            materialIssueId = workOrderMaterialIssue.id;
        } else {
            // Create the material issue
            const createdIssue = await WorkOrderMaterialIssue.create({
                company_id: req.user.company_id,
                wo_id: wo_id,
                rm_product_id: rm_product_id,
                rm_product_variant_id: rm_product_variant_id || null,
                issued_qty: issued_qty,
                batch_id: batch_id || null,
                warehouse_id: warehouse_id || null,
            }, { transaction });
            materialIssueId = createdIssue?.id ?? null;

            // update the work order status to in-progress if it's in pending status
            if (workOrder.status === 1) {
                workOrderPayload.status = 2; // 2: In-Progress
            }
        }

        // update the work order
        await WorkOrder.update(workOrderPayload, {
            where: { id: wo_id },
            transaction,
        });

        // commit the transaction
        await transaction.commit();
        // return success response
        return res.status(200).json({
            status: true,
            message: "Material issue created successfully",
            data: { id: materialIssueId },
        });
    } catch (error) {
        console.error("Error creating material issue:", error);
        // rollback the transaction
        await transaction.rollback();
        return res.status(400).json({ status: false, message: "Error creating material issue", error: error.message });
    }
}

/**
 * Delete a issued material from a work order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
exports.DeleteMaterialIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const materialIssue = await WorkOrderMaterialIssue.findOne({
            attributes: ['id'],
            where: {id},
            raw: true,
        });
        if (!materialIssue) {
            return res.status(404).json({
                status: false,
                message: 'Record is not exist'
            });
        }

        await WorkOrderMaterialIssue.destroy({ where: { id }});
        return res.status(200).json({
            status: true,
            message: "Material issue deleted successfully"
        });

    } catch (error) {
        console.log("Error in material delete", error);
        return res.status(400).json({ status: false, message: "Error in material delete", error: error.message });
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
            // material_issue_percent: 100, // 100% material issued when material issue is completed
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
        const { wo_id, wo_step_id, input_qty, output_qty, uom_id, status } = req.body;
        if (!input_qty || !output_qty) {
            return res.status(400).json({ status: false, message: "Input quantity and output quantity are required" });
        } else if (input_qty < 0 || output_qty < 0) {
            return res.status(400).json({ status: false, message: "Input quantity and output quantity cannot be negative" });
        } else if (output_qty > input_qty) {
            return res.status(400).json({ status: false, message: "Output quantity cannot be greater than input quantity" });
        }

        // check if the work order is exist, if not then return 404
        const workOrder = await WorkOrder.findOne({
            attributes: ['id', 'production_step_id', 'planned_qty'],
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
            uom_id: uom_id,
            input_qty: input_qty,
            output_qty: output_qty,
            waste_qty: waste_qty,
            yield_percent: yield_percent,
            status: stepStatus,
        }, {
            where: { id: wo_step_id },
        });

        // calculate the progress percentage
        const [totalSteps, totalStepsCompleted, totalOutputQty] = await Promise.all([
            WorkOrderStep.count({
                where: { wo_id: wo_id },
            }),
            WorkOrderStep.count({
                where: { wo_id: wo_id, status: 3 },
            }),
            WorkOrderStep.sum('output_qty', {
                where: { wo_id: wo_id },
            }),
        ]);

        // Hybrid progress = average of step completion % and quantity completion %.
        const stepBasedProgress = totalSteps > 0 ? (totalStepsCompleted / totalSteps) * 100 : 0;
        const plannedQty = Number(workOrder.planned_qty) || 0;
        const quantityBasedProgress = plannedQty > 0
            ? ((Number(totalOutputQty) || 0) / plannedQty) * 100
            : 0;
        const progress_percent = Number(
            Math.min(100, (stepBasedProgress + quantityBasedProgress) / 2).toFixed(2)
        );

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

/**
 * Mark a work order as production completed (status 4)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.CompleteProduction = async (req, res) => {
    try {
        const { wo_id, final_qty = 0 } = req.body;
        if (wo_id == null || wo_id === "") {
            return res.status(400).json({ status: false, message: "wo_id is required" });
        }
        const id = parseInt(wo_id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ status: false, message: "Invalid wo_id" });
        }

        await WorkOrder.update(
            { 
                status: 4,
                final_qty,
                production_completed_at: new Date(),
                production_completed_by: req.user.id,
            },
            { where: { id, company_id: req.user.company_id } }
        );

        return res.status(200).json({
            status: true,
            message: "Production completed successfully",
        });
    } catch (error) {
        console.error("Error completing production:", error);
        return res.status(500).json({
            status: false,
            message: "Error completing production",
            error: error.message,
        });
    }
};

/**
 * Get work order stats (counts by status + average progress)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.GetWorkOrderStats = async (req, res) => {
    try {
        const company_id = req.user.company_id;

        const where = { company_id };

        // date range filter
        if (req.query.date_from && req.query.date_to) {
            where.created_at = {
                [Op.between]: [new Date(req.query.date_from), new Date(req.query.date_to + "T23:59:59.999Z")],
            };
        } else if (req.query.date_from) {
            where.created_at = { [Op.gte]: new Date(req.query.date_from) };
        } else if (req.query.date_to) {
            where.created_at = { [Op.lte]: new Date(req.query.date_to + "T23:59:59.999Z") };
        }

        // Count by status
        const statusCounts = await WorkOrder.findAll({
            where,
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            ],
            group: ['status'],
            raw: true,
        });

        const getCount = (status) => Number(statusCounts.find(r => r.status === status)?.count) || 0;

        const pending_material_issue = getCount(1);
        const production_in_progress = getCount(2);
        const material_issued = getCount(3);
        const production_completed = getCount(4);
        const cancelled = getCount(5);
        const total = statusCounts.reduce((sum, r) => sum + Number(r.count), 0);

        // Average production progress
        const avgResult = await WorkOrder.findOne({
            where,
            attributes: [
                [sequelize.fn('AVG', sequelize.col('progress_percent')), 'avg_progress'],
            ],
            raw: true,
        });
        const avg_production_progress = Number(Number(avgResult?.avg_progress || 0).toFixed(2));

        return res.status(200).json({
            status: true,
            message: "Work order stats fetched successfully",
            data: {
                total,
                pending_material_issue,
                production_in_progress,
                material_issued,
                production_completed,
                cancelled,
                avg_production_progress,
            },
        });
    } catch (error) {
        console.error("Error getting work order stats:", error);
        return res.status(500).json({ status: false, message: "Error getting work order stats", error: error.message });
    }
};

/**
 * Export work orders as CSV (streamed in batches)
 * Supports the same filters as GetAllWorkOrders
 */
exports.ExportWorkOrders = async (req, res) => {
    try {
        const isVariantBased = req.user.is_variant_based;

        // ── Build where clause (same logic as GetAllWorkOrders) ──
        const where = { company_id: req.user.company_id };

        if (req.query.status) {
            const statusVal = req.query.status;
            if (statusVal === 'active') {
                where.status = { [Op.in]: [1, 2, 3] };
            } else if (statusVal === 'completed') {
                where.status = 4;
            } else if (statusVal === 'cancelled') {
                where.status = 5;
            } else if (!isNaN(Number(statusVal))) {
                where.status = Number(statusVal);
            }
        }

        const search = req.query.search || '';
        if (search) {
            where[Op.or] = [
                { wo_number: { [Op.like]: `%${search}%` } },
                { '$product.product_name$': { [Op.like]: `%${search}%` } },
                { '$customer.name$': { [Op.like]: `%${search}%` } },
            ];
        }
        if (req.query.wo_number) where.wo_number = req.query.wo_number;
        if (req.query.product_id) where.product_id = req.query.product_id;
        if (req.query.customer_id) where.customer_id = req.query.customer_id;
        if (req.query.production_step_id) where.production_step_id = req.query.production_step_id;
        if (req.query.due_date) {
            where.due_date = { [Op.gte]: req.query.due_date, [Op.lte]: req.query.due_date };
        }

        // ── File name ──
        const d = new Date();
        const dateStr = `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${d.getFullYear()}`;
        const rand = String(Math.floor(Math.random() * 900) + 100);
        const filename = `work-orders-${dateStr}-${rand}.csv`;

        // ── Stream headers ──
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        const headerCols = [
            "WO Number",
            "Customer",
            "Product",
            "Product Code",
            ...(isVariantBased ? ["Variant (Weight/Unit)"] : []),
            "Planned Qty",
            "Final Qty",
            "Status",
            "Current Step",
            "Process Flow",
            "Store",
            "Due Date",
            "Created Date",
        ];
        res.write(headerCols.join(",") + "\n");

        // ── Batch loop ──
        let offset = 0;
        const includes = [
            { association: 'product', attributes: ['id', 'product_name', 'product_code'] },
            ...(isVariantBased ? [{
                association: 'finalProductVariant',
                attributes: ['id', 'weight_per_unit'],
                include: [{ association: 'masterUOM', attributes: ['id', 'label'] }]
            }] : []),
            { association: 'customer', attributes: ['id', 'name'] },
            { association: 'warehouse', attributes: ['id', 'name'] },
            { association: 'productionStep', attributes: ['id', 'name'] },
            {
                association: 'workOrderSteps',
                attributes: ['id', 'step_id', 'sequence'],
                include: [{ association: 'step', attributes: ['id', 'name'] }]
            },
        ];

        while (true) {
            const batch = await WorkOrder.findAll({
                attributes: [
                    'id', 'wo_number', 'planned_qty', 'final_qty',
                    'due_date', 'status', 'created_at',
                ],
                where,
                order: [['created_at', 'DESC'], ['workOrderSteps', 'sequence', 'ASC']],
                limit: EXPORT_BATCH_SIZE,
                offset,
                include: includes,
                subQuery: false,
            });

            if (batch.length === 0) break;

            for (const wo of batch) {
                const steps = (wo.workOrderSteps || [])
                    .slice()
                    .sort((a, b) => a.sequence - b.sequence)
                    .map(s => s.step?.name)
                    .filter(Boolean)
                    .join(" > ");

                const row = [
                    csvEscape(wo.wo_number),
                    csvEscape(wo.customer?.name),
                    csvEscape(wo.product?.product_name),
                    csvEscape(wo.product?.product_code),
                    ...(isVariantBased ? [
                        csvEscape(`${wo.finalProductVariant?.weight_per_unit} ${wo.finalProductVariant?.masterUOM?.label}`),
                    ] : []),
                    csvEscape(wo.planned_qty),
                    csvEscape(wo.final_qty),
                    csvEscape(WO_STATUS_LABELS[wo.status] || wo.status),
                    csvEscape(wo.productionStep?.name),
                    csvEscape(steps),
                    csvEscape(wo.warehouse?.name),
                    csvEscape(wo.due_date ? new Date(wo.due_date).toLocaleDateString("en-GB") : ""),
                    csvEscape(wo.created_at ? new Date(wo.created_at).toLocaleDateString("en-GB") : ""),
                ];
                res.write(row.join(",") + "\n");
            }

            offset += batch.length;
            if (batch.length < EXPORT_BATCH_SIZE) break;

            // Yield to event loop between batches
            await new Promise(resolve => setImmediate(resolve));
        }

        res.end();
    } catch (error) {
        console.error("Error exporting work orders:", error);
        if (!res.headersSent) {
            return res.status(500).json({
                status: false,
                message: "Error exporting work orders",
                error: error.message,
            });
        }
        res.end();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Work Order Material Mapping — CRUD
// Maps a finished good (+ optional variant) to a raw material for a company.
// ─────────────────────────────────────────────────────────────────────────────

const materialMappingIncludes = [
    { association: 'fgProduct', attributes: ['id', 'product_name', 'product_code'] },
    {
        association: 'fgProductVariant',
        attributes: ['id', 'weight_per_unit'],
        required: false,
        include: [{ association: 'masterUOM', attributes: ['id', 'label'] }],
    },
    { association: 'rmProduct', attributes: ['id', 'product_name', 'product_code'] },
];

/**
 * Create one or more work-order material mappings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.CreateMaterialMapping = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const company_id = req.user.company_id;

        // Accept either a single object (legacy) or an array via `mappings` / top-level array.
        let rawItems;
        if (Array.isArray(req.body)) {
            rawItems = req.body;
        } else if (Array.isArray(req.body?.mappings)) {
            rawItems = req.body.mappings;
        } else {
            rawItems = [req.body || {}];
        }

        if (rawItems.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                status: false,
                message: "At least one mapping must be provided",
            });
        }

        const normalized = [];
        for (let i = 0; i < rawItems.length; i++) {
            const item = rawItems[i] || {};
            const fg_product_id = item.fg_product_id;
            const rm_product_id = item.rm_product_id;
            const fg_product_variant_id = item.fg_product_variant_id ?? null;

            if (fg_product_id == null || rm_product_id == null) {
                await transaction.rollback();
                return res.status(400).json({
                    status: false,
                    message: `fg_product_id and rm_product_id are required (item index ${i})`,
                });
            }

            normalized.push({
                company_id,
                fg_product_id,
                fg_product_variant_id,
                rm_product_id,
            });
        }

        // Deduplicate within the request itself.
        const seen = new Set();
        const uniqueItems = [];
        for (const item of normalized) {
            const key = `${item.fg_product_id}|${item.fg_product_variant_id ?? 'null'}|${item.rm_product_id}`;
            if (seen.has(key)) continue;
            seen.add(key);
            uniqueItems.push(item);
        }

        // Duplicate guard against existing rows (same FG + variant + RM for this company).
        const existing = await WorkOrderMaterialMapping.findAll({
            attributes: ['fg_product_id', 'fg_product_variant_id', 'rm_product_id'],
            where: {
                company_id,
                [Op.or]: uniqueItems.map(item => ({
                    fg_product_id: item.fg_product_id,
                    rm_product_id: item.rm_product_id,
                    fg_product_variant_id: item.fg_product_variant_id,
                })),
            },
            transaction,
        });

        if (existing.length > 0) {
            await transaction.rollback();
            const duplicates = existing.map(row => ({
                fg_product_id: row.fg_product_id,
                fg_product_variant_id: row.fg_product_variant_id,
                rm_product_id: row.rm_product_id,
            }));
            return res.status(409).json({
                status: false,
                message: "One or more mappings already exist for this finished good and raw material",
                duplicates,
            });
        }

        const created = await WorkOrderMaterialMapping.bulkCreate(uniqueItems, { transaction });

        await transaction.commit();

        return res.status(201).json({
            status: true,
            message: created.length === 1
                ? "Material mapping created successfully"
                : `${created.length} material mappings created successfully`,
            data: created,
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Error creating material mapping:", error);
        return res.status(500).json({
            status: false,
            message: "Error creating material mapping",
            error: error.message,
        });
    }
};

/**
 * List work-order material mappings (paginated, filterable)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.GetAllMaterialMappings = async (req, res) => {
    try {
        const company_id = req.user.company_id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const where = { company_id };
        if (req.query.fg_product_id) where.fg_product_id = req.query.fg_product_id;
        if (req.query.fg_product_variant_id) where.fg_product_variant_id = req.query.fg_product_variant_id;
        if (req.query.rm_product_id) where.rm_product_id = req.query.rm_product_id;

        const search = (req.query.search || '').trim();
        if (search) {
            where[Op.or] = [
                { '$fgProduct.product_name$': { [Op.like]: `%${search}%` } },
                { '$fgProduct.product_code$': { [Op.like]: `%${search}%` } },
                { '$rmProduct.product_name$': { [Op.like]: `%${search}%` } },
                { '$rmProduct.product_code$': { [Op.like]: `%${search}%` } },
            ];
        }

        const result = await WorkOrderMaterialMapping.findAndCountAll({
            where,
            limit,
            offset,
            distinct: true,
            order: [['created_at', 'DESC']],
            include: materialMappingIncludes,
        });

        const paginatedData = CommonHelper.paginate(result, page, limit);
        return res.status(200).json({
            status: true,
            message: "Material mappings fetched successfully",
            data: paginatedData,
        });
    } catch (error) {
        console.error("Error getting material mappings:", error);
        return res.status(500).json({
            status: false,
            message: "Error getting material mappings",
            error: error.message,
        });
    }
};

/**
 * Get a work-order material mapping by id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.GetMaterialMappingById = async (req, res) => {
    try {
        const company_id = req.user.company_id;
        const { id } = req.params;

        const mapping = await WorkOrderMaterialMapping.findOne({
            where: { id, company_id },
            include: materialMappingIncludes,
        });

        if (!mapping) {
            return res.status(404).json({ status: false, message: "Material mapping not found" });
        }

        return res.status(200).json({
            status: true,
            message: "Material mapping fetched successfully",
            data: mapping,
        });
    } catch (error) {
        console.error("Error getting material mapping:", error);
        return res.status(500).json({
            status: false,
            message: "Error getting material mapping",
            error: error.message,
        });
    }
};

/**
 * Update a work-order material mapping
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.UpdateMaterialMapping = async (req, res) => {
    try {
        const company_id = req.user.company_id;
        const { id } = req.params;
        const { fg_product_id, fg_product_variant_id, rm_product_id } = req.body;

        const mapping = await WorkOrderMaterialMapping.findOne({
            where: { id, company_id },
        });
        if (!mapping) {
            return res.status(404).json({ status: false, message: "Material mapping not found" });
        }

        const nextFgId = fg_product_id ?? mapping.fg_product_id;
        const nextVariantId = fg_product_variant_id === undefined ? mapping.fg_product_variant_id : fg_product_variant_id;
        const nextRmId = rm_product_id ?? mapping.rm_product_id;

        // Duplicate guard against a different row carrying the same triple.
        const duplicate = await WorkOrderMaterialMapping.findOne({
            attributes: ['id'],
            where: {
                company_id,
                fg_product_id: nextFgId,
                fg_product_variant_id: nextVariantId ?? null,
                rm_product_id: nextRmId,
                id: { [Op.ne]: mapping.id },
            },
        });
        if (duplicate) {
            return res.status(409).json({
                status: false,
                message: "Another mapping already exists for this finished good and raw material",
            });
        }

        await mapping.update({
            fg_product_id: nextFgId,
            fg_product_variant_id: nextVariantId,
            rm_product_id: nextRmId,
        });

        return res.status(200).json({
            status: true,
            message: "Material mapping updated successfully",
            data: mapping,
        });
    } catch (error) {
        console.error("Error updating material mapping:", error);
        return res.status(500).json({
            status: false,
            message: "Error updating material mapping",
            error: error.message,
        });
    }
};

/**
 * Soft-delete a work-order material mapping (paranoid)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.DeleteMaterialMapping = async (req, res) => {
    try {
        const company_id = req.user.company_id;
        const { id } = req.params;

        const deleted = await WorkOrderMaterialMapping.destroy({
            where: { id, company_id },
        });
        if (!deleted) {
            return res.status(404).json({ status: false, message: "Material mapping not found" });
        }

        return res.status(200).json({
            status: true,
            message: "Material mapping deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting material mapping:", error);
        return res.status(500).json({
            status: false,
            message: "Error deleting material mapping",
            error: error.message,
        });
    }
};
