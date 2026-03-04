/**
 * @swagger
 * tags:
 *   name: Role Permission
 *   description: Role and Permission management endpoints
 */

/**
 * @swagger
 * /api/get-role:
 *   get:
 *     summary: Get all roles
 *     tags: [Role Permission]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */

/**
 * @swagger
 * /api/all-permission:
 *   get:
 *     summary: Get all permissions
 *     tags: [Role Permission]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions
 */

/**
 * @swagger
 * /api/create-role:
 *   post:
 *     summary: Create a new role with permissions
 *     tags: [Role Permission]
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
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Role created successfully
 */

/**
 * @swagger
 * /api/role-update/{id}:
 *   put:
 *     summary: Update a role and its permissions
 *     tags: [Role Permission]
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
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Role updated successfully
 */

/**
 * @swagger
 * /api/delete-role/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Role Permission]
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
