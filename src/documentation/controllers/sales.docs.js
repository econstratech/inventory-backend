/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Sales order management endpoints
 */

/**
 * @swagger
 * /api/sales/add:
 *   post:
 *     summary: Create a new sales order
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer_id:
 *                 type: integer
 *               sales_date:
 *                 type: string
 *                 format: date
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Sales order created successfully
 */

/**
 * @swagger
 * /api/sales/getAllPurchaseOrder:
 *   get:
 *     summary: Get all sales orders
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sales orders
 */

/**
 * @swagger
 * /api/sales/getPurchase/{id}:
 *   get:
 *     summary: Get a specific sales order by ID
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sales Order ID
 *     responses:
 *       200:
 *         description: Sales order details
 */

/**
 * @swagger
 * /api/sales/update/{id}:
 *   post:
 *     summary: Update a sales order
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sales Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Sales order updated successfully
 */

/**
 * @swagger
 * /api/sales/delete/{id}:
 *   delete:
 *     summary: Delete a sales order
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sales Order ID
 *     responses:
 *       200:
 *         description: Sales order deleted successfully
 */

/**
 * @swagger
 * /api/sales/fetch-details:
 *   get:
 *     summary: Fetch sales details with available batches
 *     description: Returns a sales order by reference number with products, product data, and available batches per warehouse including batch tracking logs.
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reference_number
 *         required: true
 *         schema:
 *           type: string
 *         description: Sales order reference number
 *         example: "S3296528"
 *     responses:
 *       200:
 *         description: Sales details fetched successfully
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
 *                   example: "Sales details fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 85
 *                     reference_number:
 *                       type: string
 *                       example: "S3296528"
 *                     expected_delivery_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-03-12"
 *                     payment_terms:
 *                       type: string
 *                       example: "80"
 *                     total_amount:
 *                       type: string
 *                       example: "33040.00"
 *                     is_parent:
 *                       type: integer
 *                       example: 1
 *                     status:
 *                       type: integer
 *                       example: 2
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-20T07:00:51.000Z"
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 152
 *                           warehouse_id:
 *                             type: integer
 *                             example: 10
 *                           description:
 *                             type: string
 *                             example: "SKU006"
 *                           qty:
 *                             type: integer
 *                             example: 20
 *                           unit_price:
 *                             type: string
 *                             example: "500.00"
 *                           tax:
 *                             type: integer
 *                             example: 18
 *                           taxExcl:
 *                             type: string
 *                             example: "10000.00"
 *                           taxIncl:
 *                             type: string
 *                             example: "11800.00"
 *                           taxAmount:
 *                             type: string
 *                             example: "1800"
 *                           productData:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 2623
 *                               product_name:
 *                                 type: string
 *                                 example: "SKU006"
 *                               product_code:
 *                                 type: string
 *                                 example: "SKU6"
 *                               batches:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     id:
 *                                       type: integer
 *                                       example: 7
 *                                     product_id:
 *                                       type: integer
 *                                       example: 74
 *                                     batch_no:
 *                                       type: string
 *                                       example: "T889573"
 *                                     manufacture_date:
 *                                       type: string
 *                                       format: date
 *                                       example: "2025-11-14"
 *                                     expiry_date:
 *                                       type: string
 *                                       format: date
 *                                       example: "2026-05-22"
 *                                     quantity:
 *                                       type: integer
 *                                       example: 9
 *                                     available_quantity:
 *                                       type: integer
 *                                       example: 4
 *                                     trackBatchProductLogs:
 *                                       type: array
 *                                       items:
 *                                         type: object
 *                                         properties:
 *                                           id:
 *                                             type: integer
 *                                             example: 1
 *                                           status:
 *                                             type: integer
 *                                             example: 1
 *                                           quantity:
 *                                             type: integer
 *                                             example: 5
 *       500:
 *         description: An error occurred while fetching the sales details
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
 *                   example: "An error occurred while fetching the sales details"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/sales/all-sale-quotation:
 *   get:
 *     summary: Get all sales quotations with pagination and filters
 *     description: Retrieves paginated list of sales quotations with status 2, 3, 4, or 5. Supports filtering by status, reference number, and expected delivery date range. Includes associated warehouse and customer information.
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *           minimum: 1
 *         description: Number of records per page
 *         example: 15
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: Filter by status (2, 3, 4, or 5). If not provided, returns all statuses.
 *         example: 2
 *       - in: query
 *         name: reference_number
 *         schema:
 *           type: string
 *         description: Filter by exact reference number match
 *         example: "SQ-2026-001"
 *       - in: query
 *         name: expected_delivery_date_start
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for expected delivery date filter (must be used with expected_delivery_date_end)
 *         example: "2026-01-01"
 *       - in: query
 *         name: expected_delivery_date_end
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for expected delivery date filter (must be used with expected_delivery_date_start)
 *         example: "2026-01-31"
 *     responses:
 *       200:
 *         description: Sales quotations fetched successfully
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
 *                   example: "Sales Quotations fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       description: Array of sales quotations
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           reference_number:
 *                             type: string
 *                             example: "SQ-2026-001"
 *                           expected_delivery_date:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-02-15T00:00:00.000Z"
 *                           payment_terms:
 *                             type: string
 *                             example: "Net 30"
 *                           total_amount:
 *                             type: number
 *                             format: decimal
 *                             example: 25000.50
 *                           is_parent:
 *                             type: integer
 *                             example: 1
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-01-19T10:30:00.000Z"
 *                           warehouse:
 *                             type: object
 *                             description: Associated warehouse information
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               name:
 *                                 type: string
 *                                 example: "Main Warehouse"
 *                           customer:
 *                             type: object
 *                             description: Associated customer information
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 5
 *                               name:
 *                                 type: string
 *                                 example: "ABC Corporation"
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
 *                       example: 15
 *                       description: Number of records per page
 *                     totalPages:
 *                       type: integer
 *                       example: 2
 *                       description: Total number of pages
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Page number must be greater than 0"
 *                   description: Error message indicating validation failure
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An error occurred while fetching the products"
 */

/**
 * @swagger
 * /api/sales/sales/{id}:
 *   get:
 *     summary: Get a specific sales quotation by ID
 *     description: Retrieves detailed information about a specific sales quotation including associated products, customer, and warehouse. When type='dispatch' is provided, product relations (UOM, category, attributes) are excluded for performance optimization.
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sales Quotation ID
 *         example: 191
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [dispatch]
 *         description: Optional parameter. When set to 'dispatch', excludes product relations (UOM, category, attributes) for better performance.
 *         example: dispatch
 *     responses:
 *       200:
 *         description: Sales quotation fetched successfully
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
 *                   example: "Sales Quotation fetched successfully"
 *                 data:
 *                   type: object
 *                   description: Sales quotation details with associated data
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 191
 *                     reference_number:
 *                       type: string
 *                       example: "SQ-2026-001"
 *                     customer_id:
 *                       type: integer
 *                       example: 5
 *                     customer_reference:
 *                       type: string
 *                       example: "CUST-REF-001"
 *                     expiration:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-03-15T00:00:00.000Z"
 *                     dalivery_date:
 *                       type: string
 *                       example: "2026-02-20"
 *                     buyer:
 *                       type: integer
 *                       example: 10
 *                     source_document:
 *                       type: string
 *                       example: "PO-2026-001"
 *                     payment_terms:
 *                       type: string
 *                       example: "Net 30"
 *                     warehouse_id:
 *                       type: integer
 *                       example: 1
 *                     expected_delivery_date:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-15T00:00:00.000Z"
 *                     total_amount:
 *                       type: number
 *                       format: decimal
 *                       example: 25000.50
 *                     untaxed_amount:
 *                       type: number
 *                       format: decimal
 *                       example: 21186.44
 *                     status:
 *                       type: integer
 *                       example: 2
 *                     mailsend_status:
 *                       type: integer
 *                       example: 0
 *                     is_parent:
 *                       type: integer
 *                       example: 1
 *                     is_parent_id:
 *                       type: integer
 *                       example: null
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-19T10:30:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-19T10:30:00.000Z"
 *                     products:
 *                       type: array
 *                       description: Array of products in the sales quotation
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 655
 *                           status:
 *                             type: integer
 *                             example: 2
 *                           product_id:
 *                             type: integer
 *                             example: 12
 *                           qty:
 *                             type: integer
 *                             example: 50
 *                           unit_price:
 *                             type: number
 *                             format: decimal
 *                             example: 150.00
 *                           taxExcl:
 *                             type: integer
 *                             example: 0
 *                           taxIncl:
 *                             type: number
 *                             format: decimal
 *                             example: 177.00
 *                           tax:
 *                             type: integer
 *                             example: 18
 *                           description:
 *                             type: string
 *                             example: "Product description"
 *                           is_dispatched:
 *                             type: boolean
 *                             example: false
 *                           productData:
 *                             type: object
 *                             description: Product details (relations excluded when type='dispatch')
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 12
 *                               product_name:
 *                                 type: string
 *                                 example: "Product Name"
 *                               product_code:
 *                                 type: string
 *                                 example: "PROD-001"
 *                               sku_product:
 *                                 type: string
 *                                 example: "SKU-001"
 *                               masterUOM:
 *                                 type: object
 *                                 description: Unit of measurement (excluded when type='dispatch')
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 1
 *                                   name:
 *                                     type: string
 *                                     example: "Piece"
 *                                   label:
 *                                     type: string
 *                                     example: "PCS"
 *                               productCategory:
 *                                 type: object
 *                                 description: Product category (excluded when type='dispatch')
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 1
 *                                   title:
 *                                     type: string
 *                                     example: "Category Name"
 *                               productAttributeValues:
 *                                 type: array
 *                                 description: Product attribute values (excluded when type='dispatch')
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     id:
 *                                       type: integer
 *                                       example: 1
 *                                     product_attribute_id:
 *                                       type: integer
 *                                       example: 1
 *                                     value:
 *                                       type: string
 *                                       example: "Red"
 *                                     productAttribute:
 *                                       type: object
 *                                       properties:
 *                                         id:
 *                                           type: integer
 *                                           example: 1
 *                                         name:
 *                                           type: string
 *                                           example: "Color"
 *                                         is_required:
 *                                           type: integer
 *                                           example: 1
 *                     customer:
 *                       type: object
 *                       description: Associated customer information
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 5
 *                         name:
 *                           type: string
 *                           example: "ABC Corporation"
 *                     warehouse:
 *                       type: object
 *                       description: Associated warehouse information
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: "Main Warehouse"
 *       404:
 *         description: Sales quotation not found
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
 *                   example: "Sales Quotation not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An error occurred while fetching the purchase"
 */

/**
 * @swagger
 * /api/sales/approved-by-management/{id}:
 *   put:
 *     summary: Update and approve sales quotation by management
 *     description: Updates sales quotation products (quantity, unit price, tax) and approves the sales quotation. Creates remarks entry and updates status to approved (4).
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sales Quotation ID
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
 *                       description: Sales Product ID
 *                       example: 140
 *                     qty:
 *                       type: number
 *                       description: Quantity
 *                       example: 45
 *                     unit_price:
 *                       type: number
 *                       description: Unit price
 *                       example: 500
 *                     tax:
 *                       type: number
 *                       description: Tax percentage
 *                       example: 18
 *               remarks:
 *                 type: string
 *                 description: Remarks for approval
 *                 example: "Approved by management"
 *           example:
 *             products:
 *               - id: 140
 *                 qty: 45
 *                 unit_price: 500
 *                 tax: 18
 *               - id: 141
 *                 qty: 50
 *                 unit_price: 1200
 *                 tax: 18
 *             remarks: "Approved by management"
 *     responses:
 *       200:
 *         description: Sales quotation updated and approved successfully
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
 *                   example: "Sales quotation updated and approved successfully"
 *       400:
 *         description: Bad request - Sales quotation is not in review stage or validation error
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
 *                   example: "Sales quotation is not in review stage"
 *       404:
 *         description: Sales quotation not found
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
 *                   example: "Sales quotation not found"
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
 *                   example: "An error occurred while updating and approving the sales quotation"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/sales/sale-order-remarks/{id}:
 *   get:
 *     summary: Get all remarks of a sale order
 *     description: Returns all remarks for a sale order in descending order of creation time (no pagination).
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sale order ID
 *         example: 191
 *     responses:
 *       200:
 *         description: Sale order remarks fetched successfully
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
 *                   example: "Sale order remarks fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 12
 *                       remarks:
 *                         type: string
 *                         example: "Approved by management."
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-03-12T10:25:00.000Z"
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 5
 *                           name:
 *                             type: string
 *                             example: "Sudipta"
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: "sudipta@example.com"
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
 *                   example: "Error fetching sale order remarks"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/sales/rejected-by-management/{id}:
 *   put:
 *     summary: Reject or confirm sales quotation by management
 *     description: Updates the sales quotation status to either rejected (8) or order confirmed (5) and creates remarks entry if provided.
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sales Quotation ID
 *         example: 191
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: integer
 *                 enum: [5, 8]
 *                 description: Status to set - 5 for order confirmed, 8 for rejected
 *                 example: 8
 *               remarks:
 *                 type: string
 *                 description: Remarks for rejection/confirmation
 *                 example: "Rejected by management due to pricing concerns"
 *           example:
 *             status: 8
 *             remarks: "Rejected by management"
 *     responses:
 *       200:
 *         description: Sales quotation rejected/confirmed successfully
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
 *                   example: "Sales quotation rejected successfully"
 *       400:
 *         description: Bad request - Invalid status or validation error
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
 *                   example: "Status is required and must be either 8 (rejected) or 5 (order confirmed)"
 *       404:
 *         description: Sales quotation not found
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
 *                   example: "Sales quotation not found"
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
 *                   example: "An error occurred while rejecting/confirming the sales quotation"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/sales/dispatch-product/{pid}/{sid}/{spid}:
 *   put:
 *     summary: Dispatch a sales product
 *     description: Marks a sales product as dispatched. Validates that the product exists and is not already dispatched. If all products in the sales quotation are dispatched, automatically updates the sales quotation status to dispatched (10).
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sales Quotation ID
 *         example: 191
 *       - in: path
 *         name: sid
 *         required: true
 *         schema:
 *           type: integer
 *         description: Status ID
 *         example: 10
 *       - in: path
 *         name: spid
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sales Product ID
 *         example: 655
 *     responses:
 *       200:
 *         description: Records updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Records Updated Successfully"
 *       400:
 *         description: Bad request - Validation error or product already dispatched
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "Invalid purchase ID"
 *                   description: Invalid sales product ID
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Sales product not found"
 *                   description: Sales product not found or already dispatched
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Product already dispatched"
 *                   description: Product is already in dispatched status
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An error occurred while updating the purchase status"
 */

/**
 * @swagger
 * /api/sales/sales-product-received:
 *   post:
 *     summary: Receive a sales product
 *     description: Records receipt of a sales product. Creates a sales product received entry, updates the sales product status (9 = partially received, 10 = fully received), updates warehouse stock (increases quantity and decreases sale_order_recieved). If all products in the sales order are fully received, updates the sales order status to dispatched (10).
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sales_id
 *               - sales_product_id
 *               - quantity
 *             properties:
 *               sales_id:
 *                 type: integer
 *                 description: Sales order ID
 *                 example: 191
 *               sales_product_id:
 *                 type: integer
 *                 description: Sales product line item ID
 *                 example: 655
 *               warehouse_id:
 *                 type: integer
 *                 description: Warehouse ID
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 description: Quantity received (must be less than or equal to sales product qty)
 *                 example: 50
 *           example:
 *             sales_id: 191
 *             sales_product_id: 655
 *             quantity: 50
 *     responses:
 *       200:
 *         description: Sales product received successfully
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
 *                   example: "Sales product received successfully"
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *       400:
 *         description: Bad request - Sales product not found or quantity exceeds sales product quantity
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   enum:
 *                     - "Sales product not found"
 *                     - "Quantity is greater than the sales product quantity"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An error occurred while receiving the sales product"
 */

/**
 * @swagger
 * /api/sales/available-batches/{id}:
 *   get:
 *     summary: Get available batches for a sales order
 *     description: Returns the sales order by ID with its products, product data, and available batches per warehouse (including batch tracking logs).
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sales order ID
 *         example: 85
 *     responses:
 *       200:
 *         description: Available batches fetched successfully
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
 *                   example: "Available batches fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     sale:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 85
 *                         warehouse_id:
 *                           type: integer
 *                           example: 10
 *                         products:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 152
 *                               warehouse_id:
 *                                 type: integer
 *                                 example: 10
 *                               description:
 *                                 type: string
 *                                 example: "SKU006"
 *                               qty:
 *                                 type: integer
 *                                 example: 20
 *                               unit_price:
 *                                 type: string
 *                                 example: "500.00"
 *                               tax:
 *                                 type: integer
 *                                 example: 18
 *                               taxExcl:
 *                                 type: string
 *                                 example: "10000.00"
 *                               taxIncl:
 *                                 type: string
 *                                 example: "11800.00"
 *                               taxAmount:
 *                                 type: string
 *                                 example: "1800"
 *                               productData:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 2623
 *                                   product_name:
 *                                     type: string
 *                                     example: "SKU006"
 *                                   product_code:
 *                                     type: string
 *                                     example: "SKU6"
 *                                   batches:
 *                                     type: array
 *                                     items:
 *                                       type: object
 *                                       properties:
 *                                         id:
 *                                           type: integer
 *                                           example: 7
 *                                         product_id:
 *                                           type: integer
 *                                           example: 74
 *                                         batch_no:
 *                                           type: string
 *                                           example: "T889573"
 *                                         manufacture_date:
 *                                           type: string
 *                                           format: date
 *                                           example: "2025-11-14"
 *                                         expiry_date:
 *                                           type: string
 *                                           format: date
 *                                           example: "2026-05-22"
 *                                         quantity:
 *                                           type: integer
 *                                           example: 9
 *                                         available_quantity:
 *                                           type: integer
 *                                           example: 4
 *                                         trackBatchProductLogs:
 *                                           type: array
 *                                           items:
 *                                             type: object
 *                                             properties:
 *                                               id:
 *                                                 type: integer
 *                                                 example: 1
 *                                               status:
 *                                                 type: integer
 *                                                 example: 1
 *                                               quantity:
 *                                                 type: integer
 *                                                 example: 5
 *       404:
 *         description: Sales order not found
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
 *                   example: "Sales order not found"
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
 *                   example: "Error getting available batches"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */