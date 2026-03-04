/**
 * @swagger
 * tags:
 *   name: Purchase
 *   description: Purchase order management endpoints
 */

/**
 * @swagger
 * /api/purchase/add:
 *   post:
 *     summary: Create a new purchase order
 *     description: Creates a new purchase order with associated products. A unique reference number is automatically generated. The purchase order total amount is calculated from the products and updated automatically.
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendor_id
 *               - products
 *               - total_amount
 *               - untaxed_amount
 *             properties:
 *               vendor_id:
 *                 type: integer
 *                 description: Vendor ID
 *                 example: 5
 *               vendor_reference:
 *                 type: string
 *                 description: Vendor reference number
 *                 example: "VEND-REF-001"
 *               expected_arrival:
 *                 type: string
 *                 format: date
 *                 description: Expected arrival date
 *                 example: "2026-02-15"
 *               buyer:
 *                 type: integer
 *                 description: Buyer user ID (optional)
 *                 example: 10
 *                 nullable: true
 *               total_amount:
 *                 type: number
 *                 format: decimal
 *                 description: Total amount including tax
 *                 example: 15000.50
 *               untaxed_amount:
 *                 type: number
 *                 format: decimal
 *                 description: Total amount excluding tax
 *                 example: 12711.86
 *               is_parent:
 *                 type: integer
 *                 description: Whether this is a parent purchase order (0 or 1)
 *                 example: 0
 *               is_parent_id:
 *                 type: integer
 *                 description: Parent purchase order ID if this is a child order
 *                 example: null
 *                 nullable: true
 *               warehouse_id:
 *                 type: integer
 *                 description: Warehouse ID (optional)
 *                 example: 1
 *                 nullable: true
 *               mailsend_status:
 *                 type: string
 *                 description: Mail send status (defaults to '0')
 *                 example: "0"
 *               sales_quotation_id:
 *                 type: integer
 *                 description: Associated sales quotation ID (optional)
 *                 example: 100
 *                 nullable: true
 *               products:
 *                 type: array
 *                 description: Array of products to add to the purchase order
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - qty
 *                     - unit_price
 *                     - tax
 *                     - taxExcl
 *                     - taxIncl
 *                     - taxAmount
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                       description: Product ID
 *                       example: 12
 *                     description:
 *                       type: string
 *                       description: Product description
 *                       example: "High quality product"
 *                     qty:
 *                       type: integer
 *                       description: Quantity
 *                       example: 50
 *                     unit_price:
 *                       type: number
 *                       format: decimal
 *                       description: Unit price
 *                       example: 100.00
 *                     tax:
 *                       type: integer
 *                       description: Tax percentage
 *                       example: 18
 *                     taxExcl:
 *                       type: number
 *                       format: decimal
 *                       description: Amount excluding tax
 *                       example: 5000.00
 *                     taxIncl:
 *                       type: number
 *                       format: decimal
 *                       description: Amount including tax
 *                       example: 5900.00
 *                     taxAmount:
 *                       type: number
 *                       format: decimal
 *                       description: Tax amount
 *                       example: 900.00
 *           example:
 *             vendor_id: 5
 *             vendor_reference: "VEND-REF-001"
 *             expected_arrival: "2026-02-15"
 *             buyer: 10
 *             total_amount: 15000.50
 *             untaxed_amount: 12711.86
 *             is_parent: 0
 *             is_parent_id: null
 *             warehouse_id: 1
 *             mailsend_status: "0"
 *             sales_quotation_id: 100
 *             products:
 *               - product_id: 12
 *                 description: "High quality product"
 *                 qty: 50
 *                 unit_price: 100.00
 *                 tax: 18
 *                 taxExcl: 5000.00
 *                 taxIncl: 5900.00
 *                 taxAmount: 900.00
 *               - product_id: 16
 *                 description: "Another product"
 *                 qty: 30
 *                 unit_price: 150.00
 *                 tax: 18
 *                 taxExcl: 4500.00
 *                 taxIncl: 5310.00
 *                 taxAmount: 810.00
 *     responses:
 *       201:
 *         description: Purchase order created successfully
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
 *                   example: "Purchase created successfully"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An error occurred while creating the purchase and products"
 */

/**
 * @swagger
 * /api/purchase/all-purchase:
 *   get:
 *     summary: Get all purchase orders
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of purchase orders
 */

/**
 * @swagger
 * /api/purchase/purchase/{id}:
 *   get:
 *     summary: Get a specific purchase order by ID
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase Order ID
 *     responses:
 *       200:
 *         description: Purchase order details
 */

/**
 * @swagger
 * /api/purchase/fetch-details:
 *   get:
 *     summary: Get a particular purchase order by query params
 *     description: Fetches purchase order details. At least one query parameter is required. Supports filtering by id, reference_number, and/or status. Returns the same structure as GET /purchase/purchase/:id (including recv, products with received/available_quantity, vendor, warehouse).
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         description: Purchase order ID
 *         example: 123
 *       - in: query
 *         name: reference_number
 *         schema:
 *           type: string
 *         description: Purchase reference number
 *         example: "PO-001"
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: Purchase status
 *         example: 10
 *     responses:
 *       200:
 *         description: Purchase order details
 *       400:
 *         description: At least one filter required (id, reference_number, or status)
 *       404:
 *         description: Purchase not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/purchase/update/{id}:
 *   put:
 *     summary: Update a purchase order
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Purchase order updated successfully
 */

/**
 * @swagger
 * /api/purchase/{id}:
 *   delete:
 *     summary: Delete a purchase order
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase Order ID
 *     responses:
 *       200:
 *         description: Purchase order deleted successfully
 */

/**
 * @swagger
 * /api/purchase/cancel-purchase/{id}:
 *   post:
 *     summary: Cancel a purchase order
 *     description: Cancels a purchase order by setting status to 8. Only allowed when the purchase is not already cancelled or completed (status must not be 8, 9, or 10). Optionally stores cancellation remarks. Sets cancelled_by and cancelled_at on the purchase record.
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase Order ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *                 description: Optional cancellation remarks (stored in Remarks table)
 *                 example: "Cancelled due to vendor delay"
 *     responses:
 *       200:
 *         description: Purchase order canceled successfully
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
 *                   example: "Purchase order canceled successfully"
 *       400:
 *         description: Purchase is not in under review stage (already cancelled or completed, status 8/9/10)
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
 *                   example: "Purchase is not in under review stage"
 *       404:
 *         description: Purchase not found
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
 *                   example: "Purchase not found"
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
 *                   example: "An error occurred while canceling the purchase order"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/purchase/statuschange/{id}/{sid}:
 *   put:
 *     summary: Update purchase order status
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: false
 *         schema:
 *           type: integer
 *         description: Status ID
 *         default: 2
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase Order ID
 *       - in: path
 *         name: sid
 *         required: true
 *         schema:
 *           type: integer
 *         description: Status ID
 *     responses:
 *       200:
 *         description: Status updated successfully
 */

/**
 * @swagger
 * /api/purchase/pending-approval:
 *   get:
 *     summary: Get pending approval purchase orders
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending approval orders
 */

/**
 * @swagger
 * /api/purchase/final-approval:
 *   get:
 *     summary: Get final approval purchase orders
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of final approval orders
 */

/**
 * @swagger
 * /api/purchase/all-purchase-rfq:
 *   get:
 *     summary: Get all purchase orders with RFQ status
 *     description: Retrieves paginated list of purchase orders with RFQ status (status = 2, excluding status = 0). Includes associated products and vendor information.
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           default: 2
 *         description: Status ID
 *         example: 2
 *       - in: query
 *         name: reference_number
 *         schema:
 *           type: string
 *         description: Reference number
 *         example: "RFQ-2026-001"
 *       - in: query
 *         name: expected_arrival_start
 *         schema:
 *           type: string
 *           format: date
 *         description: Expected arrival start date
 *         example: "2026-01-01"
 *       - in: query
 *         name: expected_arrival_end
 *         schema:
 *           type: string
 *           format: date
 *         description: Expected arrival end date
 *         example: "2026-01-31"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Purchase records fetched successfully
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
 *                   example: "Purchase records fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       description: Array of purchase records
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           reference_number:
 *                             type: string
 *                             example: "PO-2026-001"
 *                           vendor_id:
 *                             type: integer
 *                             example: 5
 *                           vendor_reference:
 *                             type: string
 *                             example: "VEND-REF-001"
 *                           order_dateline:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-02-01T00:00:00.000Z"
 *                           expected_arrival:
 *                             type: string
 *                             example: "2026-02-15"
 *                           buyer:
 *                             type: integer
 *                             example: 10
 *                           source_document:
 *                             type: string
 *                             example: "RFQ-001"
 *                           payment_terms:
 *                             type: string
 *                             example: "Net 30"
 *                           user_id:
 *                             type: integer
 *                             example: 1
 *                           total_amount:
 *                             type: number
 *                             format: decimal
 *                             example: 15000.50
 *                           untaxed_amount:
 *                             type: number
 *                             format: decimal
 *                             example: 12711.86
 *                           company_id:
 *                             type: integer
 *                             example: 1
 *                           is_parent_id:
 *                             type: integer
 *                             example: null
 *                           is_parent:
 *                             type: integer
 *                             example: 0
 *                           parent_recd_id:
 *                             type: integer
 *                             example: null
 *                           status:
 *                             type: integer
 *                             example: 2
 *                             description: "2 = RFQ status"
 *                           mailsend_status:
 *                             type: integer
 *                             example: 0
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-01-19T10:30:00.000Z"
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-01-19T10:30:00.000Z"
 *                           products:
 *                             type: array
 *                             description: Associated purchase products
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   example: 1
 *                                 purchase_id:
 *                                   type: integer
 *                                   example: 1
 *                                 product_id:
 *                                   type: integer
 *                                   example: 12
 *                                 description:
 *                                   type: string
 *                                   example: "Product description"
 *                                 qty:
 *                                   type: integer
 *                                   example: 50
 *                                 unit_price:
 *                                   type: number
 *                                   format: decimal
 *                                   example: 100.00
 *                                 tax:
 *                                   type: integer
 *                                   example: 18
 *                                 taxExcl:
 *                                   type: integer
 *                                   example: 0
 *                                 vendor_id:
 *                                   type: integer
 *                                   example: 5
 *                                 taxIncl:
 *                                   type: number
 *                                   format: decimal
 *                                   example: 118.00
 *                                 user_id:
 *                                   type: integer
 *                                   example: 1
 *                                 company_id:
 *                                   type: integer
 *                                   example: 1
 *                                 status:
 *                                   type: integer
 *                                   example: 2
 *                                 created_at:
 *                                   type: string
 *                                   format: date-time
 *                                   example: "2026-01-19T10:30:00.000Z"
 *                                 updated_at:
 *                                   type: string
 *                                   format: date-time
 *                                   example: "2026-01-19T10:30:00.000Z"
 *                           vendor:
 *                             type: object
 *                             description: Associated vendor information
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 5
 *                               name:
 *                                 type: string
 *                                 example: "ABC Suppliers"
 *                               email:
 *                                 type: string
 *                                 example: "contact@abcsuppliers.com"
 *                               phone:
 *                                 type: string
 *                                 example: "+1234567890"
 *                     total:
 *                       type: integer
 *                       example: 25
 *                       description: Total number of records
 *                     page:
 *                       type: integer
 *                       example: 1
 *                       description: Current page number
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                       description: Number of records per page
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                       description: Total number of pages
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
 *                   example: "An error occurred while fetching the purchase records"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/purchase/{pid}/item/{id}:
 *   delete:
 *     summary: Delete individual item from a purchase order
 *     description: Deletes a specific purchase product item from a purchase order. The purchase total amount will be recalculated after deletion.
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase Order ID
 *         example: 1
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase Product Item ID to delete
 *         example: 5
 *     responses:
 *       200:
 *         description: Purchase item deleted successfully
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
 *                   example: "Purchase item deleted successfully"
 *       400:
 *         description: Bad request - Invalid purchase ID or item ID
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
 *                   example: "Invalid purchase ID or item ID"
 *       404:
 *         description: Purchase or item not found
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
 *                   example: "Purchase or item not found"
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
 *                   example: "An error occurred while deleting the purchase item"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/purchase/approved-by-management/{id}:
 *   put:
 *     summary: Update and approve purchase order by management
 *     description: Updates purchase order products (quantity, unit price, tax) and approves the purchase order. Creates remarks entry and updates status to approved.
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase Order ID
 *         example: 191
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - products
 *             properties:
 *               products:
 *                 type: array
 *                 description: Array of products to update
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - qty
 *                     - unit_price
 *                     - tax
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 655
 *                       description: Purchase Product Item ID
 *                     qty:
 *                       type: integer
 *                       example: 55
 *                       description: Updated quantity
 *                     unit_price:
 *                       type: string
 *                       example: "150.00"
 *                       description: Updated unit price
 *                     tax:
 *                       type: integer
 *                       example: 18
 *                       description: Tax percentage
 *               remarks:
 *                 type: string
 *                 example: "Purchase order is updated."
 *                 description: Remarks for approval (optional)
 *               send_to_vendor:
 *                 type: boolean
 *                 example: true
 *                 description: Send to vendor (optional)
 *           example:
 *             products:
 *               - id: 655
 *                 qty: 55
 *                 unit_price: "150.00"
 *                 tax: 18
 *             remarks: "Purchase order is updated."
 *     responses:
 *       200:
 *         description: Purchase order updated and approved successfully
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
 *                   example: "Purchase order updated and approved successfully"
 *       400:
 *         description: Bad request - Invalid input data
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
 *                   example: "Invalid request body or purchase ID mismatch"
 *       404:
 *         description: Purchase order not found
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
 *                   example: "Purchase order not found"
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
 *                   example: "An error occurred while updating and approving the purchase order"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/purchase/rejected-by-management/{id}:
 *   put:
 *     summary: Update and reject purchase order by management
 *     description: Rejects the purchase order by updating the status to rejected. Creates remarks entry and updates status to rejected.
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase Order ID
 *         example: 191
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *                 example: "Purchase order is updated."
 *                 description: Remarks for approval (optional)
 *           example:
 *             remarks: "Purchase order is rejected."
 *     responses:
 *       200:
 *         description: Purchase order updated and rejected successfully
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
 *                   example: "Purchase order updated and rejected successfully"
 *       400:
 *         description: Bad request - Invalid input data
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
 *                   example: "Invalid request body or purchase ID mismatch"
 *       404:
 *         description: Purchase order not found
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
 *                   example: "Purchase order not found"
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
 *                   example: "An error occurred while updating and approving the purchase order"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */
