/**
 * @swagger
 * tags:
 *   name: Company
 *   description: Company management endpoints
 */

/**
 * @swagger
 * /api/company/active-company:
 *   get:
 *     summary: Get all active companies
 *     tags: [Company]
 *     security: []
 *     responses:
 *       200:
 *         description: List of active companies
 */

/**
 * @swagger
 * /api/company/create-company:
 *   post:
 *     summary: Create a new company with owner user
 *     description: Creates a new company with default office time, notification settings, and general settings. Also creates an owner user and links it to the company.
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_name
 *               - company_email
 *               - company_phone
 *               - isd
 *               - address
 *               - whatsapp_no
 *               - w_isd
 *               - password
 *             properties:
 *               company_name:
 *                 type: string
 *                 description: Company name
 *                 example: "Acme Corp"
 *               company_email:
 *                 type: string
 *                 format: email
 *                 description: Company email (must be unique)
 *                 example: "company@acme.com"
 *               company_phone:
 *                 type: string
 *                 description: Company phone number
 *                 example: "9876543210"
 *               isd:
 *                 type: string
 *                 description: ISD code for phone (default +91)
 *                 example: "+91"
 *               address:
 *                 type: string
 *                 description: Company address
 *                 example: "123 Main Street, City"
 *               whatsapp_no:
 *                 type: string
 *                 description: Company WhatsApp number
 *                 example: "9876543210"
 *               w_isd:
 *                 type: string
 *                 description: ISD code for WhatsApp (default +91)
 *                 example: "+91"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Owner user password
 *               renew_date:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 description: Company renewal date
 *               contact_name:
 *                 type: string
 *                 description: Primary contact name (used for owner user)
 *                 example: "John Doe"
 *               contact_email:
 *                 type: string
 *                 format: email
 *                 description: Primary contact email
 *               contact_phone:
 *                 type: string
 *                 description: Primary contact phone
 *               contact_whatsapp_no:
 *                 type: string
 *                 description: Primary contact WhatsApp number
 *               is_variant_based:
 *                 type: integer
 *                 enum: [0, 1]
 *                 default: 1
 *                 description: Whether product is variant-based (1) or not (0)
 *               name:
 *                 type: string
 *                 description: Owner user display name (fallback for contact_name)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Owner user email (fallback for contact_email)
 *     responses:
 *       200:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 msg:
 *                   type: string
 *                   example: "New company has been created"
 *       400:
 *         description: Validation error or company already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 msg:
 *                   type: string
 *                   example: "Please fill all field"
 *                 message:
 *                   type: string
 *                   example: "This company name already exist !"
 */

/**
 * @swagger
 * /api/company/user-list/{id}:
 *   get:
 *     summary: Get user list by company
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     responses:
 *       200:
 *         description: List of users for the company
 */

/**
 * @swagger
 * /api/company/company-info/{id}:
 *   get:
 *     summary: Get company information
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company information
 */

/**
 * @swagger
 * /api/company/company-update/{id}:
 *   put:
 *     summary: Update company details
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Company updated successfully
 */

/**
 * @swagger
 * /api/company/create-user-growthh:
 *   post:
 *     summary: Create user for Growthh
 *     tags: [Company]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User created successfully
 */
