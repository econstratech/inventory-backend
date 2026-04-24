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
 * /api/production/work-order/create-multiple:
 *   post:
 *     summary: Create multiple work orders in one request
 *     description: |
 *       Creates several work orders in a single database transaction for the authenticated user's company.
 *       For each entry, auto-generates `wo_number`, sets `status` to `1` (Pending), and `progress_percent` to `0`.
 *       Optionally creates `work_order_steps` rows per entry when non-empty, and updates `inventory_at_production`
 *       on the matching `ProductStockEntry` when `warehouse_id` is provided.
 *       If any entry fails, the entire batch is rolled back.
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
 *               - work_orders
 *             properties:
 *               work_orders:
 *                 type: array
 *                 description: List of work orders to create (processed in order within one transaction).
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - customer_id
 *                     - warehouse_id
 *                     - product_id
 *                     - planned_qty
 *                     - due_date
 *                     - production_step_id
 *                   properties:
 *                     customer_id:
 *                       type: integer
 *                       description: Customer ID
 *                       example: 125
 *                     warehouse_id:
 *                       type: integer
 *                       description: Warehouse/store ID (finished goods store)
 *                       example: 10
 *                     product_id:
 *                       type: integer
 *                       description: Product ID
 *                       example: 12234
 *                     planned_qty:
 *                       type: number
 *                       description: Planned production quantity
 *                       example: 80
 *                     due_date:
 *                       type: string
 *                       format: date
 *                       description: Planned due date
 *                       example: "2026-03-31"
 *                     production_step_id:
 *                       type: integer
 *                       description: Current / primary production step (master step id).
 *                       example: 1
 *                     final_product_variant_id:
 *                       type: integer
 *                       nullable: true
 *                       description: Required when company is variant-based (if applicable)
 *                     work_order_steps:
 *                       type: array
 *                       description: Ordered steps for this work order. Omit or send empty array if none.
 *                       items:
 *                         type: object
 *                         required:
 *                           - step_id
 *                           - sequence
 *                         properties:
 *                           step_id:
 *                             type: integer
 *                             example: 1
 *                           sequence:
 *                             type: integer
 *                             example: 1
 *           example:
 *             work_orders:
 *               - customer_id: 125
 *                 warehouse_id: 10
 *                 product_id: 12234
 *                 planned_qty: 80
 *                 due_date: "2026-03-31"
 *                 production_step_id: 1
 *                 work_order_steps:
 *                   - step_id: 1
 *                     sequence: 1
 *                   - step_id: 6
 *                     sequence: 2
 *               - customer_id: 126
 *                 warehouse_id: 10
 *                 product_id: 12240
 *                 planned_qty: 120
 *                 due_date: "2026-04-10"
 *                 production_step_id: 1
 *                 work_order_steps:
 *                   - step_id: 1
 *                     sequence: 1
 *     responses:
 *       200:
 *         description: Work orders created successfully
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
 *                   example: "Work orders created successfully"
 *                 count:
 *                   type: integer
 *                   description: Number of work orders created
 *                   example: 2
 *                 data:
 *                   type: array
 *                   description: Newly created work order rows (each includes auto-set company_id, wo_number, status, progress_percent)
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid or empty work_orders array
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
 *                   example: "work_orders must be a non-empty array"
 *       500:
 *         description: Internal server error (entire batch rolled back)
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
 * /api/production/work-order/materials-list/{wo_id}:
 *   get:
 *     summary: Get raw-material list for a work order (mapping-based, no BOM)
 *     description: |
 *       Returns the raw materials required for a work order using the company's
 *       finished-good → raw-material mappings (`work_order_material_mapping`),
 *       not the master BOM. Also returns the finished-good UOM (`fg_uom`) and the
 *       work order with any existing material issues.
 *
 *       Behaviour:
 *         - When the user's company is variant-based and the work order has a
 *           `final_product_variant_id`, the variant's UOM and `weight_per_unit` are
 *           returned as `fg_uom`. Otherwise the product-level UOM is returned with
 *           `weight_per_unit: 1`.
 *         - Material mappings are filtered by `company_id` + `fg_product_id`
 *           (and `fg_product_variant_id` when the work order has one).
 *         - For non-variant-based companies, each raw material also includes
 *           current stock entries (`productStockEntries`) limited to warehouses
 *           flagged as raw-material stores (`is_rm_store = 1`).
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
 *         description: Work order materials list fetched successfully
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
 *                   example: "Work order materials list fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     workOrder:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 101
 *                         product_id:
 *                           type: integer
 *                           example: 12234
 *                         final_product_variant_id:
 *                           type: integer
 *                           nullable: true
 *                           example: 5567
 *                         planned_qty:
 *                           type: number
 *                           example: 100
 *                         status:
 *                           type: integer
 *                           example: 1
 *                         workOrderMaterialIssues:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 21
 *                               rm_product_id:
 *                                 type: integer
 *                                 example: 8891
 *                               rm_product_variant_id:
 *                                 type: integer
 *                                 nullable: true
 *                                 example: 3345
 *                               issued_qty:
 *                                 type: number
 *                                 example: 20
 *                               batch_id:
 *                                 type: integer
 *                                 nullable: true
 *                                 example: 77
 *                               warehouse_id:
 *                                 type: integer
 *                                 example: 9
 *                     fg_uom:
 *                       type: object
 *                       description: Finished-good UOM metadata. For variant-based + variant WO, reflects variant UOM & weight; otherwise product UOM with `weight_per_unit = 1`.
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 3
 *                         label:
 *                           type: string
 *                           example: "kg"
 *                         weight_per_unit:
 *                           type: number
 *                           example: 1
 *                     materialList:
 *                       type: array
 *                       description: Raw materials mapped to the work order's finished good (and variant, when applicable).
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 17
 *                           rm_product_id:
 *                             type: integer
 *                             example: 8891
 *                           rmProduct:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 8891
 *                               product_name:
 *                                 type: string
 *                                 example: "Maida"
 *                               product_code:
 *                                 type: string
 *                                 example: "RM-001"
 *                               productStockEntries:
 *                                 type: array
 *                                 description: Present only for non-variant-based companies. Stock rows are scoped to warehouses flagged `is_rm_store = 1`.
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     id:
 *                                       type: integer
 *                                       example: 55
 *                                     quantity:
 *                                       type: number
 *                                       example: 120
 *                                     warehouse:
 *                                       type: object
 *                                       properties:
 *                                         id:
 *                                           type: integer
 *                                           example: 9
 *                                         name:
 *                                           type: string
 *                                           example: "RM Store A"
 *                                     productVariant:
 *                                       type: object
 *                                       nullable: true
 *                                       properties:
 *                                         id:
 *                                           type: integer
 *                                           example: 3345
 *                                         weight_per_unit:
 *                                           type: number
 *                                           example: 500
 *                                         weight_per_pack:
 *                                           type: number
 *                                           nullable: true
 *                                           example: 10
 *                                         masterUOM:
 *                                           type: object
 *                                           properties:
 *                                             id:
 *                                               type: integer
 *                                               example: 2
 *                                             label:
 *                                               type: string
 *                                               example: "g"
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
 *                   example: "Error getting materials list for work order"
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID of the created or updated `work_order_material_issue` record
 *                       example: 42
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
 * /api/production/work-order/material-issue/{id}:
 *   delete:
 *     summary: Delete a work order material issue record
 *     description: |
 *       Permanently removes a `work_order_material_issue` row by its primary key.
 *       Intended for undoing an individual raw-material issue on a work order
 *       (e.g. the row-level delete in the Material Issue modal). Returns `404`
 *       when no record matches the given id.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the `work_order_material_issue` record to delete
 *         example: 42
 *     responses:
 *       200:
 *         description: Material issue deleted successfully
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
 *                   example: "Material issue deleted successfully"
 *       404:
 *         description: Material issue record not found
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
 *                   example: "Record is not exist"
 *       400:
 *         description: Error deleting the material issue
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
 *                   example: "Error in material delete"
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
 * /api/production/work-order/material-mapping/create:
 *   post:
 *     summary: Create one or more work-order material mappings
 *     description: |
 *       Creates one or more finished-good → raw-material mappings for the authenticated user's company.
 *       `company_id` is derived from the authenticated user.
 *
 *       The request body accepts three shapes:
 *         1. A single mapping object (legacy): `{ fg_product_id, fg_product_variant_id?, rm_product_id }`
 *         2. An object with a `mappings` array: `{ "mappings": [ { ... }, { ... } ] }`
 *         3. A top-level array of mapping objects: `[ { ... }, { ... } ]`
 *
 *       Duplicates within the request are collapsed. If any
 *       `(fg_product_id, fg_product_variant_id, rm_product_id)` triple already exists for the
 *       company, the entire request is rejected with `409` and no rows are created.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required:
 *                   - fg_product_id
 *                   - rm_product_id
 *                 properties:
 *                   fg_product_id:
 *                     type: integer
 *                     description: Finished good product id
 *                     example: 12234
 *                   fg_product_variant_id:
 *                     type: integer
 *                     nullable: true
 *                     description: Optional finished good variant id (when variant-based)
 *                     example: 5567
 *                   rm_product_id:
 *                     type: integer
 *                     description: Raw material product id
 *                     example: 8891
 *               - type: object
 *                 required:
 *                   - mappings
 *                 properties:
 *                   mappings:
 *                     type: array
 *                     minItems: 1
 *                     items:
 *                       type: object
 *                       required:
 *                         - fg_product_id
 *                         - rm_product_id
 *                       properties:
 *                         fg_product_id:
 *                           type: integer
 *                           example: 12234
 *                         fg_product_variant_id:
 *                           type: integer
 *                           nullable: true
 *                           example: 5567
 *                         rm_product_id:
 *                           type: integer
 *                           example: 8891
 *               - type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - fg_product_id
 *                     - rm_product_id
 *                   properties:
 *                     fg_product_id:
 *                       type: integer
 *                       example: 12234
 *                     fg_product_variant_id:
 *                       type: integer
 *                       nullable: true
 *                       example: 5567
 *                     rm_product_id:
 *                       type: integer
 *                       example: 8891
 *           examples:
 *             single:
 *               summary: Single mapping (legacy)
 *               value:
 *                 fg_product_id: 12234
 *                 fg_product_variant_id: 5567
 *                 rm_product_id: 8891
 *             bulkWrapped:
 *               summary: Bulk create via `mappings` wrapper
 *               value:
 *                 mappings:
 *                   - fg_product_id: 12234
 *                     fg_product_variant_id: 5567
 *                     rm_product_id: 8891
 *                   - fg_product_id: 12234
 *                     fg_product_variant_id: null
 *                     rm_product_id: 8892
 *             bulkArray:
 *               summary: Bulk create via top-level array
 *               value:
 *                 - fg_product_id: 12234
 *                   fg_product_variant_id: 5567
 *                   rm_product_id: 8891
 *                 - fg_product_id: 12234
 *                   fg_product_variant_id: null
 *                   rm_product_id: 8892
 *     responses:
 *       201:
 *         description: Material mapping(s) created successfully
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
 *                   example: "2 material mappings created successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing required fields or empty payload
 *       409:
 *         description: One or more duplicate mappings already exist
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
 *                   example: "One or more mappings already exist for this finished good and raw material"
 *                 duplicates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       fg_product_id:
 *                         type: integer
 *                       fg_product_variant_id:
 *                         type: integer
 *                         nullable: true
 *                       rm_product_id:
 *                         type: integer
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/production/work-order/material-mapping/list:
 *   get:
 *     summary: List work-order material mappings (paginated)
 *     description: |
 *       Returns material mappings scoped to the authenticated user's company. Supports
 *       pagination, free-text search on finished-good / raw-material name and code, and
 *       exact-match filters.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         description: Search finished-good / raw-material name or code.
 *         schema: { type: string }
 *       - in: query
 *         name: fg_product_id
 *         schema: { type: integer }
 *       - in: query
 *         name: fg_product_variant_id
 *         schema: { type: integer }
 *       - in: query
 *         name: rm_product_id
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Material mappings fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   description: Paginated result (rows + pagination meta via CommonHelper.paginate)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/production/work-order/material-mapping/{id}:
 *   get:
 *     summary: Get a work-order material mapping by id
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Material mapping fetched successfully
 *       404:
 *         description: Material mapping not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/production/work-order/material-mapping/update/{id}:
 *   put:
 *     summary: Update a work-order material mapping
 *     description: |
 *       Any of `fg_product_id`, `fg_product_variant_id`, `rm_product_id` may be supplied; omitted
 *       fields keep their previous value. `company_id` is enforced server-side and cannot be changed.
 *       Returns `409` if the updated triple collides with another mapping in the same company.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fg_product_id:
 *                 type: integer
 *               fg_product_variant_id:
 *                 type: integer
 *                 nullable: true
 *               rm_product_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Material mapping updated successfully
 *       404:
 *         description: Material mapping not found
 *       409:
 *         description: Duplicate mapping already exists for another record
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/production/work-order/material-mapping/delete/{id}:
 *   delete:
 *     summary: Soft-delete a work-order material mapping
 *     description: Paranoid delete — sets `deleted_at` rather than removing the row.
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Material mapping deleted successfully
 *       404:
 *         description: Material mapping not found
 *       500:
 *         description: Internal server error
 */
