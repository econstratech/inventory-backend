/**
 * @swagger
 * tags:
 *   name: Production
 *   description: Production and work order endpoints
 */

/**
 * @swagger
 * /api/production/work-order/create:
 *   post:
 *     summary: Create a new work order
 *     description: |
 *       Creates a work order in a transaction for the authenticated user's company. Auto-generates `wo_number`, sets `status` to `1` (Pending), and `progress_percent` to `0`.
 *       Optionally creates `work_order_steps` rows when `work_order_steps` is non-empty.
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
 *               - customer_id
 *               - warehouse_id
 *               - product_id
 *               - planned_qty
 *               - due_date
 *               - production_step_id
 *             properties:
 *               customer_id:
 *                 type: integer
 *                 description: Customer ID
 *                 example: 125
 *               warehouse_id:
 *                 type: integer
 *                 description: Warehouse/store ID (finished goods store)
 *                 example: 10
 *               product_id:
 *                 type: integer
 *                 description: Product ID
 *                 example: 12234
 *               planned_qty:
 *                 type: number
 *                 description: Planned production quantity
 *                 example: 80
 *               due_date:
 *                 type: string
 *                 format: date
 *                 description: Planned due date
 *                 example: "2026-03-31"
 *               production_step_id:
 *                 type: integer
 *                 description: Current / primary production step (master step id). Use the same ids as `step_id` in `GET /api/company/get-company-production-flow/{companyId}`.
 *                 example: 1
 *               final_product_variant_id:
 *                 type: integer
 *                 nullable: true
 *                 description: Required when company is variant-based (if applicable)
 *               work_order_steps:
 *                 type: array
 *                 description: Ordered steps for this work order (bulk-created as work order steps). Omit or send empty array if none.
 *                 items:
 *                   type: object
 *                   required:
 *                     - step_id
 *                     - sequence
 *                   properties:
 *                     step_id:
 *                       type: integer
 *                       description: Master production step id (same as `step_id` / `step.id` from company production flow API)
 *                       example: 1
 *                     sequence:
 *                       type: integer
 *                       description: Execution order (1 = first)
 *                       example: 1
 *           example:
 *             customer_id: 125
 *             warehouse_id: 10
 *             product_id: 12234
 *             planned_qty: 80
 *             due_date: "2026-03-31"
 *             production_step_id: 1
 *             work_order_steps:
 *               - step_id: 1
 *                 sequence: 1
 *               - step_id: 6
 *                 sequence: 2
 *     responses:
 *       200:
 *         description: Work order created successfully
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
 *                   example: "Work order created successfully"
 *                 data:
 *                   type: object
 *                   description: Newly created work order row (includes auto-set company_id, wo_number, status, progress_percent)
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /api/production/work-order/export:
 *   get:
 *     summary: Export work orders as CSV
 *     description: |
 *       Streams all matching work orders as a CSV file. Supports the same filters as the list endpoint.
 *       Data is fetched in batches of 200 to avoid memory issues and event loop blocking.
 *       Filename format: `work-orders-DDMMYYYY-NNN.csv` where NNN is a 3-digit random number.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled, "1", "2", "3", "4", "5"]
 *         description: Filter by workflow status bucket or numeric status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by wo_number, product name, or customer name
 *       - in: query
 *         name: wo_number
 *         schema:
 *           type: string
 *         description: Exact match on work order number
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: integer
 *         description: Filter by product ID
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: integer
 *         description: Filter by customer ID
 *       - in: query
 *         name: production_step_id
 *         schema:
 *           type: integer
 *         description: Filter by current production step
 *       - in: query
 *         name: due_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by exact due date
 *     responses:
 *       200:
 *         description: CSV file streamed successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: Attachment filename
 *             schema:
 *               type: string
 *               example: 'attachment; filename="work-orders-17042026-531.csv"'
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
 *                   example: "Error exporting work orders"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/production/work-order/stats:
 *   get:
 *     summary: Get work order statistics
 *     description: |
 *       Returns aggregated work order counts grouped by status and the average production progress for the authenticated user's company.
 *       Supports optional date range filtering on `created_at`.
 *
 *       **Status mapping:**
 *       | Value | Label                  |
 *       |-------|------------------------|
 *       | 1     | Pending Material Issue  |
 *       | 2     | Production In-Progress  |
 *       | 3     | Material Issued         |
 *       | 4     | Production Completed    |
 *       | 5     | Cancelled               |
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter work orders created on or after this date (inclusive)
 *         example: "2026-04-01"
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter work orders created on or before this date (inclusive, end of day)
 *         example: "2026-04-30"
 *     responses:
 *       200:
 *         description: Work order stats fetched successfully
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
 *                   example: "Work order stats fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total work orders matching the filter
 *                       example: 42
 *                     pending_material_issue:
 *                       type: integer
 *                       description: Work orders with status 1 (Pending)
 *                       example: 8
 *                     production_in_progress:
 *                       type: integer
 *                       description: Work orders with status 2 (In-Progress)
 *                       example: 12
 *                     material_issued:
 *                       type: integer
 *                       description: Work orders with status 3 (Material Issued)
 *                       example: 5
 *                     production_completed:
 *                       type: integer
 *                       description: Work orders with status 4 (Production Completed)
 *                       example: 15
 *                     cancelled:
 *                       type: integer
 *                       description: Work orders with status 5 (Cancelled)
 *                       example: 2
 *                     avg_production_progress:
 *                       type: number
 *                       description: Average production progress percentage across all matching work orders
 *                       example: 64.75
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
 *                   example: "Error getting work order stats"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/production/work-order/list:
 *   get:
 *     summary: Get work order list (paginated)
 *     description: |
 *       Returns paginated work orders for the authenticated user's company.
 *       Search matches `wo_number`, product name, or customer name.
 *       `status` accepts workflow buckets: `active` (1,2,3), `completed` (4), `cancelled` (5).
 *       **Production step filter:** query param `production_step_id` filters by the work order's current master step. Load filter options from `GET /api/company/get-company-production-flow/{companyId}` — use each row's `step_id` (same as nested `step.id`) as the `production_step_id` value.
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
 *         description: Number of records per page
 *         example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by `wo_number`, `product.product_name`, or `customer.name`
 *         example: "WO123456"
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: created_at
 *           enum: [created_at, due_date, wo_number, customer_name, product_name]
 *         description: Sort field
 *         example: "created_at"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc, ASC, DESC]
 *           default: desc
 *         description: Sort direction
 *         example: "desc"
 *       - in: query
 *         name: wo_number
 *         schema:
 *           type: string
 *         description: Exact match on work order number
 *         example: "WO123456"
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: integer
 *         description: Filter by product ID
 *         example: 12234
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: integer
 *         description: Filter by customer ID
 *         example: 125
 *       - in: query
 *         name: production_step_id
 *         schema:
 *           type: integer
 *         description: Filter by current production step (master step id). Options align with `step_id` / `step.id` from `GET /api/company/get-company-production-flow/{companyId}`.
 *         example: 1
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled]
 *         description: Filter by workflow status bucket
 *         example: "active"
 *       - in: query
 *         name: due_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter rows where `due_date` equals this date (same day)
 *         example: "2026-03-31"
 *     responses:
 *       200:
 *         description: Work orders fetched successfully
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
 *                   example: "Work orders fetched successfully"
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
 *                             example: 101
 *                           wo_number:
 *                             type: string
 *                             example: "WO123456"
 *                           planned_qty:
 *                             type: number
 *                             example: 80
 *                           final_qty:
 *                             type: number
 *                             nullable: true
 *                             description: Final produced quantity (set when production is completed)
 *                             example: 75
 *                           due_date:
 *                             type: string
 *                             format: date
 *                             example: "2026-03-31"
 *                           status:
 *                             type: integer
 *                             example: 1
 *                           material_issued_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           progress_percent:
 *                             type: number
 *                             example: 0
 *                           material_issue_percent:
 *                             type: number
 *                             example: 0
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
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
 *                           customer:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 125
 *                               name:
 *                                 type: string
 *                                 example: "ABC Retail Pvt Ltd"
 *                           warehouse:
 *                             type: object
 *                             nullable: true
 *                             description: Finished goods warehouse/store
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 10
 *                               name:
 *                                 type: string
 *                                 example: "Main Warehouse"
 *                           productionStep:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               name:
 *                                 type: string
 *                                 example: "Printing"
 *                           finalProductVariant:
 *                             type: object
 *                             nullable: true
 *                             description: Present when company is variant-based
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               weight_per_unit:
 *                                 type: number
 *                               masterUOM:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                   label:
 *                                     type: string
 *                           workOrderSteps:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 step_id:
 *                                   type: integer
 *                                 status:
 *                                   type: integer
 *                                   example: 1
 *                                 sequence:
 *                                   type: integer
 *                                 input_qty:
 *                                   type: integer
 *                                   nullable: true
 *                                 output_qty:
 *                                   type: integer
 *                                   nullable: true
 *                                 waste_qty:
 *                                   type: integer
 *                                   nullable: true
 *                                 yield_percent:
 *                                   type: integer
 *                                 step:
 *                                   type: object
 *                                   properties:
 *                                     id:
 *                                       type: integer
 *                                     name:
 *                                       type: string
 *                           materialIssuedBy:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /api/production/work-order/{wo_id}:
 *   get:
 *     summary: Get work order by ID
 *     description: |
 *       Returns a single work order by primary key with nested `product`, `customer`, and `workOrderSteps` (each step includes nested `step` with id and name).
 *       When the authenticated user's JWT includes a truthy `is_variant_based` flag, the response also includes `finalProductVariant` with nested `masterUOM` (`label`).
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
 *         example: 101
 *     responses:
 *       200:
 *         description: Work order fetched successfully
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
 *                   example: "Work order fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 101
 *                     wo_number:
 *                       type: string
 *                       example: "WO123456"
 *                     warehouse_id:
 *                       type: integer
 *                       nullable: true
 *                       example: 10
 *                     planned_qty:
 *                       type: number
 *                       example: 80
 *                     due_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-03-31"
 *                     status:
 *                       type: integer
 *                       description: Work order workflow status code
 *                       example: 1
 *                     product:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 12234
 *                         product_name:
 *                           type: string
 *                           example: "Corrugated Box"
 *                         product_code:
 *                           type: string
 *                           example: "P-12234"
 *                     customer:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 125
 *                         name:
 *                           type: string
 *                           example: "ABC Retail Pvt Ltd"
 *                     warehouse:
 *                       type: object
 *                       nullable: true
 *                       description: Finished goods warehouse/store
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 10
 *                         name:
 *                           type: string
 *                           example: "Main Warehouse"
 *                         city:
 *                           type: string
 *                           example: "Kolkata"
 *                     workOrderSteps:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 501
 *                           step_id:
 *                             type: integer
 *                             description: Company production step id for this work order step
 *                             example: 12
 *                           status:
 *                             type: integer
 *                             example: 1
 *                           sequence:
 *                             type: integer
 *                             example: 1
 *                           input_qty:
 *                             type: integer
 *                             nullable: true
 *                           output_qty:
 *                             type: integer
 *                             nullable: true
 *                           waste_qty:
 *                             type: integer
 *                             nullable: true
 *                           yield_percent:
 *                             type: integer
 *                             nullable: true
 *                           step:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 12
 *                               name:
 *                                 type: string
 *                                 example: "Printing"
 *                     finalProductVariant:
 *                       type: object
 *                       nullable: true
 *                       description: Present only when JWT `is_variant_based` is truthy
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 55
 *                         weight_per_unit:
 *                           type: number
 *                           example: 2.5
 *                         masterUOM:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 3
 *                             label:
 *                               type: string
 *                               example: "kg"
 *       404:
 *         description: Work order not found
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
 *                   example: "Work order not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /api/production/work-order/update/{wo_id}:
 *   put:
 *     summary: Update a work order
 *     description: |
 *       Updates customer, product, planned quantity, due date, current production step (`production_step_id` = `company_production_steps.id`), and optional `final_product_variant_id` when JWT `is_variant_based` is truthy (otherwise `final_product_variant_id` is cleared).
 *       **`work_order_steps`** is replaced (soft-deleted and re-created) only when the work order **`status` is `1` (Pending)**. If the work order has moved past Pending, the same steps (unchanged `step_id` + `sequence`) may be sent to allow header-only updates; sending changed steps returns **400**.
 *       All `step_id` values (including `production_step_id`) must refer to **active** company production steps for the authenticated user's company.
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
 *         example: 101
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - product_id
 *               - planned_qty
 *               - due_date
 *               - production_step_id
 *             properties:
 *               customer_id:
 *                 type: integer
 *                 example: 127375
 *               warehouse_id:
 *                 type: integer
 *                 description: Warehouse/store ID (finished goods store)
 *                 example: 10
 *               product_id:
 *                 type: integer
 *                 example: 11
 *               final_product_variant_id:
 *                 type: integer
 *                 nullable: true
 *                 description: Set when company is variant-based; ignored (stored as null) when not variant-based
 *                 example: 16
 *               planned_qty:
 *                 type: number
 *                 example: 12
 *               due_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-05-10"
 *               production_step_id:
 *                 type: integer
 *                 description: Current company production step id (`company_production_steps.id`)
 *                 example: 2
 *               work_order_steps:
 *                 type: array
 *                 description: Ordered steps; each item needs `step_id` (company production step id) and `sequence`. Replaces existing steps only when work order status is Pending.
 *                 items:
 *                   type: object
 *                   required:
 *                     - step_id
 *                     - sequence
 *                   properties:
 *                     step_id:
 *                       type: integer
 *                       example: 2
 *                     sequence:
 *                       type: integer
 *                       example: 1
 *           example:
 *             customer_id: 127375
 *             warehouse_id: 10
 *             product_id: 11
 *             final_product_variant_id: 16
 *             planned_qty: 12
 *             due_date: "2026-05-10"
 *             production_step_id: 2
 *             work_order_steps:
 *               - step_id: 2
 *                 sequence: 1
 *               - step_id: 4
 *                 sequence: 2
 *               - step_id: 3
 *                 sequence: 3
 *               - step_id: 5
 *                 sequence: 4
 *               - step_id: 6
 *                 sequence: 5
 *     responses:
 *       200:
 *         description: Work order updated successfully
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
 *                   example: "Work order updated successfully"
 *                 data:
 *                   type: object
 *                   description: Updated work order row
 *       400:
 *         description: Validation error, invalid steps, or cannot replace steps after Pending
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
 *                   example: "Cannot replace work order steps after the work order has left Pending status"
 *       404:
 *         description: Work order not found for this company
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
 *                   example: "Work order not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /api/production/work-order/delete/{id}:
 *   delete:
 *     summary: Delete a work order
 *     description: Deletes all work order steps for the work order, then deletes the work order, in a single transaction.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Work order ID
 *         example: 101
 *     responses:
 *       200:
 *         description: Work order deleted successfully
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
 *                   example: "Work order deleted successfully"
 *       404:
 *         description: Work order not found
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
 *                   example: "Work order not found"
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
 *                   example: "Error deleting work order"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/production/work-order/cancel/{wo_id}:
 *   put:
 *     summary: Cancel a work order
 *     description: |
 *       Sets the work order `status` to **5** (Cancelled).
 *       Returns **400** if the work order is already completed (status 4) — completed work orders cannot be cancelled.
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
 *         example: 101
 *     responses:
 *       200:
 *         description: Work order cancelled successfully
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
 *                   example: "Work order cancelled successfully"
 *       400:
 *         description: Completed work order cannot be cancelled
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
 *                   example: "Completed work order cannot be cancelled"
 *       404:
 *         description: Work order not found
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
 *                   example: "Work order not found"
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
 *                   example: "Error cancelling work order"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/production/work-order/bom-list/{wo_id}:
 *   get:
 *     summary: Get BOM list for a work order
 *     description: |
 *       Loads the work order by `wo_id`, then returns master BOM rows for the work order's final product (`final_product_id` = work order `product_id`).
 *       When the work order has `final_product_variant_id`, BOM rows are also filtered by `final_product_variant_id`.
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
 *         example: 101
 *     responses:
 *       200:
 *         description: BOM list fetched successfully
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
 *                   example: "BOM list fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       raw_material_product_id:
 *                         type: integer
 *                         example: 500
 *                       raw_material_variant_id:
 *                         type: integer
 *                         nullable: true
 *                         example: 12
 *                       quantity:
 *                         type: number
 *                         example: 2
 *                       rawMaterialProduct:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                           product_name:
 *                             type: string
 *                             example: "Sheet paper"
 *                           product_code:
 *                             type: string
 *                             example: "RM-001"
 *                       rawMaterialProductVariant:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                           weight_per_unit:
 *                             type: number
 *                             example: 500
 *                           masterUOM:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               label:
 *                                 type: string
 *                                 example: "g"
 *       404:
 *         description: Work order not found
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
 *                   example: "Work order not found"
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
 *                   example: "Error getting BOM list for work order"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/production/work-order/material-issue:
 *   post:
 *     summary: Create or update material issue for a work order
 *     description: |
 *       Creates a raw-material issue entry for a work order. If an issue already exists for the same `wo_id` + `rm_product_id` (+ `rm_product_variant_id` when provided), it updates that record instead of creating a new one.
 *       When a new material issue is created, the work order status is updated to `2` (In-Progress).
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
 *               - wo_id
 *               - rm_product_id
 *               - issued_qty
 *             properties:
 *               wo_id:
 *                 type: integer
 *                 description: Work order ID
 *                 example: 101
 *               rm_product_id:
 *                 type: integer
 *                 description: Raw material product ID
 *                 example: 500
 *               rm_product_variant_id:
 *                 type: integer
 *                 nullable: true
 *                 description: Raw material variant ID (optional)
 *                 example: 12
 *               issued_qty:
 *                 type: number
 *                 description: Issued quantity for this material
 *                 example: 25
 *               batch_id:
 *                 type: integer
 *                 nullable: true
 *                 description: Receive batch ID if issue is from a specific batch
 *                 example: 890
 *           example:
 *             wo_id: 101
 *             rm_product_id: 500
 *             rm_product_variant_id: 12
 *             issued_qty: 25
 *             batch_id: 890
 *     responses:
 *       200:
 *         description: Material issue created/updated successfully
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
 *                   example: "Material issue created successfully"
 *       404:
 *         description: Work order not found
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
 *                   example: "Work order not found"
 *       400:
 *         description: Error creating material issue
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
 *                   example: "Error creating material issue"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/production/work-order/material-issue-complete:
 *   post:
 *     summary: Mark material issue as completed for a work order
 *     description: |
 *       Updates the work order to material-issued state (`status = 3`) and stores the authenticated user in `material_issued_by` with current timestamp in `material_issued_at`.
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
 *               - wo_id
 *             properties:
 *               wo_id:
 *                 type: integer
 *                 description: Work order ID
 *                 example: 101
 *           example:
 *             wo_id: 101
 *     responses:
 *       200:
 *         description: Material issue completed successfully
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
 *                   example: "Material issue completed successfully"
 *       400:
 *         description: Error completing material issue
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
 *                   example: "Error completing material issue"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/production/work-order/complete-production:
 *   post:
 *     summary: Mark work order production as completed
 *     description: |
 *       Sets the work order `status` to **4** (Completed), stores `final_qty`, records `production_completed_at` and `production_completed_by` for the given `wo_id`, scoped to the authenticated user's company.
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
 *               - wo_id
 *               - final_qty
 *             properties:
 *               wo_id:
 *                 type: integer
 *                 description: Work order ID
 *                 example: 2
 *               final_qty:
 *                 type: number
 *                 description: Final produced quantity (must not exceed planned quantity)
 *                 example: 22
 *           example:
 *             wo_id: 2
 *             final_qty: 22
 *     responses:
 *       200:
 *         description: Production marked completed successfully
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
 *                   example: "Production completed successfully"
 *       400:
 *         description: Missing or invalid `wo_id`
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
 *                   example: "wo_id is required"
 *       404:
 *         description: No work order found for this id and company
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
 *                   example: "Work order not found"
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
 *                   example: "Error completing production"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/production/work-order/save-production-data:
 *   post:
 *     summary: Save production step data for a work order
 *     description: |
 *       Saves input/output quantities on a work-order step, calculates `waste_qty` and `yield_percent`, then recalculates work-order `progress_percent`.
 *       Work order status is set to `4` (Completed) when progress reaches 100%, otherwise `3` (Material Issued / In Production).
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
 *               - wo_id
 *               - wo_step_id
 *               - input_qty
 *               - output_qty
 *               - status
 *             properties:
 *               wo_id:
 *                 type: integer
 *                 description: Work order ID
 *                 example: 101
 *               wo_step_id:
 *                 type: integer
 *                 description: Work order step ID to update
 *                 example: 501
 *               input_qty:
 *                 type: number
 *                 description: Input quantity consumed for the step
 *                 example: 100
 *               output_qty:
 *                 type: number
 *                 description: Output quantity produced for the step
 *                 example: 95
 *               status:
 *                 type: integer
 *                 description: Step status to save (typically completed step status)
 *                 example: 3
 *           example:
 *             wo_id: 101
 *             wo_step_id: 501
 *             input_qty: 100
 *             output_qty: 95
 *             status: 3
 *     responses:
 *       200:
 *         description: Production data saved successfully
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
 *                   example: "Production data saved successfully"
 *                 data:
 *                   type: object
 *                   description: Updated work order with latest progress and step quantities for real-time UI refresh
 *       400:
 *         description: Validation or save error
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
 *                   example: "Input quantity and output quantity are required"
 *                 error:
 *                   type: string
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
