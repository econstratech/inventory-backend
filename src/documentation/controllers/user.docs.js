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
 * /api/user/update-user-roles:
 *   post:
 *     summary: Update user roles
 *     description: Updates the role assignments for a user. User must belong to the authenticated user's company. Role must be a valid JSON string of role IDs array.
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
 *               - id
 *               - role
 *             properties:
 *               id:
 *                 type: integer
 *                 description: User ID to update
 *                 example: 159
 *               role:
 *                 type: string
 *                 description: JSON string of role IDs array
 *                 example: "[3,11,8,5,7,9,2,10,4,6]"
 *     responses:
 *       200:
 *         description: User roles updated successfully
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
 *                   example: "User roles updated successfully"
 *       400:
 *         description: Roles required or invalid role format
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
 *                   example: "Roles are required"
 *                 error:
 *                   type: string
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

/**
 * @swagger
 * /api/user/validate-third-party-user:
 *   post:
 *     summary: Validate third-party user by JWT token
 *     description: Decodes `token_hash`, maps third-party user to internal user by `bms_user_id`, creates service audit log, and returns logged-in user data with permissions.
 *     tags: [User]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token_hash
 *             properties:
 *               token_hash:
 *                 type: string
 *                 description: Third-party JWT token hash
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTYwLCJuYW1lIjoiU3VkaXB0YSIsImVtYWlsIjoic3VkaXB0YS5lY29uc3RyYUBnbWFpbC5jb20iLCJjb21wYW55X2lkIjozOSwicG9zaXRpb24iOiJDdXN0b21lciIsImJyYW5jaF9pZCI6MCwiYnJhbmNoX3Bvc2l0aW9uIjpudWxsLCJkZXBhcnRtZW50c19pZCI6NjExLCJpYXQiOjE3NzMyMTAxMzF9.ZTmK7jU_hT34cFsucp9AAV-Nn3vaJtTztYF2c0umlIE"
 *               service_url:
 *                 type: string
 *                 description: Source service callback URL for audit logging
 *                 example: "http://localhost:5000/api//user/validate-third-party-user"
 *               service_name:
 *                 type: string
 *                 description: Source service name for audit logging
 *                 example: "BMS Task Management Login"
 *               service_method:
 *                 type: string
 *                 description: HTTP method of source service request
 *                 example: "POST"
 *           example:
 *             token_hash: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTYwLCJuYW1lIjoiU3VkaXB0YSIsImVtYWlsIjoic3VkaXB0YS5lY29uc3RyYUBnbWFpbC5jb20iLCJjb21wYW55X2lkIjozOSwicG9zaXRpb24iOiJDdXN0b21lciIsImJyYW5jaF9pZCI6MCwiYnJhbmNoX3Bvc2l0aW9uIjpudWxsLCJkZXBhcnRtZW50c19pZCI6NjExLCJpYXQiOjE3NzMyMTAxMzF9.ZTmK7jU_hT34cFsucp9AAV-Nn3vaJtTztYF2c0umlIE"
 *             service_url: "http://localhost:5000/api//user/validate-third-party-user"
 *             service_name: "BMS Task Management Login"
 *             service_method: "POST"
 *     responses:
 *       200:
 *         description: Token validated and login successful
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
 *                   example: "Token is validated & logged in successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       description: Internal matched user details
 *                       additionalProperties: true
 *                     tokenData:
 *                       type: object
 *                       description: Decoded third-party token payload
 *                       additionalProperties: true
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Permission list for logged-in user
 *       400:
 *         description: Bad request - Token missing or invalid token
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
 *                   example: "Token is required"
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
 *                   example: "Error validating third-party user token"
 *                 error:
 *                   type: string
 *                   example: "Error details"
 */
