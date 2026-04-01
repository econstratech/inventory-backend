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
 *     description: Creates a work order for the authenticated user's company. The API auto-generates `wo_number`, sets `status` to `1` (Pending), and `progress_percent` to `0`.
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
 *               - product_id
 *               - planned_qty
 *               - due_date
 *             properties:
 *               customer_id:
 *                 type: integer
 *                 description: Customer ID
 *                 example: 125
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
 *                 nullable: true
 *                 description: Optional production step ID
 *                 example: 1
 *           example:
 *             customer_id: 125
 *             product_id: 12234
 *             planned_qty: 80
 *             due_date: "2026-03-31"
 *             production_step_id: 1
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
 * /api/production/work-order/list:
 *   get:
 *     summary: Get work order list (paginated)
 *     description: Returns paginated active work orders (`status = 1`) for the authenticated user's company. Supports search by work-order number, product name, or customer name, and custom sorting.
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
 *         description: Sort field (e.g. `created_at`, `due_date`, `wo_number`)
 *         example: "created_at"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc, ASC, DESC]
 *           default: desc
 *         description: Sort direction
 *         example: "desc"
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
 *                           due_date:
 *                             type: string
 *                             format: date
 *                             example: "2026-03-31"
 *                           status:
 *                             type: integer
 *                             example: 1
 *                           progress_percent:
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
