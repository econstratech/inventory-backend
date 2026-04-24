/**
 * @swagger
 * tags:
 *   name: Production
 *   description: Production and work order endpoints
 */

/**
 * @swagger
 * /api/production/dashboard/monthly-trend:
 *   get:
 *     summary: Get monthly production & dispatch trend
 *     description: |
 *       Returns an array of monthly buckets with counts of work orders created, completed, and dispatches logged.
 *       Used by the Production Dashboard bar chart. Supports optional date range filtering.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from this date (inclusive). Applied to `created_at` for created WOs, `production_completed_at` for completed WOs, and `dispacthed_at` for dispatches.
 *         example: "2026-04-01"
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter up to this date (inclusive, end of day)
 *         example: "2026-04-30"
 *     responses:
 *       200:
 *         description: Monthly trend fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Monthly trend fetched successfully"
 *                 data:
 *                   type: array
 *                   description: One entry per month that has activity, sorted chronologically
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                         description: Abbreviated month name
 *                         example: "Apr"
 *                       created:
 *                         type: integer
 *                         description: Work orders created in this month
 *                         example: 12
 *                       completed:
 *                         type: integer
 *                         description: Work orders whose production was completed in this month
 *                         example: 8
 *                       dispatches:
 *                         type: integer
 *                         description: Dispatch log entries recorded in this month
 *                         example: 5
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error getting monthly trend"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/production/dispatch/stats:
 *   get:
 *     summary: Get dispatch statistics
 *     description: |
 *       Returns aggregated counts and totals for completed work orders (status = 4) grouped by dispatch status.
 *       Supports filtering by due date range and customer.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: due_date_start
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter due dates from this date (inclusive)
 *         example: "2026-01-01"
 *       - in: query
 *         name: due_date_end
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter due dates up to this date (inclusive)
 *         example: "2026-12-31"
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: integer
 *         description: Filter by customer ID
 *     responses:
 *       200:
 *         description: Dispatch stats fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Dispatch stats fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total completed work orders
 *                       example: 25
 *                     pending:
 *                       type: integer
 *                       description: Work orders with dispatch_status = 0 (not yet dispatched)
 *                       example: 10
 *                     in_transit:
 *                       type: integer
 *                       description: Work orders with dispatch_status = 1 (partially completed)
 *                       example: 8
 *                     completed:
 *                       type: integer
 *                       description: Work orders with dispatch_status = 2 (fully completed)
 *                       example: 7
 *                     qty_out:
 *                       type: number
 *                       description: Total dispatched quantity across all dispatch logs
 *                       example: 350
 *                     qty_delivered:
 *                       type: number
 *                       description: Dispatched quantity for fully completed dispatches only
 *                       example: 200
 *                     work_orders:
 *                       type: integer
 *                       description: Count of distinct work orders that have dispatch logs
 *                       example: 15
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/production/dispatch:
 *   get:
 *     summary: Get dispatch list (completed work orders)
 *     description: |
 *       Returns paginated list of completed work orders (status = 4) for dispatch management.
 *       Includes customer, product, warehouse, and production completion details.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Records per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by wo_number, customer name, or product name
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: created_at
 *           enum: [created_at, wo_number, customer_name, product_name]
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort direction
 *       - in: query
 *         name: due_date_start
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter due dates from this date (inclusive)
 *         example: "2026-01-01"
 *       - in: query
 *         name: due_date_end
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter due dates up to this date (inclusive)
 *         example: "2026-12-31"
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: integer
 *         description: Filter by customer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1, 2]
 *         description: Filter by dispatch status (0 = Pending, 1 = Partially Completed, 2 = Fully Completed)
 *     responses:
 *       200:
 *         description: Dispatch list fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Dispatch list fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total_records:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *                         current_page:
 *                           type: integer
 *                         per_page:
 *                           type: integer
 *                     rows:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           wo_number:
 *                             type: string
 *                           planned_qty:
 *                             type: number
 *                           final_qty:
 *                             type: number
 *                             nullable: true
 *                           due_date:
 *                             type: string
 *                             format: date
 *                           dispatch_status:
 *                             type: integer
 *                             description: "0 = Pending, 1 = Partially Completed, 2 = Fully Completed"
 *                           customer:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                           product:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               product_name:
 *                                 type: string
 *                               product_code:
 *                                 type: string
 *                           warehouse:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                           productionCompletedBy:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/production/dispatch/{wo_id}:
 *   post:
 *     summary: Dispatch a work order
 *     description: |
 *       Records a dispatch entry for a completed work order. Creates a log in WorkOrderDispatchLog and updates the work order's `dispatch_status`.
 *       When `dispatch_status` is set to `2` (Fully Completed), the finished goods stock is updated in ProductStockEntry for the work order's warehouse.
 *       Returns 400 if the work order is already fully dispatched.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wo_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Work order ID
 *         example: 123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dispatched_qty
 *               - dispatch_status
 *             properties:
 *               dispatched_qty:
 *                 type: number
 *                 description: Quantity being dispatched (must not exceed final_qty)
 *                 example: 15
 *               dispatch_status:
 *                 type: integer
 *                 description: "1 = Partial Dispatch, 2 = Fully Dispatched"
 *                 enum: [1, 2]
 *                 example: 1
 *               dispatch_note:
 *                 type: string
 *                 nullable: true
 *                 description: Optional dispatch remarks
 *                 example: "First batch shipped via courier"
 *           example:
 *             dispatched_qty: 15
 *             dispatch_status: 1
 *             dispatch_note: "First batch shipped via courier"
 *     responses:
 *       200:
 *         description: Work order dispatched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Work order dispatched successfully"
 *       400:
 *         description: Work order already fully dispatched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Work order already fully dispatched"
 *       404:
 *         description: Work order not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/production/dispatch-history/{wo_id}:
 *   get:
 *     summary: Get dispatch history for a work order
 *     description: Returns all dispatch log entries for a given work order, ordered by most recent first.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wo_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Work order ID
 *         example: 123
 *     responses:
 *       200:
 *         description: Dispatch logs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Work order dispatch logs fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       dispatched_qty:
 *                         type: number
 *                         example: 15
 *                       dispatch_note:
 *                         type: string
 *                         nullable: true
 *                         example: "First batch shipped"
 *                       dispatched_by:
 *                         type: integer
 *                       dispacthed_at:
 *                         type: string
 *                         format: date-time
 *                       dispatchedBy:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                             example: "Sumit"
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/production/planning/create:
 *   post:
 *     summary: Create production planning for a work order
 *     description: |
 *       Creates a `ProductionPlanning` record for the authenticated user's company in a transaction.
 *       The duplicate check uses `wo_number` + `company_id` — if a planning row already exists for that work order number, the request is rejected with **400**.
 *       `planned_start_date` / `planned_end_date` default to the current date when omitted. Numeric fields (`product_id`, `final_product_variant_id`, `required_quantity`, `planned_quantity`) are coerced; missing values fall back to `0` / `null`.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wo_number
 *               - product_id
 *             properties:
 *               wo_number:
 *                 type: string
 *                 description: Work order number this planning is being created for. Used together with `company_id` for the duplicate check.
 *                 example: "WO1713600000000"
 *               product_id:
 *                 type: integer
 *                 description: Final product ID for this planning row.
 *                 example: 12234
 *               final_product_variant_id:
 *                 type: integer
 *                 nullable: true
 *                 description: Final product variant ID (when company is variant-based). Stored as `null` when absent / falsy.
 *                 example: 55
 *               required_quantity:
 *                 type: integer
 *                 description: Required quantity (parsed as integer; defaults to `0` when missing).
 *                 example: 100
 *               planned_quantity:
 *                 type: integer
 *                 description: Planned quantity (parsed as integer; defaults to `0` when missing).
 *                 example: 80
 *               planned_start_date:
 *                 type: string
 *                 format: date
 *                 description: Planned start date. Defaults to current date when omitted.
 *                 example: "2026-04-21"
 *               planned_end_date:
 *                 type: string
 *                 format: date
 *                 description: Planned end date. Defaults to current date when omitted.
 *                 example: "2026-05-15"
 *               process_step:
 *                 type: string
 *                 nullable: true
 *                 description: Optional process step identifier/label for this planning row. Stored as `null` when omitted.
 *                 example: "Cutting"
 *               shift:
 *                 type: array
 *                 nullable: true
 *                 description: Shifts assigned to this planning row. Persisted as a JSON-stringified array (e.g. `'["day","night","evening"]'`). Stored as `null` when omitted.
 *                 items:
 *                   type: string
 *                   enum: [day, night, evening]
 *                 example: ["day", "night", "evening"]
 *           example:
 *             wo_number: "WO1713600000000"
 *             product_id: 12234
 *             final_product_variant_id: 55
 *             required_quantity: 100
 *             planned_quantity: 80
 *             planned_start_date: "2026-04-21"
 *             planned_end_date: "2026-05-15"
 *             process_step: "Cutting"
 *             shift: ["day", "night", "evening"]
 *     responses:
 *       200:
 *         description: Production planning created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Production planning created successfully"
 *       400:
 *         description: Missing required fields, or planning already exists for this work order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Production planning already exists for this work order"
 *             examples:
 *               missing_fields:
 *                 summary: Missing wo_number or product_id
 *                 value:
 *                   status: false
 *                   message: "wo_number and product_id are required"
 *               already_exists:
 *                 summary: Planning already created for this work order
 *                 value:
 *                   status: false
 *                   message: "Production planning already exists for this work order"
 *       500:
 *         description: Server error (transaction rolled back)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error creating production planning"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/production/planning/list:
 *   get:
 *     summary: Get production planning list (paginated)
 *     description: |
 *       Returns paginated `ProductionPlanning` rows for the authenticated user's company, ordered by `created_at` DESC.
 *       Each row includes nested `product` (id, name, code), `finalProductVariant` (id, weight_per_unit + nested `masterUOM`), and `createdBy` (id, name).
 *       Each row also includes `total_completed_qty` — the `COALESCE(SUM(productionActuals.completed_qty), 0)` aggregate across all related `ProductionActual` rows (LEFT JOIN, so rows with no actuals return `0`).
 *       The `shift` field is stored as a JSON-stringified array (e.g. `'["day","night"]'`); clients should `JSON.parse` it before use.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         description: Records per page
 *         example: 10
 *       - in: query
 *         name: wo_number
 *         schema:
 *           type: string
 *         description: Partial match on `wo_number` (SQL `LIKE %value%`)
 *         example: "WO171360"
 *       - in: query
 *         name: responsible_staff
 *         schema:
 *           type: string
 *         description: Partial match on `responsible_staff` (SQL `LIKE %value%`)
 *         example: "Dev Anand"
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: integer
 *         description: Exact match on `production_planning.product_id` (i.e. `product.id`)
 *         example: 12234
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: |
 *           Lower bound (inclusive) for `production_actuals.entry_date`. When either `from_date` or `to_date` is supplied, the query switches to an INNER JOIN on `production_actuals`, so only plannings with at least one actual whose `entry_date` falls in the range are returned. `total_completed_qty` also aggregates only the in-range actuals. This mirrors the Production Planning vs Actual report so counts line up between the two endpoints.
 *         example: "2026-01-22"
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Upper bound (inclusive) for `production_actuals.entry_date`. See `from_date` for join/aggregate semantics.
 *         example: "2026-04-22"
 *     responses:
 *       200:
 *         description: Production plannings fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Production plannings fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total_records:
 *                           type: integer
 *                           example: 24
 *                         total_pages:
 *                           type: integer
 *                           example: 3
 *                         current_page:
 *                           type: integer
 *                           example: 1
 *                         per_page:
 *                           type: integer
 *                           example: 10
 *                         has_next_page:
 *                           type: boolean
 *                           example: true
 *                         has_prev_page:
 *                           type: boolean
 *                           example: false
 *                         next_page:
 *                           type: integer
 *                           nullable: true
 *                           example: 2
 *                         prev_page:
 *                           type: integer
 *                           nullable: true
 *                           example: null
 *                     rows:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 11
 *                           wo_number:
 *                             type: string
 *                             example: "WO1713600000000"
 *                           responsible_staff:
 *                             type: string
 *                             nullable: true
 *                             example: "Dev Anand"
 *                           required_qty:
 *                             type: number
 *                             example: 100
 *                           planned_qty:
 *                             type: number
 *                             example: 80
 *                           total_completed_qty:
 *                             type: number
 *                             description: "Aggregate `COALESCE(SUM(productionActuals.completed_qty), 0)` across all related `ProductionActual` rows. `0` when no actuals exist."
 *                             example: 60
 *                           planned_start_date:
 *                             type: string
 *                             format: date
 *                             example: "2026-04-21"
 *                           planned_end_date:
 *                             type: string
 *                             format: date
 *                             example: "2026-05-15"
 *                           process_step:
 *                             type: string
 *                             nullable: true
 *                             example: "Cutting"
 *                           shift:
 *                             type: string
 *                             nullable: true
 *                             description: JSON-stringified array of shift labels. Parse with `JSON.parse` to get `string[]`.
 *                             example: '["day","night","evening"]'
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-04-20T09:15:32.000Z"
 *                           product:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 12234
 *                               product_name:
 *                                 type: string
 *                                 example: "Corrugated Box"
 *                               product_code:
 *                                 type: string
 *                                 example: "P-12234"
 *                           finalProductVariant:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 55
 *                               weight_per_unit:
 *                                 type: number
 *                                 example: 2.5
 *                               masterUOM:
 *                                 type: object
 *                                 nullable: true
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 3
 *                                   label:
 *                                     type: string
 *                                     example: "kg"
 *                           createdBy:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 7
 *                               name:
 *                                 type: string
 *                                 example: "Sumit"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error fetching production plannings"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/production/planning/{id}:
 *   get:
 *     summary: Get production planning by ID
 *     description: |
 *       Returns a single `ProductionPlanning` row scoped to the authenticated user's company.
 *       Includes nested `product` (id, name, code), `finalProductVariant` (id, weight_per_unit + nested `masterUOM`), and `createdBy` (id, name).
 *       The `shift` field is stored as a JSON-stringified array (e.g. `'["day","night"]'`); clients should `JSON.parse` it before use.
 *       Returns **404** when the row does not exist for this company.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Production planning ID
 *         example: 2
 *     responses:
 *       200:
 *         description: Production planning fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Production planning fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 2
 *                     wo_number:
 *                       type: string
 *                       example: "WO-2026-149268"
 *                     required_qty:
 *                       type: number
 *                       example: 150
 *                     planned_qty:
 *                       type: number
 *                       example: 120
 *                     planned_start_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-04-25"
 *                     planned_end_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-05-28"
 *                     process_step:
 *                       type: string
 *                       nullable: true
 *                       example: "Metal Polishing"
 *                     responsible_staff:
 *                       type: string
 *                       nullable: true
 *                       example: "User ABC"
 *                     shift:
 *                       type: string
 *                       nullable: true
 *                       description: JSON-stringified array of shift labels. Parse with `JSON.parse` to get `string[]`.
 *                       example: '["day","night"]'
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-04-20T07:18:41.000Z"
 *                     product:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 10
 *                         product_name:
 *                           type: string
 *                           example: "Satto"
 *                         product_code:
 *                           type: string
 *                           example: "FG0003"
 *                     finalProductVariant:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 11
 *                         weight_per_unit:
 *                           type: number
 *                           example: 1
 *                         masterUOM:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 1
 *                             label:
 *                               type: string
 *                               example: "kg"
 *                     createdBy:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 159
 *                         name:
 *                           type: string
 *                           example: "Sumit"
 *       404:
 *         description: Production planning not found for this company
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Production planning not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error fetching production planning"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/production/planning/update/{id}:
 *   put:
 *     summary: Update production planning by ID
 *     description: |
 *       Updates an existing `ProductionPlanning` row scoped to the authenticated user's company, in a transaction.
 *       Rejects with **400** when `wo_number` collides with another planning row of the same company (excluding the current row).
 *       When the JWT's `is_variant_based` flag is truthy, `final_product_variant_id` is also required.
 *       `planned_start_date` / `planned_end_date` retain the existing values when omitted. Numeric fields (`product_id`, `final_product_variant_id`, `required_quantity`, `planned_quantity`) are coerced; missing values fall back to `0` / `null`. `shift` is persisted as a JSON-stringified array (e.g. `'["day","night","evening"]'`) or `null`.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Production planning ID
 *         example: 2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wo_number
 *               - product_id
 *             properties:
 *               wo_number:
 *                 type: string
 *                 description: Work order number. Must be unique within the company (excluding the current row).
 *                 example: "WO-2026-149268"
 *               product_id:
 *                 type: integer
 *                 description: Final product ID for this planning row.
 *                 example: 10
 *               final_product_variant_id:
 *                 type: integer
 *                 nullable: true
 *                 description: Final product variant ID. Required when JWT `is_variant_based` is truthy. Stored as `null` when absent / falsy.
 *                 example: 11
 *               responsible_staff:
 *                 type: string
 *                 nullable: true
 *                 description: Responsible person / staff label. Stored as `null` when empty.
 *                 example: "User ABC"
 *               required_quantity:
 *                 type: integer
 *                 description: Required quantity (parsed as integer; defaults to `0` when missing).
 *                 example: 150
 *               planned_quantity:
 *                 type: integer
 *                 description: Planned quantity (parsed as integer; defaults to `0` when missing).
 *                 example: 120
 *               planned_start_date:
 *                 type: string
 *                 format: date
 *                 description: Planned start date. Existing value is retained when omitted.
 *                 example: "2026-04-25"
 *               planned_end_date:
 *                 type: string
 *                 format: date
 *                 description: Planned end date. Existing value is retained when omitted.
 *                 example: "2026-05-28"
 *               process_step:
 *                 type: string
 *                 nullable: true
 *                 description: Process step identifier/label. Stored as `null` when omitted.
 *                 example: "Metal Polishing"
 *               shift:
 *                 type: array
 *                 nullable: true
 *                 description: Shifts assigned to this planning row. Persisted as a JSON-stringified array. Stored as `null` when omitted.
 *                 items:
 *                   type: string
 *                   enum: [day, night, evening]
 *                 example: ["day", "night"]
 *           example:
 *             wo_number: "WO-2026-149268"
 *             product_id: 10
 *             final_product_variant_id: 11
 *             responsible_staff: "User ABC"
 *             required_quantity: 150
 *             planned_quantity: 120
 *             planned_start_date: "2026-04-25"
 *             planned_end_date: "2026-05-28"
 *             process_step: "Metal Polishing"
 *             shift: ["day", "night"]
 *     responses:
 *       200:
 *         description: Production planning updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Production planning updated successfully"
 *       400:
 *         description: Missing required fields, variant required for variant-based company, or wo_number collision
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Another production planning already exists for this work order number"
 *             examples:
 *               missing_fields:
 *                 summary: Missing wo_number or product_id
 *                 value:
 *                   status: false
 *                   message: "wo_number and product_id are required"
 *               variant_required:
 *                 summary: Variant required for variant-based companies
 *                 value:
 *                   status: false
 *                   message: "final_product_variant_id is required for variant based companies"
 *               duplicate_wo_number:
 *                 summary: wo_number collides with another planning row
 *                 value:
 *                   status: false
 *                   message: "Another production planning already exists for this work order number"
 *       404:
 *         description: Production planning not found for this company
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Production planning not found"
 *       500:
 *         description: Server error (transaction rolled back)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error updating production planning"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/production/planning/{planning_id}/entry-record:
 *   post:
 *     summary: Create a production actuals entry for a planning row
 *     description: |
 *       Creates a `ProductionActuals` row linked to the given `planning_id`. The authenticated user is recorded on the entry (`user_id`).
 *       `work_shift` is a single shift label (`day` / `night` / `evening`) and is persisted via `JSON.stringify` (stored as `'"day"'`). `responsible_staff` is trimmed; empty / falsy values are stored as `null`.
 *
 *       **Note on route wiring:** the controller reads `planning_id` from `req.params`. At the time of writing the route is registered as `POST /planning/entry-record` (no path param) — that path will always return **404** because `planning_id` resolves to `undefined`. Use the path-param route above (to be reflected in `ProductionRoute.js`).
 *
 *       **Validation note:** the controller comment mentions "`completed_qty` should not exceed `planned_qty`", but this check is **not** implemented — the planning lookup only fetches `id`. Callers should not rely on the API rejecting over-plan values.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planning_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Production planning ID to attach this actuals entry to
 *         example: 2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - completed_qty
 *             properties:
 *               completed_qty:
 *                 type: number
 *                 description: Quantity completed for this entry.
 *                 example: 10
 *               work_shift:
 *                 type: string
 *                 nullable: true
 *                 enum: [day, night, evening]
 *                 description: Shift this entry applies to. Persisted via `JSON.stringify` (stored as `'"day"'`).
 *                 example: "day"
 *               responsible_staff:
 *                 type: string
 *                 nullable: true
 *                 description: Responsible person / staff label. Trimmed; stored as `null` when empty.
 *                 example: "Sri Prasant Roy"
 *           example:
 *             completed_qty: 10
 *             work_shift: "day"
 *             responsible_staff: "Sri Prasant Roy"
 *     responses:
 *       200:
 *         description: Production actuals entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Production actuals entry created successfully"
 *       404:
 *         description: Production planning not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Production planning not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error creating production actuals entry"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/production/planning/{planning_id}/entry-records:
 *   get:
 *     summary: List production actuals entries for a planning row
 *     description: |
 *       Returns all `ProductionActuals` rows linked to the given `planning_id`, ordered by `created_at` DESC. Each entry is enriched with the `user` association (`id`, `name`) of the person who logged the entry.
 *       `work_shift` is stored via `JSON.stringify` on a single shift label, so values come back as `'"day"'` (JSON-string) — parse with `JSON.parse` before displaying.
 *       No pagination is applied — the full set for the planning is returned.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planning_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Production planning ID whose actuals entries should be listed
 *         example: 2
 *     responses:
 *       200:
 *         description: Production actuals entry records fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Production actuals entry records fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 5
 *                       completed_qty:
 *                         type: number
 *                         example: 10
 *                       work_shift:
 *                         type: string
 *                         nullable: true
 *                         description: JSON-stringified shift label. Parse with `JSON.parse` to get the raw string (`"day"`, `"night"`, or `"evening"`).
 *                         example: '"day"'
 *                       responsible_staff:
 *                         type: string
 *                         nullable: true
 *                         example: "Sri Prasant Roy"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-04-20T10:54:56.000Z"
 *                       user:
 *                         type: object
 *                         nullable: true
 *                         description: User who logged the actuals entry
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 159
 *                           name:
 *                             type: string
 *                             example: "Sumit"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error fetching production actuals entry records"
 *                 error:
 *                   type: string
 */
