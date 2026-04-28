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
 * /api/company/update/{id}:
 *   put:
 *     summary: Update company details, general settings, and owner user
 *     description: |
 *       Updates the `companies` row, upserts the linked `general_settings` row, syncs the Owner user
 *       (`users` row with `position = 'Owner'`), and replaces `allowed_modules` with the provided array.
 *       The whole update runs in a single transaction; if any step fails everything rolls back.
 *
 *       **Email uniqueness**
 *       - `company_email` must not be used by any other company.
 *       - `owner_email` must not be used by any other user.
 *
 *       **Owner user behaviour**
 *       - Owner is identified as the most recent user where `company_id` matches and `position = 'Owner'`.
 *       - When `owner_email` is provided it is also written to the user's `username` to keep them in sync.
 *       - If no owner user exists for the company, owner fields are silently skipped (creating one would
 *         require a password which this endpoint does not accept).
 *
 *       **General settings coercion**
 *       - `is_variant_based`, `is_production_planning`, `production_without_bom` accept `"0"`/`"1"` strings or numbers.
 *       - `production_without_bom` falls back to `0` when missing because the column is NOT NULL.
 *       - `min_purchase_amount` / `min_sale_amount` accept numeric strings; empty string is stored as `NULL`.
 *
 *       **`allowed_modules`**
 *       - Sent as an array of module IDs. Stored as a JSON-stringified deduped array on `companies.allowed_modules`.
 *       - At least one module is required.
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
 *         example: 250
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
 *               - renew_date
 *               - address
 *               - allowed_modules
 *             properties:
 *               company_name:
 *                 type: string
 *                 example: "Codelogicx Technologies Pvt Ltd"
 *               company_email:
 *                 type: string
 *                 format: email
 *                 description: Must be unique across companies
 *                 example: "admin@codelogicx.com"
 *               company_phone:
 *                 type: string
 *                 example: "9163673775"
 *               c_p_isd:
 *                 type: string
 *                 description: ISD code for company phone
 *                 example: "91"
 *               whatsapp_number:
 *                 type: string
 *                 nullable: true
 *                 example: "7866545611"
 *               w_isd:
 *                 type: string
 *                 nullable: true
 *                 description: ISD code for WhatsApp number
 *                 example: "91"
 *               contact_name:
 *                 type: string
 *                 nullable: true
 *                 example: "Ritika Biswas"
 *               contact_email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 example: "hr@codelogicx.com"
 *               contact_phone:
 *                 type: string
 *                 nullable: true
 *                 example: "7866545611"
 *               p_isd:
 *                 type: string
 *                 nullable: true
 *                 description: ISD code for contact phone
 *                 example: "91"
 *               owner_name:
 *                 type: string
 *                 nullable: true
 *                 description: Updates the Owner user's `name`
 *                 example: "Amitabh Roy"
 *               owner_email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 description: Updates the Owner user's `email` (and `username`); must be unique across users
 *                 example: "amitabh@codelogicx.com"
 *               address:
 *                 type: string
 *                 example: "Unit 603, Webel Tower II, Sector V, Salt Lake"
 *               renew_date:
 *                 type: string
 *                 format: date
 *                 example: "2027-06-15"
 *               is_variant_based:
 *                 type: string
 *                 enum: ["0", "1"]
 *                 description: "0 = No, 1 = Yes (also accepts integers)"
 *                 example: "0"
 *               min_purchase_amount:
 *                 type: string
 *                 nullable: true
 *                 description: Numeric string. Empty string maps to NULL.
 *                 example: ""
 *               min_sale_amount:
 *                 type: string
 *                 nullable: true
 *                 description: Numeric string. Empty string maps to NULL.
 *                 example: ""
 *               is_production_planning:
 *                 type: string
 *                 enum: ["0", "1"]
 *                 description: "0 = No, 1 = Yes (also accepts integers)"
 *                 example: "0"
 *               production_without_bom:
 *                 type: string
 *                 enum: ["0", "1"]
 *                 description: |
 *                   Stored as-is. Note the inverse semantics on the UI: "Has BOM = Yes" is sent as `"0"`,
 *                   "Has BOM = No" is sent as `"1"`. Defaults to `0` if not provided (column is NOT NULL).
 *                 example: "0"
 *               allowed_modules:
 *                 type: array
 *                 minItems: 1
 *                 description: Array of module IDs the company is allowed to access
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 8]
 *           example:
 *             company_name: "Codelogicx Technologies Pvt Ltd"
 *             company_email: "admin@codelogicx.com"
 *             company_phone: "9163673775"
 *             c_p_isd: "91"
 *             whatsapp_number: "7866545611"
 *             w_isd: "91"
 *             contact_name: "Ritika Biswas"
 *             contact_email: "hr@codelogicx.com"
 *             contact_phone: "7866545611"
 *             p_isd: "91"
 *             owner_name: "Amitabh Roy"
 *             owner_email: "amitabh@codelogicx.com"
 *             address: "Unit 603, Webel Tower II, Sector V, Salt Lake"
 *             renew_date: "2027-06-15"
 *             is_variant_based: "0"
 *             min_purchase_amount: ""
 *             min_sale_amount: ""
 *             is_production_planning: "0"
 *             production_without_bom: "0"
 *             allowed_modules: [1, 2, 8]
 *     responses:
 *       200:
 *         description: Company updated successfully
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
 *                   example: "Company details updated successfully."
 *       400:
 *         description: Validation error or email already in use by another company/user
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
 *                   examples:
 *                     missing_required:
 *                       summary: Missing required field
 *                       value: "Company name is required."
 *                     no_modules:
 *                       summary: No module selected
 *                       value: "Please select at least one module."
 *                     company_email_taken:
 *                       summary: Company email belongs to another record
 *                       value: "Another company is already using this email."
 *                     owner_email_taken:
 *                       summary: Owner email belongs to another user
 *                       value: "Another user is already using this owner email."
 *       404:
 *         description: Company not found
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
 *                   example: "Company not found."
 *       500:
 *         description: Unexpected server error (transaction rolled back)
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
 *                   example: "Error while updating company."
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

/**
 * @swagger
 * /api/company/create-company-production-flow:
 *   post:
 *     summary: Create or replace company production flow
 *     description: Replaces existing production flow for a company by deleting old flow rows and bulk-inserting the provided ordered steps.
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
 *               - company_id
 *               - steps
 *             properties:
 *               company_id:
 *                 type: integer
 *                 description: Target company ID
 *                 example: 39
 *               steps:
 *                 type: array
 *                 minItems: 1
 *                 description: Ordered production steps to assign
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - sequence
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Production step master ID
 *                       example: 1
 *                     sequence:
 *                       type: integer
 *                       description: Sequence/order for this step
 *                       example: 10
 *           example:
 *             company_id: 39
 *             steps:
 *               - id: 1
 *                 sequence: 10
 *               - id: 2
 *                 sequence: 20
 *               - id: 3
 *                 sequence: 30
 *     responses:
 *       200:
 *         description: Company production flow created successfully
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
 *                   example: "Company production flow has been created successfully"
 *       400:
 *         description: Validation error or server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   description: Validation message or error object
 *                   example: "Please fill all field !"
 */

/**
 * @swagger
 * /api/company/get-company-production-flow/{id}:
 *   get:
 *     summary: Get company production flow
 *     description: Returns production flow rows for the given company ordered by sequence ascending.
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
 *         example: 39
 *     responses:
 *       200:
 *         description: Company production flow fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 5
 *                       step_id:
 *                         type: integer
 *                         example: 1
 *                       sequence:
 *                         type: integer
 *                         example: 1
 *                       step:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: "Printing"
 *       400:
 *         description: Company ID missing or server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   description: Validation message or error object
 *                   example: "Company ID is required !"
 */

/**
 * @swagger
 * /api/company/production-steps/{id}:
 *   get:
 *     summary: Get company production steps
 *     description: Returns all active production steps configured for the given company (`is_active` = 1), ordered by id ascending. Each row links to a master step via `master_step_id`.
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
 *         example: 39
 *     responses:
 *       200:
 *         description: Production steps fetched successfully
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
 *                   example: "Production steps fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Company production step row ID
 *                         example: 12
 *                       name:
 *                         type: string
 *                         example: "Printing"
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         example: "Screen printing step"
 *                       is_active:
 *                         type: integer
 *                         description: Active flag (1 = active)
 *                         example: 1
 *                       master_step_id:
 *                         type: integer
 *                         description: Reference to master production step
 *                         example: 1
 *       400:
 *         description: Server or request error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   description: Error details
 */

/**
 * @swagger
 * /api/company/production-steps:
 *   post:
 *     summary: Create company production step from master step
 *     description: |
 *       Links an active master production step to a company by creating a `company_production_steps` row
 *       with name and description copied from the master step. Requires `company_id` and `step_id` (master step id).
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
 *               - company_id
 *               - step_id
 *             properties:
 *               company_id:
 *                 type: integer
 *                 description: Target company ID
 *                 example: 39
 *               step_id:
 *                 type: integer
 *                 description: Master production step ID (`ProductionStepsMaster.id`); must be active (`is_active` = 1)
 *                 example: 1
 *           example:
 *             company_id: 39
 *             step_id: 1
 *     responses:
 *       200:
 *         description: Company production step created successfully
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
 *                   example: "Company production step has been created successfully"
 *       400:
 *         description: Validation error, master step not found, or server error in catch handler
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   oneOf:
 *                     - type: string
 *                       example: "Please fill all field !"
 *                     - type: string
 *                       example: "Step not found !"
 *                   description: Validation message, not-found message, or error object from catch
 */

/**
 * @swagger
 * /api/company/production-steps/{stepId}:
 *   delete:
 *     summary: Delete company production step
 *     description: |
 *       Soft-deletes the `company_production_steps` row for the given id, scoped to the authenticated user's company (`JWT` `company_id`).
 *       Also removes matching rows from `company_production_flows` for that company and step so the production flow stays consistent.
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stepId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company production step row id (`company_production_steps.id`)
 *         example: 12
 *     responses:
 *       200:
 *         description: Production step deleted successfully
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
 *                   example: "Production step deleted successfully"
 *       400:
 *         description: Missing company context, invalid step id, or server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   description: Validation message or error object
 *                   example: "Valid step ID is required !"
 *       404:
 *         description: Step not found for this company
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Production step not found !"
 */
