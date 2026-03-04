/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management endpoints
 */

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - username
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               username:
 *                 type: string
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               status:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: User successfully registered
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
 *                   example: user successful created
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: User login
 *     tags: [User]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "Login successfully"
 *                 token:
 *                   type: string
 *                   description: JWT token for authorization
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 159
 *                     name:
 *                       type: string
 *                       example: "Sumit"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "sumit.econstra@gmail.com"
 *                     company_id:
 *                       type: integer
 *                       example: 39
 *                     position:
 *                       type: string
 *                       example: "Owner"
 *                     role:
 *                       type: string
 *                       description: JSON string of role IDs array
 *                       example: "[3,11,8,5,7,9,2,10,4,6]"
 *                     company:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 39
 *                         company_name:
 *                           type: string
 *                           example: "EconStra Business Consultants LLP (Expand)"
 *                         generalSettings:
 *                           type: object
 *                           properties:
 *                             company_id:
 *                               type: integer
 *                               example: 39
 *                             timezone:
 *                               type: string
 *                               example: "Asia/Calcutta"
 *                             symbol:
 *                               type: string
 *                               example: "₹"
 *                             currency_name:
 *                               type: string
 *                               example: "Indian Rupee"
 *                             currency_code:
 *                               type: string
 *                               example: "INR"
 *                             min_purchase_amount:
 *                               type: string
 *                               example: "7000"
 *                             min_sale_amount:
 *                               type: string
 *                               example: "9000"
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of permission and module names for the user
 *                   example: ["Work Order", "View", "Sales", "Purchase", "Settings", "Report"]
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/user/all-user:
 *   get:
 *     summary: Get all users
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */

/**
 * @swagger
 * /api/user/list:
 *   get:
 *     summary: Get users list
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list retrieved successfully
 */

/**
 * @swagger
 * /api/user/allusercount:
 *   get:
 *     summary: Get total user count
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User count retrieved successfully
 */

/**
 * @swagger
 * /api/user/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - old_password
 *               - password
 *             properties:
 *               old_password:
 *                 type: string
 *                 format: password
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid old password
 */

/**
 * @swagger
 * /api/user/get-role:
 *   get:
 *     summary: Get all roles
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 */

/**
 * @swagger
 * /api/user/update-user:
 *   post:
 *     summary: Update user details
 *     tags: [User]
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
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 */

/**
 * @swagger
 * /api/user/get-permission:
 *   get:
 *     summary: Get user permissions
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 */

/**
 * @swagger
 * /api/user/validate:
 *   post:
 *     summary: Validate user by email
 *     description: Checks if a user exists in the system by their email address. Returns user details if found.
 *     tags: [User]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address to validate
 *                 example: abc@gmail.com
 *           example:
 *             email: abc@gmail.com
 *     responses:
 *       200:
 *         description: User found successfully
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
 *                   example: "User found"
 *                 data:
 *                   type: object
 *                   description: User details
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "abc@gmail.com"
 *                     username:
 *                       type: string
 *                       example: "johndoe"
 *                     status:
 *                       type: boolean
 *                       example: true
 *                     is_verified:
 *                       type: boolean
 *                       example: true
 *                     company_id:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Bad request - Email is required or invalid format
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
 *                   example: "Email is required"
 *       404:
 *         description: User not found
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
 *                   example: "User not found"
 *       500:
 *         description: Server error
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
 *                   example: "Error validating user"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */