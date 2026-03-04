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
 *     summary: Create a new company
 *     tags: [Company]
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
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Company created successfully
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
