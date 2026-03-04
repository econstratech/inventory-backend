/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Application settings and configuration endpoints
 */

/**
 * @swagger
 * /api/all-department:
 *   get:
 *     summary: Get all departments
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of departments
 */

/**
 * @swagger
 * /api/create-department:
 *   post:
 *     summary: Create a new department
 *     tags: [Settings]
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Department created successfully
 */

/**
 * @swagger
 * /api/update-department/{id}:
 *   put:
 *     summary: Update a department
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Department updated successfully
 */

/**
 * @swagger
 * /api/delete-department/{id}:
 *   delete:
 *     summary: Delete a department
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Department deleted successfully
 */

/**
 * @swagger
 * /api/general_settings:
 *   post:
 *     summary: Save/update company general settings
 *     description: Creates or updates general settings for the authenticated user's company. If a record exists it is updated; otherwise a new record is created.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currency:
 *                 type: object
 *                 description: Currency configuration
 *                 properties:
 *                   code:
 *                     type: string
 *                     example: "INR"
 *                   name:
 *                     type: string
 *                     example: "Indian Rupee"
 *                   symbol:
 *                     type: string
 *                     example: "₹"
 *               timezone:
 *                 type: string
 *                 description: Company timezone
 *                 example: "Asia/Kolkata"
 *               companyAddress:
 *                 type: string
 *                 description: Company address
 *               deliveryAddress:
 *                 type: string
 *                 description: Default delivery address
 *               enableBatchNumber:
 *                 type: boolean
 *                 description: Enable batch number tracking
 *               template:
 *                 type: string
 *                 description: Template setting (e.g. for documents)
 *               signature:
 *                 type: string
 *                 description: Signature (e.g. for documents)
 *               minimum_po_approval_amount:
 *                 type: number
 *                 description: Minimum purchase order amount requiring approval
 *                 example: 50000
 *               minimum_so_approval_amount:
 *                 type: number
 *                 description: Minimum sales order amount requiring approval
 *                 example: 25000
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: string
 *                   example: "Settings updated successfully."
 *       400:
 *         description: Validation or save error
 */

/**
 * @swagger
 * /api/general_settings:
 *   get:
 *     summary: Fetch general settings
 *     description: Returns general settings for the authenticated user's company. Returns 404 if no settings exist for the company.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: General settings fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     currency:
 *                       type: object
 *                       properties:
 *                         code:
 *                           type: string
 *                           example: "INR"
 *                         name:
 *                           type: string
 *                           example: "Indian Rupee"
 *                         symbol:
 *                           type: string
 *                           example: "₹"
 *                     timezone:
 *                       type: string
 *                       example: "Asia/Kolkata"
 *                     companyAddress:
 *                       type: string
 *                     deliveryAddress:
 *                       type: string
 *                     enableBatchNumber:
 *                       type: boolean
 *                     template:
 *                       type: string
 *                     signature:
 *                       type: string
 *                     min_purchase_amount:
 *                       type: number
 *                       nullable: true
 *                       example: 50000
 *                     min_sale_amount:
 *                       type: number
 *                       nullable: true
 *                       example: 25000
 *       404:
 *         description: Settings not found for the company
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Settings not found"
 *       400:
 *         description: Error fetching settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching settings"
 *                 details:
 *                   type: object
 */

/**
 * @swagger
 * /api/warehouse:
 *   post:
 *     summary: Create a new warehouse/store
 *     tags: [Settings]
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
 *                 description: Warehouse/store name
 *               store_type:
 *                 type: string
 *                 description: Type of store
 *               location:
 *                 type: string
 *                 description: Warehouse location
 *               city:
 *                 type: string
 *                 description: City
 *               pin:
 *                 type: string
 *                 description: PIN code
 *               is_fg_store:
 *                 type: integer
 *                 description: 1 = finished goods store, 0 = not. Only one FG store per company; setting to 1 unsets others.
 *                 enum: [0, 1]
 *                 example: 0
 *               is_rm_store:
 *                 type: integer
 *                 description: 1 = raw material store, 0 = not
 *                 enum: [0, 1]
 *                 example: 0
 *     responses:
 *       200:
 *         description: Warehouse created successfully
 *       406:
 *         description: Store with the same name already exists
 */

/**
 * @swagger
 * /api/warehouse:
 *   get:
 *     summary: Get all warehouses/stores
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: store_type
 *         schema:
 *           type: string
 *         description: store type
 *       - in: query
 *         name: searchkey
 *         schema:
 *           type: string
 *         description: Serch key
 *     responses:
 *       200:
 *         description: List of warehouses
 */

/**
 * @swagger
 * /api/warehouse/{id}:
 *   put:
 *     summary: Update a store/warehouse
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Warehouse/store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Warehouse/store name
 *               store_type:
 *                 type: string
 *                 description: Type of store
 *               location:
 *                 type: string
 *                 description: Warehouse location
 *               city:
 *                 type: string
 *                 description: City
 *               pin:
 *                 type: string
 *                 description: PIN code
 *               is_fg_store:
 *                 type: integer
 *                 description: 1 = finished goods store, 0 = not. Only one FG store per company; setting to 1 unsets others.
 *                 enum: [0, 1]
 *                 example: 0
 *               is_rm_store:
 *                 type: integer
 *                 description: 1 = raw material store, 0 = not
 *                 enum: [0, 1]
 *                 example: 0
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 *       406:
 *         description: Store with the same name already exists
 */
