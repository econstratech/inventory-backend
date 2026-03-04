/**
 * @swagger
 * tags:
 *   name: Production
 *   description: Production and BOM (Bill of Materials) management endpoints
 */

/**
 * @swagger
 * /api/production/create-production-route:
 *   post:
 *     summary: Create a new production route
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Production route created successfully
 */

/**
 * @swagger
 * /api/production/get-production-route:
 *   get:
 *     summary: Get all production routes
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of production routes
 */

/**
 * @swagger
 * /api/production/update-production-route/{id}:
 *   put:
 *     summary: Update a production route
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Production Route ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Production route updated successfully
 */

/**
 * @swagger
 * /api/production/delete-production-route/{id}:
 *   delete:
 *     summary: Delete a production route
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Production Route ID
 *     responses:
 *       200:
 *         description: Production route deleted successfully
 */

/**
 * @swagger
 * /api/production/create-bom:
 *   post:
 *     summary: Create a Bill of Materials (BOM)
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *               components:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: BOM created successfully
 */

/**
 * @swagger
 * /api/production/get-bom-list:
 *   get:
 *     summary: Get all BOMs
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of BOMs
 */
