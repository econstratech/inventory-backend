/**
 * @swagger
 * tags:
 *   name: Role
 *   description: Role management endpoints
 */

/**
 * @swagger
 * /api/roles/add:
 *   post:
 *     summary: Create a new role
 *     tags: [Role]
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
 *                 example: Admin
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/roles/all-roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */

/**
 * @swagger
 * /api/roles/update/{id}:
 *   put:
 *     summary: Update a role
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
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
 *         description: Role updated successfully
 */

/**
 * @swagger
 * /api/roles/delete/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Role]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 */
