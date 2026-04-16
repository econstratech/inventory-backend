const { Op, where } = require("sequelize")
const sequelize = require("../database/db-connection");

const {
    WorkOrder,
    WorkOrderStep,
    MasterBOM,
    Warehouse,
    Product,
    ProductVariant,
    WorkOrderMaterialIssue,
    CompanyProductionStep,
    ProductStockEntry,
} = require("../model")
const CommonHelper = require("../helpers/commonHelper");
const WorkOrderDispatchLog = require("../model/WorkOrderDispatchLog");

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
                            attributes: ['id', 'name'],
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
        if (workOrderMaterialIssue) {
            await WorkOrderMaterialIssue.update({
                issued_qty: issued_qty,
                batch_id: batch_id || null,
                warehouse_id: warehouse_id || null,
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
                warehouse_id: warehouse_id || null,
            }, { transaction });

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
 * Get dispatch list (completed work orders)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.GetDispatchList = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10,
            dispatch_status,
            search = "", 
            sort_by = "created_at", 
            order = "DESC" 
        } = req.query;
        const offset = (page - 1) * limit;

        // Build sort parameter
        const orderParam = order.toUpperCase() === "ASC" ? "ASC" : "DESC";
        let sortParam = [];
        if (sort_by === "wo_number") {
            sortParam = ['wo_number'];
        } else if (sort_by === "customer_name") {
            sortParam = [{ model: Customer, as: 'customer' }, 'name'];
        } else if (sort_by === "product_name") {
            sortParam = [{ model: Product, as: 'product' }, 'product_name'];
        } else {
            sortParam = ['created_at'];
        }

        const where = {
            company_id: req.user.company_id,
            status: 4, // Only fetch completed work orders for dispatch
        };

        // if search query is provided then add it to the where clause
        if (search) {
            where[Op.or] = [
                { wo_number: { [Op.like]: `%${search}%` } },
                { '$customer.name$': { [Op.like]: `%${search}%` } },
                { '$product.product_name$': { [Op.like]: `%${search}%` } },
            ];
        }
        // if due_date range filter is provided then add it to the where clause
        if (req.query.due_date_start && req.query.due_date_end) {
            where.due_date = {
                [Op.between]: [new Date(req.query.due_date_start), new Date(req.query.due_date_end + "T23:59:59.999Z")],
            };
        } else if (req.query.due_date_start) {
            where.due_date = {
                [Op.gte]: new Date(req.query.due_date_start),
            };
        } else if (req.query.due_date_end) {
            where.due_date = {
                [Op.lte]: new Date(req.query.due_date_end + "T23:59:59.999Z"),
            };
        }

        if (dispatch_status !== undefined && dispatch_status !== "") {
            where.dispatch_status = parseInt(dispatch_status, 10);
        }

        const isVariantBased = req.user.is_variant_based;

        // fetch the work orders with pagination, sorting, and searching
        const workOrders = await WorkOrder.findAndCountAll({
            where,
            attributes: [
                'id',
                'wo_number',
                'planned_qty',
                'final_qty',
                'due_date',
                'status',
                'created_at',
                'production_completed_by',
                'dispatch_status',
                [
                    sequelize.literal(`(SELECT COALESCE(SUM(dispatched_qty), 0) FROM work_order_dispatch_logs WHERE work_order_dispatch_logs.work_order_id = work_orders.id)`),
                    'total_dispatched_qty'
                ],
            ],
            order: [[...sortParam, orderParam]],
            offset,
            limit: parseInt(limit),
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
                    association: 'productionCompletedBy',
                    attributes: ['id', 'name'],
                }
            ],
        });

        // get paginated data
        const paginatedData = CommonHelper.paginate(workOrders, page, limit);

        // return the work orders with pagination
        return res.status(200).json({
            status: true,
            message: "Dispatch list fetched successfully",
            data: paginatedData
        });
    } catch (error) {
        console.error("Error getting dispatch list:", error);
        return res.status(500).json({ status: false, message: "Error getting dispatch list", error: error.message });
    }
}

/**
 * Get dispatch stats (counts and totals for completed work orders)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.GetDispatchStats = async (req, res) => {
    try {
        const company_id = req.user.company_id;

        const where = {
            company_id,
            status: 4, // Only completed work orders
        };

        // due_date range filter
        if (req.query.due_date_start && req.query.due_date_end) {
            where.due_date = {
                [Op.between]: [new Date(req.query.due_date_start), new Date(req.query.due_date_end + "T23:59:59.999Z")],
            };
        } else if (req.query.due_date_start) {
            where.due_date = { [Op.gte]: new Date(req.query.due_date_start) };
        } else if (req.query.due_date_end) {
            where.due_date = { [Op.lte]: new Date(req.query.due_date_end + "T23:59:59.999Z") };
        }

        // customer filter
        if (req.query.customer_id) {
            where.customer_id = req.query.customer_id;
        }

        // Count by dispatch_status
        const statusCounts = await WorkOrder.findAll({
            where,
            attributes: [
                'dispatch_status',
                [sequelize.fn('COUNT', sequelize.col('work_orders.id')), 'count'],
            ],
            group: ['dispatch_status'],
            raw: true,
        });

        const total = statusCounts.reduce((sum, r) => sum + Number(r.count), 0);
        const pending = Number(statusCounts.find(r => r.dispatch_status === 0)?.count) || 0;
        const in_transit = Number(statusCounts.find(r => r.dispatch_status === 1)?.count) || 0;
        const completed = Number(statusCounts.find(r => r.dispatch_status === 2)?.count) || 0;

        // Get work order IDs matching the filter for dispatch log aggregation
        const woIds = await WorkOrder.findAll({
            where,
            attributes: ['id'],
            raw: true,
        });
        const ids = woIds.map(w => w.id);

        let qty_out = 0;
        let qty_delivered = 0;
        let work_orders = 0;

        if (ids.length > 0) {
            // Total dispatched qty across all matching work orders
            const totalDispatched = await WorkOrderDispatchLog.findOne({
                where: { work_order_id: { [Op.in]: ids } },
                attributes: [
                    [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('dispatched_qty')), 0), 'qty_out'],
                    [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('work_order_id'))), 'work_orders'],
                ],
                raw: true,
            });
            qty_out = Number(totalDispatched?.qty_out) || 0;
            work_orders = Number(totalDispatched?.work_orders) || 0;

            // Qty delivered = dispatched qty for fully completed work orders (dispatch_status=2)
            // const fullyDispatchedIds = woIds.filter(w => {
            //     const sc = statusCounts.find(r => r.dispatch_status === 2);
            //     return sc; // we need the actual WO ids with dispatch_status=2
            // }).map(w => w.id);

            const fullyDispatchedWOs = await WorkOrder.findAll({
                where: { ...where, dispatch_status: 2 },
                attributes: ['id'],
                raw: true,
            });
            const fullyIds = fullyDispatchedWOs.map(w => w.id);

            if (fullyIds.length > 0) {
                const deliveredResult = await WorkOrderDispatchLog.findOne({
                    where: { work_order_id: { [Op.in]: fullyIds } },
                    attributes: [
                        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('dispatched_qty')), 0), 'qty_delivered'],
                    ],
                    raw: true,
                });
                qty_delivered = Number(deliveredResult?.qty_delivered) || 0;
            }
        }

        return res.status(200).json({
            status: true,
            message: "Dispatch stats fetched successfully",
            data: {
                total,
                pending,
                in_transit,
                completed,
                qty_out,
                qty_delivered,
                work_orders,
            },
        });
    } catch (error) {
        console.error("Error getting dispatch stats:", error);
        return res.status(500).json({ status: false, message: "Error getting dispatch stats", error: error.message });
    }
};

/** Dispatch a work order (partial or full dispatch)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.dispatchWorkOrder = async (req, res) => {
    // start a transaction
    const transaction = await sequelize.transaction();
    try {
        const { wo_id } = req.params;
        const {
            dispatched_qty, 
            dispatch_status, 
            dispatch_note = null 
        } = req.body;

        // get the work order details
        const [workOrder, previouslyDispatchedQty] = await Promise.all([
            WorkOrder.findOne({
                where: { id: wo_id },
                attributes: ['id', 'dispatch_status', 'product_id', 'final_product_variant_id', 'warehouse_id', 'final_qty'],
                raw: true,
            }),
            WorkOrderDispatchLog.sum('dispatched_qty', {
                where: { work_order_id: wo_id },
                transaction,
            }),
        ]);
        // if work order does not exist, return 404. if work order is already fully dispatched, return 400
        if (!workOrder) {
            return res.status(404).json({ status: false, message: "Work order not found" });
        } else if (workOrder.dispatch_status === 2) {
            return res.status(400).json({ status: false, message: "Work order already fully dispatched" });
        } else if (Number(previouslyDispatchedQty) + Number(dispatched_qty) > Number(workOrder.final_qty)) {
            return res.status(400).json({
                status: false, 
                message: 
                    `Dispatched quantity exceeds planned quantity for full dispatch. 
                    Your remaining quantity for full dispatch is ${ Number(workOrder.final_qty) - Number(previouslyDispatchedQty)}
                    `
            });
        }

        let finalStatus = dispatch_status;
        const totalDispatchedQty = Number(previouslyDispatchedQty) + Number(dispatched_qty);
        if (totalDispatchedQty === Number(workOrder.final_qty)) {
            finalStatus = 2; // Fully dispatched
        }

        // Log the dispatch details in WorkOrderDispatchLog
        await WorkOrderDispatchLog.create({
            company_id: req.user.company_id,
            work_order_id: wo_id,
            dispatched_qty,
            dispatch_note,
            dispatched_by: req.user.id,
            dispacthed_at: new Date(),
        }, { transaction });

        await WorkOrder.update({
            dispatch_status: finalStatus,
            dispatch_completed_at: finalStatus === 2 ? new Date() : null,
        }, {
            where: { id: wo_id },
            transaction,
        });

        // If fully dispatched, update the stock quantity in ProductStockEntry for the finished goods
        if (finalStatus === 2) {
            const stockEntry = await ProductStockEntry.findOne({
                where: {
                    warehouse_id: workOrder.warehouse_id,
                    product_id: workOrder.product_id,
                    ...(workOrder.final_product_variant_id ? { product_variant_id: workOrder.final_product_variant_id } : {}),
                },
                attributes: ['id', 'quantity', 'inventory_at_production'],
                raw: true,
                transaction,
            });

            if (stockEntry) {
                const newQuantity = Number(stockEntry.quantity) + Number(dispatched_qty);
                // const inventoryAtProduction = stockEntry.inventory_at_production > 0 ? stockEntry.inventory_at_production - Number(dispatched_qty) : 0;

                await ProductStockEntry.update({
                    quantity: newQuantity,
                    inventory_at_production: totalDispatchedQty,
                }, {
                    where: { id: stockEntry.id },
                    transaction,
                });
            }

        }

        // commit the transaction
        await transaction.commit();

        // Return with status 200 and message
        return res.status(200).json({ 
            status: true,
            message: "Work order dispatched successfully" 
        });
    } catch (error) {
        console.error("Error dispatching work order:", error);
        return res.status(500).json({ status: false, message: "Error dispatching work order", error: error.message });
    }
}

/** Get dispatch logs for a work order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.GetDispatchHistory = async (req, res) => {
    try {
        const { wo_id } = req.params;

        // get the dispatch logs for the work order
        const dispatchLogs = await WorkOrderDispatchLog.findAll({
            where: { work_order_id: wo_id },
            attributes: ['id', 'dispatched_qty', 'dispatch_note', 'dispacthed_at'],
            include: [
                {
                    association: 'dispatchedBy',
                    attributes: ['id', 'name'],
                }
            ],
            order: [['dispacthed_at', 'DESC']],
        });

        return res.status(200).json({
            status: true,
            message: "Work order dispatch logs fetched successfully",
            data: dispatchLogs,
        });
    } catch (error) {
        console.error("Error getting work order dispatch logs:", error);
        return res.status(500).json({ status: false, message: "Error getting work order dispatch logs", error: error.message });
    }
}