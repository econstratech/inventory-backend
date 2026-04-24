const { Op } = require("sequelize")
const sequelize = require("../database/db-connection");

const {
    WorkOrder,
    WorkOrderStep,
    Warehouse,
    Product,
    ProductVariant,
    CompanyProductionStep,
    ProductionPlanning,
    ProductionActuals,
} = require("../model")
const WorkOrderDispatchLog = require("../model/WorkOrderDispatchLog");
const CommonHelper = require("../helpers/commonHelper");

/**
 * Get monthly production & dispatch trend
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.GetMonthlyTrend = async (req, res) => {
    try {
        const company_id = req.user.company_id;
        const { date_from, date_to } = req.query;

        // Build date filter for work orders
        const woWhere = { company_id };
        if (date_from && date_to) {
            woWhere.created_at = {
                [Op.between]: [new Date(date_from), new Date(date_to + "T23:59:59.999Z")],
            };
        } else if (date_from) {
            woWhere.created_at = { [Op.gte]: new Date(date_from) };
        } else if (date_to) {
            woWhere.created_at = { [Op.lte]: new Date(date_to + "T23:59:59.999Z") };
        }

        // WOs created per month
        const createdByMonth = await WorkOrder.findAll({
            where: woWhere,
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'ym'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            ],
            group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m')],
            raw: true,
        });

        // WOs completed per month (status=4, using production_completed_at)
        const completedWhere = { ...woWhere, status: 4 };
        // For completed, group by production_completed_at month
        const completedDateWhere = { company_id, status: 4 };
        if (date_from && date_to) {
            completedDateWhere.production_completed_at = {
                [Op.between]: [new Date(date_from), new Date(date_to + "T23:59:59.999Z")],
            };
        } else if (date_from) {
            completedDateWhere.production_completed_at = { [Op.gte]: new Date(date_from) };
        } else if (date_to) {
            completedDateWhere.production_completed_at = { [Op.lte]: new Date(date_to + "T23:59:59.999Z") };
        }

        const completedByMonth = await WorkOrder.findAll({
            where: completedDateWhere,
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('production_completed_at'), '%Y-%m'), 'ym'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            ],
            group: [sequelize.fn('DATE_FORMAT', sequelize.col('production_completed_at'), '%Y-%m')],
            raw: true,
        });

        // Dispatches per month
        const dispatchWhere = {};
        if (date_from && date_to) {
            dispatchWhere.dispacthed_at = {
                [Op.between]: [new Date(date_from), new Date(date_to + "T23:59:59.999Z")],
            };
        } else if (date_from) {
            dispatchWhere.dispacthed_at = { [Op.gte]: new Date(date_from) };
        } else if (date_to) {
            dispatchWhere.dispacthed_at = { [Op.lte]: new Date(date_to + "T23:59:59.999Z") };
        }

        // Filter dispatch logs by company through work order
        const companyWoIds = await WorkOrder.findAll({
            where: { company_id },
            attributes: ['id'],
            raw: true,
        });
        const woIds = companyWoIds.map(w => w.id);

        let dispatchByMonth = [];
        if (woIds.length > 0) {
            dispatchWhere.work_order_id = { [Op.in]: woIds };
            dispatchByMonth = await WorkOrderDispatchLog.findAll({
                where: dispatchWhere,
                attributes: [
                    [sequelize.fn('DATE_FORMAT', sequelize.col('dispacthed_at'), '%Y-%m'), 'ym'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                ],
                group: [sequelize.fn('DATE_FORMAT', sequelize.col('dispacthed_at'), '%Y-%m')],
                raw: true,
            });
        }

        // Merge all months into a single sorted array
        const monthMap = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (const r of createdByMonth) {
            if (!r.ym) continue;
            if (!monthMap[r.ym]) monthMap[r.ym] = { created: 0, completed: 0, dispatches: 0 };
            monthMap[r.ym].created = Number(r.count);
        }
        for (const r of completedByMonth) {
            if (!r.ym) continue;
            if (!monthMap[r.ym]) monthMap[r.ym] = { created: 0, completed: 0, dispatches: 0 };
            monthMap[r.ym].completed = Number(r.count);
        }
        for (const r of dispatchByMonth) {
            if (!r.ym) continue;
            if (!monthMap[r.ym]) monthMap[r.ym] = { created: 0, completed: 0, dispatches: 0 };
            monthMap[r.ym].dispatches = Number(r.count);
        }

        const data = Object.keys(monthMap)
            .sort()
            .map(ym => {
                const [, m] = ym.split('-');
                return {
                    month: monthNames[parseInt(m, 10) - 1],
                    ...monthMap[ym],
                };
            });

        return res.status(200).json({
            status: true,
            message: "Monthly trend fetched successfully",
            data,
        });
    } catch (error) {
        console.error("Error getting monthly trend:", error);
        return res.status(500).json({ status: false, message: "Error getting monthly trend", error: error.message });
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

// ── CSV export helpers ──────────────────────────────────────────
const EXPORT_BATCH_SIZE = 200;

function csvEscape(val) {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[,"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

const WO_STATUS_LABELS = {
    1: "Pending",
    2: "In-Progress",
    3: "Material Issued",
    4: "Completed",
    5: "Cancelled",
};

/** Create production planning for a work order
 * Validations:
 * - Only allowed to create planning if it does not already exist for the work order No.
 */
exports.CreateProductionPlanning = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { 
            wo_number, 
            product_id,
            responsible_staff, 
            final_product_variant_id,
            required_quantity,
            planned_quantity,
            planned_start_date,
            planned_end_date,
            process_step,
            shift,
        } = req.body;

        // get company_id from auth middleware
        const company_id = req.user.company_id;
        const isVariantBased = req.user.is_variant_based;
        // validate required fields
        if (!wo_number || !product_id) {
            return res.status(400).json({ status: false, message: "wo_number and product_id are required" });
        } else if (isVariantBased && !final_product_variant_id) {
            return res.status(400).json({ status: false, message: "final_product_variant_id is required for variant based companies" });
        }

        // Check if planning exists, if yes then return with error
        const isPlanningExist = await ProductionPlanning.findOne({
            attributes: ['id'],
            where: { wo_number, company_id },
            transaction,
        });
        if (isPlanningExist) {
            return res.status(400).json({ status: false, message: "Production planning already exists for this work order" });
        }

        // Create production planning record
        await ProductionPlanning.create({
            company_id,
            user_id: req.user.id,
            wo_number: wo_number.trim() || `WO${Date.now()}`,
            responsible_staff: responsible_staff?.trim() || null,
            product_id: Number(product_id),
            final_product_variant_id: Number(final_product_variant_id) || null,
            required_qty: parseInt(required_quantity) || 0,
            planned_qty: parseInt(planned_quantity) || 0,
            planned_start_date: planned_start_date || new Date(),
            planned_end_date: planned_end_date || new Date(),
            process_step: process_step || null,
            shift: shift ? JSON.stringify(shift) : null,
        }, { transaction });

        // Commit the transaction
        await transaction.commit();

        // Return with status 200 and message
        return res.status(200).json({ status: true, message: "Production planning created successfully" });
    } catch (error) {
        console.error("Error creating production planning:", error);
        // Rollback the transaction in case of error
        await transaction.rollback();
        return res.status(500).json({ status: false, message: "Error creating production planning", error: error.message });
    }
}

/** Get all production plannings with pagination
 * Supports pagination, sorting, and searching by work order number and product name
 */
exports.GetAllProductionPlannings = async (req, res) => {
    try {
        const { 
            wo_number,
            responsible_staff,
            from_date,
            to_date,
            product_id, 
            page = 1, 
            limit = 10, 
        } = req.query;
        const company_id = req.user.company_id;

        const where = { company_id };

        // Filter by wo_number and responsible_staff if provided (partial match)
        if (wo_number) {
            where.wo_number = { [Op.like]: `%${wo_number}%` };
        }
        if (responsible_staff) {
            where.responsible_staff = { [Op.like]: `%${responsible_staff}%` };
        }
        // Filter by product_id (exact match on production_planning.product_id = product.id)
        if (product_id) {
            where.product_id = product_id;
        }
        if (from_date && to_date) {
            where.planned_start_date = {
                [Op.gte]: from_date,
                [Op.lte]: to_date,
            };
        }

        // 1. Get total count (NO include, NO group)
        const rowCount = await ProductionPlanning.count({
            where
        });

        // 2. Get paginated data with include and group for completed_qty sum
        const plannings = await ProductionPlanning.findAll({
            attributes: [
                'id',
                'wo_number',
                'responsible_staff',
                'required_qty',
                'planned_qty',
                'planned_start_date',
                'planned_end_date',
                'process_step',
                'shift',
                'created_at',
                [
                    sequelize.fn(
                        'COALESCE',
                        sequelize.fn('SUM', sequelize.col('productionActuals.completed_qty')),
                        0
                    ),
                    'total_completed_qty'
                ]
            ],
            where,
            distinct: true,
            include: [
                {
                    association: 'product',
                    attributes: ['id', 'product_name', 'product_code'],
                },
                {
                    association: 'finalProductVariant',
                    attributes: ['id', 'weight_per_unit'],
                    include: [
                        {
                            association: 'masterUOM',
                            attributes: ['id', 'label'],
                        }
                    ]
                },
                {
                    association: 'createdBy',
                    attributes: ['id', 'name'],
                },
                {
                    association: 'productionActuals', // <-- IMPORTANT
                    attributes: [], // don't fetch rows, just aggregate
                    required: false // LEFT JOIN
                }
            ],
            group: [
                'production_planning.id',
                'product.id',
                'finalProductVariant.id',
                'finalProductVariant->masterUOM.id',
                'createdBy.id'
            ],
            order: [['created_at', 'DESC']],
            subQuery: false
        });

        // Get paginated data
        const paginatedData = CommonHelper.paginate({ rows: plannings, count: rowCount }, page, limit);

        // Return the paginated production plannings
        return res.status(200).json({
            status: true,
            message: "Production plannings fetched successfully",
            data: paginatedData,
        });

    } catch (error) {
        console.error("Error fetching production plannings:", error);
        return res.status(500).json({
            status: false,
            message: "Error fetching production plannings",
            error: error.message
        });
    }
};

/** Get production planning details by ID
 * Returns planning details along with associated product and variant information
 */
exports.GetPlanningById = async (req, res) => {
    try {
        const { id } = req.params;
        const company_id = req.user.company_id;

        const planning = await ProductionPlanning.findOne({
            where: { id, company_id },
            include: [
                {
                    association: 'product',
                    attributes: ['id', 'product_name', 'product_code'],
                },
                {
                    association: 'finalProductVariant',
                    attributes: ['id', 'weight_per_unit'],
                    include: [
                        {
                            association: 'masterUOM',
                            attributes: ['id', 'label'],
                        },
                    ]
                },
                {
                    association: 'createdBy',
                    attributes: ['id', 'name'],
                },
            ],
        });

        if (!planning) {
            return res.status(404).json({ status: false, message: "Production planning not found" });
        }

        return res.status(200).json({
            status: true,
            message: "Production planning fetched successfully",
            data: planning,
        });
    } catch (error) {
        console.error("Error fetching production planning:", error);
        return res.status(500).json({ status: false, message: "Error fetching production planning", error: error.message });
    }
}

/** Update production planning by ID
 * Updates an existing planning row scoped to the authenticated user's company.
 * Rejects wo_number conflicts with other planning rows of the same company.
 */
exports.UpdateProductionPlanning = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const {
            wo_number,
            product_id,
            responsible_staff,
            final_product_variant_id,
            required_quantity,
            planned_quantity,
            planned_start_date,
            planned_end_date,
            process_step,
            shift,
        } = req.body;

        const company_id = req.user.company_id;
        const isVariantBased = req.user.is_variant_based;

        // validate required fields
        if (!wo_number || !product_id) {
            await transaction.rollback();
            return res.status(400).json({ status: false, message: "wo_number and product_id are required" });
        } else if (isVariantBased && !final_product_variant_id) {
            await transaction.rollback();
            return res.status(400).json({ status: false, message: "final_product_variant_id is required for variant based companies" });
        }

        // Find the planning row
        const planning = await ProductionPlanning.findOne({
            where: { id, company_id },
            transaction,
        });
        if (!planning) {
            await transaction.rollback();
            return res.status(404).json({ status: false, message: "Production planning not found" });
        }

        // Reject wo_number collision with another planning row of the same company
        const duplicate = await ProductionPlanning.findOne({
            attributes: ['id'],
            where: {
                wo_number: wo_number.trim(),
                company_id,
                id: { [Op.ne]: planning.id },
            },
            transaction,
        });
        if (duplicate) {
            await transaction.rollback();
            return res.status(400).json({ status: false, message: "Another production planning already exists for this work order number" });
        }

        // Update the planning row
        await planning.update({
            wo_number: wo_number.trim(),
            responsible_staff: responsible_staff?.trim() || null,
            product_id: Number(product_id),
            final_product_variant_id: Number(final_product_variant_id) || null,
            required_qty: parseInt(required_quantity) || 0,
            planned_qty: parseInt(planned_quantity) || 0,
            planned_start_date: planned_start_date || planning.planned_start_date,
            planned_end_date: planned_end_date || planning.planned_end_date,
            process_step: process_step || null,
            shift: shift ? JSON.stringify(shift) : null,
        }, { transaction });

        await transaction.commit();

        return res.status(200).json({ status: true, message: "Production planning updated successfully" });
    } catch (error) {
        console.error("Error updating production planning:", error);
        await transaction.rollback();
        return res.status(500).json({ status: false, message: "Error updating production planning", error: error.message });
    }
}

/** Delete production planning by ID
 * Deletes a planning row scoped to the authenticated user's company.
 */
exports.DeleteProductionPlanning = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        // get the planning ID
        const { id } = req.params;
        // get planning details
        const planning = await ProductionPlanning.findOne({
            where: { id, company_id: req.user.company_id },
            transaction,
        });
        // if planning not found return with error
        if (!planning) {
            await transaction.rollback();
            return res.status(404).json({ status: false, message: "Production planning not found" });
        }

        // delete associated actuals
        await ProductionActuals.destroy({ where: { production_planning_id: planning.id }, transaction });

        // delete the planning
        await planning.destroy({ transaction });

        // commit the transaction
        await transaction.commit();

        // Return with status 200 and message
        return res.status(200).json({ 
            status: true, 
            message: "Production planning deleted successfully" 
        });
    } catch (error) {
        console.error("Error deleting production planning:", error);
        await transaction.rollback();
        return res.status(500).json({ status: false, message: "Error deleting production planning", error: error.message });
    }
}

/** Create production actuals entry for a planning ID
 * Validations:
 * - Planning ID must exist
 * - completed_qty should not exceed the planned_qty of the associated planning
 */
exports.CreateProductionPlanningEntryRecord = async (req, res) => {
    try {
        // get the planning ID from params
        const { planning_id } = req.params;
        // get the input data from request body
        const { completed_qty, work_shift, responsible_staff, entry_date } = req.body;

        // get planning details
        const planning = await ProductionPlanning.findOne({
            attributes: ['id'],
            where: { id: planning_id },
            raw: true,
        });
        // if planning not found return with error
        if (!planning) {
            return res.status(404).json({ status: false, message: "Production planning not found" });
        }

        // Create a new production actuals entry linked to the planning ID
        await ProductionActuals.create({
            production_planning_id: planning_id,
            completed_qty,
            work_shift: work_shift,
            responsible_staff: responsible_staff?.trim() || null,
            user_id: req.user.id,
            entry_date: new Date(entry_date) || null,
        });

        // Return with status 200 and message
        return res.status(200).json({
            status: true,
            message: "Production actuals entry created successfully",
        });
    } catch (error) {
        console.error("Error creating production actuals entry:", error);
        return res.status(500).json({ status: false, message: "Error creating production actuals entry", error: error.message });
    }
}

/** Get production actuals entry records for a planning ID
 * Returns a list of actuals entries linked to the planning ID, sorted by creation date (newest first)
 */
exports.GetProductionPlanningEntryRecordList = async (req, res) => {
    try {
        const { planning_id } = req.params;
        const entryRecords = await ProductionActuals.findAll({
            attributes: ['id', 'completed_qty', 'work_shift', 'responsible_staff', 'entry_date', 'created_at'],
            where: { production_planning_id: planning_id },
            include: [
                {
                    association: 'user',
                    attributes: ['id', 'name'],
                }
            ],
            order: [['created_at', 'DESC']],
        });
        return res.status(200).json({
            status: true,
            message: "Production actuals entry records fetched successfully",
            data: entryRecords,
        });
    } catch (error) {
        console.error("Error fetching production actuals entry records:", error);
        return res.status(500).json({ status: false, message: "Error fetching production actuals entry records", error: error.message });
    }
}
