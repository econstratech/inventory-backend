/**
 * @swagger
 * tags:
 *   name: Role Permission
 *   description: Role and Permission management endpoints
 */

/**
 * @swagger
 * /api/get-all-roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Role Permission]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 */

/**
 * @swagger
 * /api/create-role:
 *   post:
 *     summary: Create a new role
 *     tags: [Role Permission]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - permissions
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Production Manager"
 *               permissions:
 *                 type: array
 *                 description: Permissions to assign to the role
 *                 items:
 *                   type: object
 *                   required:
 *                     - permission_id
 *                     - module_id
 *                   properties:
 *                     permission_id:
 *                       type: integer
 *                       example: 12
 *                     module_id:
 *                       type: integer
 *                       example: 4
 *           example:
 *             name: "Production Manager"
 *             permissions:
 *               - permission_id: 12
 *                 module_id: 4
 *               - permission_id: 13
 *                 module_id: 4
 *     responses:
 *       200:
 *         description: Role created successfully
 *       400:
 *         description: Validation error or duplicate role name
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/update-role/{id}:
 *   post:
 *     summary: Update a role name
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
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Manager"
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

/**
 * @swagger
 * /api/create-permission:
 *   post:
 *     summary: Create a permission
 *     tags: [Role Permission]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - guard_name
 *               - module_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Sales View"
 *               guard_name:
 *                 type: string
 *                 description: Permission guard name
 *                 example: "api"
 *               module_id:
 *                 type: integer
 *                 description: Module ID to which this permission belongs
 *                 example: 2
 *           example:
 *             name: "Sales View"
 *             guard_name: "api"
 *             module_id: 2
 *     responses:
 *       201:
 *         description: Permission created successfully
 *       400:
 *         description: Permission already exists
 *       404:
 *         description: Module not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/update-permission/{id}:
 *   put:
 *     summary: Update a permission
 *     tags: [Role Permission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Permission ID
 *         example: 10
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Sales Edit"
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *       404:
 *         description: Permission not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/delete-permission/{id}:
 *   delete:
 *     summary: Delete a permission
 *     tags: [Role Permission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Permission ID
 *         example: 10
 *     responses:
 *       200:
 *         description: Permission deleted successfully
 *       404:
 *         description: Permission not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/get-all-permissions:
 *   get:
 *     summary: Get all permissions
 *     tags: [Role Permission]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/assign-permissions-to-role/{role_id}:
 *   post:
 *     summary: Assign permissions to a role
 *     description: Replaces existing permissions of a role with the provided permission IDs.
 *     tags: [Role Permission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *         example: 3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 description: Array of permission IDs to assign
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 5]
 *     responses:
 *       200:
 *         description: Permissions assigned to role successfully
 *       404:
 *         description: Role or permissions not found
 *       500:
 *         description: Server error
 */
