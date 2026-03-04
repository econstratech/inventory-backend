/**
 * @swagger
 * tags:
 *   name: Customer
 *   description: Customer management endpoints
 */

/**
 * @swagger
 * /api/customer/add:
 *   post:
 *     summary: Add a new customer
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Customer image/logo
 *               name:
 *                 type: string
 *                 example: Customer Name
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               gstin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/customer/all-customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: searchkey
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of customers
 */

/**
 * @swagger
 * /api/customer/update/{id}:
 *   post:
 *     summary: Update a customer
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Customer updated successfully"
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Customer not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/customer/{id}:
 *   delete:
 *     summary: Delete a customer
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 */

/**
 * @swagger
 * /api/customer/upload:
 *   post:
 *     summary: Bulk upload customers from file
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel/CSV file with customers
 *     responses:
 *       200:
 *         description: Customers uploaded successfully
 */

/**
 * @swagger
 * /api/customer/demanded-products/{id}:
 *   get:
 *     summary: Get demanded products for a customer (warehouse-wise)
 *     description: Returns paginated list of sales products for the given customer, grouped by sales product and warehouse. Only sale orders with status 10 or 11 are included. Each row has aggregated total_received and total_amount per product per warehouse. Ordered by created_at descending.
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *         example: 5
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
 *         description: Items per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Demanded products (warehouse-wise) fetched successfully
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
 *                   example: "Demanded products (warehouse-wise) fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Sales product ID
 *                         example: 148
 *                       qty:
 *                         type: integer
 *                         description: Ordered quantity
 *                         example: 30
 *                       status:
 *                         type: integer
 *                         description: Sale order status (e.g. 10, 11)
 *                         example: 11
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-02-13T11:39:24.000Z"
 *                       total_received:
 *                         type: string
 *                         description: Sum of received quantity for this product/warehouse (from DB)
 *                         example: "30"
 *                       total_amount:
 *                         type: string
 *                         description: Sum of taxIncl for this product/warehouse (from DB)
 *                         example: "194700"
 *                       productData:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 2624
 *                           product_name:
 *                             type: string
 *                             example: "Plywood"
 *                           product_code:
 *                             type: string
 *                             example: "P009876"
 *                       sales_product_received:
 *                         type: object
 *                         properties:
 *                           warehouse:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 10
 *                               name:
 *                                 type: string
 *                                 example: "Mohan Co-operative Industrial estate"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of (product + warehouse) groups
 *                       example: 1
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 error:
 *                   type: string
 */
