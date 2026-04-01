const { Op } = require("sequelize")
const sequelize = require("../database/db-connection");

const {
    WorkOrder,
    WorkOrderStep
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
            status: 1,
        };
        // if search is provided then add it to the where clause
        if (search) {
            where[Op.or] = [
                { wo_number: { [Op.like]: `%${search}%` } },
                { '$product.product_name$': { [Op.like]: `%${search}%` } },
                { '$customer.name$': { [Op.like]: `%${search}%` } },
            ];
        }
        // get the work orders
        const workOrders = await WorkOrder.findAndCountAll({
            attributes: ['id', 'wo_number', 'planned_qty', 'due_date', 'status', 'progress_percent', 'created_at', 'updated_at'],
            where: where,
            limit: limit,
            offset: offset,
            distinct: true,
            order: [[sort, order]],
            include: [
                {
                    association: 'product',
                    attributes: ['id', 'product_name', 'product_code'],
                },
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
                    attributes: ['id', 'step_id', 'sequence', 'input_qty', 'output_qty', 'waste_qty', 'yield_percent'],
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