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
 *     summary: Get all product categories
 *     tags: [Product Category]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
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
