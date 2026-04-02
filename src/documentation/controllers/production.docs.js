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
 *               - product_id
 *               - planned_qty
 *               - due_date
 *               - production_step_id
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
 * /api/production/work-order/list:
 *   get:
 *     summary: Get work order list (paginated)
 *     description: |
 *       Returns paginated work orders for the authenticated user's company. Default `status` filter is `1` (pending); pass `status` to override.
 *       Search matches `wo_number`, product name, or customer name.
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
 *           type: integer
 *         description: Overrides default pending-only filter when provided
 *         example: 1
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
