/**
 * @swagger
 * tags:
 *   name: Product Category
 *   description: Product category management endpoints
 */

/**
 * @swagger
 * /api/product-category:
 *   post:
 *     summary: Add a new product category
 *     tags: [Product Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Spare parts"
 *                 description: Name of the product category
 *     responses:
 *       200:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Product category created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     title:
 *                       type: string
 *                       example: "Electronics"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-09T10:00:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-09T10:00:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Product category with this name already exists"
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
 * /api/product-category:
 *   get:
 *     summary: Get product categories (paginated)
 *     description: Returns active/inactive product categories for the authenticated user's company with pagination, optional title search (`searchkey`), and optional status filter. By default, status `2` (deleted) is excluded.
 *     tags: [Product Category]
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
 *         name: searchkey
 *         schema:
 *           type: string
 *         description: Optional title search (partial match)
 *         example: "Raw"
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: Optional exact status filter (if omitted, status != 2)
 *         example: 1
 *     responses:
 *       200:
 *         description: Product Categories fetched successfully
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
 *                   example: "Product Categories fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total_records:
 *                           type: integer
 *                           example: 26
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
 *                             example: 12
 *                           title:
 *                             type: string
 *                             example: "Raw Materials"
 *                           status:
 *                             type: integer
 *                             example: 1
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal Server Error"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/product-category/updatecat/{id}:
 *   put:
 *     summary: Update a product category
 *     tags: [Product Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 */

/**
 * @swagger
 * /api/product-category/{id}:
 *   delete:
 *     summary: Delete a product category
 *     tags: [Product Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 */

/**
 * @swagger
 * /api/product-category/upload:
 *   post:
 *     summary: Bulk upload categories from file
 *     tags: [Product Category]
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
 *                 description: Excel file with categories
 *     responses:
 *       200:
 *         description: Categories uploaded successfully
 */
