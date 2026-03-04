/**
 * @swagger
 * tags:
 *   name: Vendor
 *   description: Vendor management endpoints
 */

/**
 * @swagger
 * /api/vendor/add:
 *   post:
 *     summary: Add a new vendor
 *     tags: [Vendor]
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
 *                 description: Vendor image/logo
 *               vendor_name:
 *                 type: string
 *                 example: Vendor Name
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
 *         description: Vendor created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/vendor:
 *   get:
 *     summary: Get all vendors
 *     description: Returns paginated list of active vendors (status 1) for the company. Supports search by vendor name, email, or city.
 *     tags: [Vendor]
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
 *         description: Items per page
 *         example: 10
 *       - in: query
 *         name: searchkey
 *         schema:
 *           type: string
 *         description: Search by vendor name, email, or city (partial match)
 *         example: "Acme"
 *     responses:
 *       200:
 *         description: Vendors fetched successfully
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
 *                   example: "Vendors fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total_records:
 *                           type: integer
 *                           example: 50
 *                         total_pages:
 *                           type: integer
 *                           example: 5
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
 *                             example: 1
 *                           vendor_name:
 *                             type: string
 *                             example: "Acme Corp"
 *                           email:
 *                             type: string
 *                             example: "contact@acme.com"
 *                           address:
 *                             type: string
 *                           city:
 *                             type: string
 *                             example: "Mumbai"
 *                           phone:
 *                             type: string
 *                             example: "+91 9876543210"
 *       400:
 *         description: Error fetching vendors
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
 *                   example: "Error fetching vendors"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/vendor/update/{id}:
 *   post:
 *     summary: Update a vendor
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vendor ID
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
 *               vendor_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vendor updated successfully
 */

/**
 * @swagger
 * /api/vendor/{id}:
 *   delete:
 *     summary: Delete a vendor
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor deleted successfully
 */

/**
 * @swagger
 * /api/vendor/upload:
 *   post:
 *     summary: Bulk upload vendors from file
 *     tags: [Vendor]
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
 *                 description: Excel/CSV file with vendors
 *     responses:
 *       200:
 *         description: Vendors uploaded successfully
 */
