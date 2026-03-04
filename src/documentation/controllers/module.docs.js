/**
 * @swagger
 * tags:
 *   name: Module
 *   description: Module management endpoints
 */

/**
 * @swagger
 * /api/module/add:
 *   post:
 *     summary: Create a new module
 *     tags: [Module]
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
 *                 example: Sales Module
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Module created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/module/all-modules:
 *   get:
 *     summary: Get all modules
 *     tags: [Module]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of modules
 */

/**
 * @swagger
 * /api/module/update/{id}:
 *   put:
 *     summary: Update a module
 *     tags: [Module]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Module ID
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
 *         description: Module updated successfully
 */

/**
 * @swagger
 * /api/module/delete/{id}:
 *   delete:
 *     summary: Delete a module
 *     tags: [Module]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module deleted successfully
 */
