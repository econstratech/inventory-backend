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
 *     summary: Update a role and its associated permissions
 *     description: Updates the role name and replaces all associated permissions with the provided list.
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
 *         example: 3
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
 *                 example: "Manager"
 *               permissions:
 *                 type: array
 *                 description: Permissions to assign to the role (replaces existing)
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
 *             name: "Manager"
 *             permissions:
 *               - permission_id: 12
 *                 module_id: 4
 *               - permission_id: 13
 *                 module_id: 4
 *     responses:
 *       200:
 *         description: Role and associated permissions updated successfully
 *       400:
 *         description: Role not found or validation error
 *       500:
 *         description: Server error
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
 *     summary: Get all permissions (paginated)
 *     description: Returns paginated permissions with optional module filter. Only permissions with guard_name "web" are returned.
 *     tags: [Role Permission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Records per page
 *         example: 10
 *       - in: query
 *         name: module_id
 *         schema:
 *           type: integer
 *         description: Optional filter by module ID
 *         example: 2
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
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
 *                   example: "Permissions retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total_records:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *                         current_page:
 *                           type: integer
 *                         per_page:
 *                           type: integer
 *                         has_next_page:
 *                           type: boolean
 *                         has_prev_page:
 *                           type: boolean
 *                         next_page:
 *                           type: integer
 *                           nullable: true
 *                         prev_page:
 *                           type: integer
 *                           nullable: true
 *                     rows:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           label:
 *                             type: string
 *                           guard_name:
 *                             type: string
 *                             example: "web"
 *                           permission_module:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/module-wise-permissions:
 *   get:
 *     summary: Get modules with nested permissions
 *     description: Returns all modules (each with `id` and `name`) and their associated permissions. Optionally filter to a single module by `module_id`.
 *     tags: [Role Permission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: If provided, only the module with this ID is returned (still as an array with one item).
 *         example: 4
 *     responses:
 *       200:
 *         description: Module wise permissions retrieved successfully
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
 *                   example: "Module wise permissions retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Module ID
 *                         example: 4
 *                       name:
 *                         type: string
 *                         description: Module name
 *                         example: "Sales"
 *                       permissions:
 *                         type: array
 *                         description: Permissions belonging to this module
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 12
 *                             name:
 *                               type: string
 *                               example: "sales.view"
 *                             label:
 *                               type: string
 *                               example: "View"
 *                             guard_name:
 *                               type: string
 *                               example: "web"
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
