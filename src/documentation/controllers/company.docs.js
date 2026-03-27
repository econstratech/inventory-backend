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
 *     description: Creates a new company in a transaction with default office time, notification settings, and general settings, then creates an Owner user linked to that company.
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
 *               - whatsapp_number
 *               - w_isd
 *               - password
 *               - contact_phone
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
 *               whatsapp_number:
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
 *               owner_name:
 *                 type: string
 *                 nullable: true
 *                 description: Owner user name
 *                 example: "John Doe"
 *               owner_email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 description: Owner user email/username
 *                 example: "owner@acme.com"
 *               contact_name:
 *                 type: string
 *                 nullable: true
 *                 description: Company contact person name
 *                 example: "Priya Sharma"
 *               contact_email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 description: Company contact email
 *                 example: "contact@acme.com"
 *               contact_phone:
 *                 type: string
 *                 description: Company contact phone (required by API validation)
 *                 example: "9898989898"
 *               contact_whatsapp_no:
 *                 type: string
 *                 nullable: true
 *                 description: Contact WhatsApp number
 *                 example: "9898989898"
 *               is_variant_based:
 *                 type: integer
 *                 enum: [0, 1]
 *                 default: 1
 *                 description: Whether product is variant-based (1) or not (0)
 *           example:
 *             company_name: "Acme Corp"
 *             company_email: "company@acme.com"
 *             owner_name: "John Doe"
 *             owner_email: "owner@acme.com"
 *             company_phone: "9876543210"
 *             isd: "+91"
 *             address: "123 Main Street, City"
 *             whatsapp_number: "9876543210"
 *             w_isd: "+91"
 *             password: "Password@123"
 *             renew_date: "2026-12-31"
 *             contact_name: "Priya Sharma"
 *             contact_email: "contact@acme.com"
 *             contact_phone: "9898989898"
 *             contact_whatsapp_no: "9898989898"
 *             is_variant_based: 1
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
 *                 message:
 *                   type: string
 *                   example: "New company has been created"
 *                 data:
 *                   type: object
 *                   description: Newly created company object
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
 *                   example: "Error while creating company"
 *                 error:
 *                   type: object
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
