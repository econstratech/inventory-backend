/**
 * @swagger
 * tags:
 *   - name: BOM
 *     description: Bill of Materials (BOM) management endpoints
 */

/**
 * @swagger
 * /api/bom/add:
 *   post:
 *     summary: Add BOM (Bill of Materials) record(s)
 *     description: Accepts a single BOM object or an array of BOM items. Each item has final_product_id, raw_material_product_id, and quantity.
 *     tags: [BOM]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - final_product_id
 *                 - raw_material_product_id
 *                 - quantity
 *               properties:
 *                 final_product_id:
 *                   type: integer
 *                   description: ID of the final product
 *                   example: 2624
 *                 raw_material_product_id:
 *                   type: integer
 *                   description: ID of the raw material product
 *                   example: 2621
 *                 quantity:
 *                   type: integer
 *                   description: Quantity of raw material required for the final product
 *                   minimum: 1
 *                   example: 40
 *           example:
 *             - final_product_id: 2624
 *               raw_material_product_id: 2621
 *               quantity: 40
 *             - final_product_id: 2618
 *               raw_material_product_id: 61
 *               quantity: 30
 *             - final_product_id: 2623
 *               raw_material_product_id: 61
 *               quantity: 40
 *     responses:
 *       201:
 *         description: BOM created successfully
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
 *                   example: "BOM created successfully"
 *                 data:
 *                   type: object
 *                   description: Created BOM record
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     company_id:
 *                       type: integer
 *                       example: 1
 *                     final_product_id:
 *                       type: integer
 *                       example: 1
 *                     raw_material_product_id:
 *                       type: integer
 *                       example: 2
 *                     bom_no:
 *                       type: string
 *                       description: System-generated unique BOM number
 *                       example: "BOM098734"
 *                     quantity:
 *                       type: integer
 *                       example: 10
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Missing required fields or invalid data
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
 *                   example: "final_product_id, raw_material_product_id, and quantity are required"
 *       404:
 *         description: Product not found or does not belong to the company
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
 *                   example: "Final product not found or does not belong to your company"
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
 *                   example: "Error creating BOM"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/bom/bulk-upload:
 *   post:
 *     summary: Bulk upload BOM records from CSV
 *     description: Upload a CSV file with headers "Final Product Code", "Raw Material Product Code", "Quantity". Each row is validated (product codes must exist in Product model for the company). Valid rows get a unique BOM number and are inserted via bulkCreate. Returns count of created records and any row-level errors.
 *     tags: [BOM]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with headers Final Product Code, Raw Material Product Code, Quantity
 *     responses:
 *       201:
 *         description: Bulk upload completed
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
 *                   example: "BOM bulk upload completed. 3 record(s) created."
 *                 created:
 *                   type: integer
 *                   example: 3
 *                 errors:
 *                   type: array
 *                   description: Present only if some rows had invalid product codes
 *                   items:
 *                     type: object
 *                     properties:
 *                       row:
 *                         type: object
 *                         description: Original CSV row
 *                       reason:
 *                         type: string
 *                         example: "Raw material product not found for code: INVALID-CODE"
 *       400:
 *         description: No file uploaded, invalid file type, or no valid rows
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
 *                   example: "No file uploaded. Please upload a CSV file."
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
 *                   example: "Error processing BOM bulk upload"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/bom/list:
 *   get:
 *     summary: Get paginated list of all BOM records
 *     tags: [BOM]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: bom_no
 *         schema:
 *           type: string
 *         description: Filter by BOM number (partial match supported)
 *         example: "BOM098734"
 *       - in: query
 *         name: fg_product_id
 *         schema:
 *           type: integer
 *         description: Filter by Final Product ID
 *         example: 2624
 *     responses:
 *       200:
 *         description: BOM list fetched successfully
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
 *                   example: "BOM list fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     rows:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           company_id:
 *                             type: integer
 *                             example: 1
 *                           final_product_id:
 *                             type: integer
 *                             example: 1
 *                           raw_material_product_id:
 *                             type: integer
 *                             example: 2
 *                           bom_no:
 *                             type: string
 *                             example: "BOM098734"
 *                           quantity:
 *                             type: integer
 *                             example: 10
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                           finalProduct:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               product_name:
 *                                 type: string
 *                               product_code:
 *                                 type: string
 *                               sku_product:
 *                                 type: string
 *                           rawMaterialProduct:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               product_name:
 *                                 type: string
 *                               product_code:
 *                                 type: string
 *                               sku_product:
 *                                 type: string
 *                           company:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               company_name:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 100
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 10
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPreviousPage:
 *                           type: boolean
 *                           example: false
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
 *                   example: "Error fetching BOM list"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/bom/{id}:
 *   delete:
 *     summary: Delete BOM by ID (soft delete)
 *     tags: [BOM]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: BOM ID to delete
 *         example: 1
 *     responses:
 *       200:
 *         description: BOM deleted successfully
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
 *                   example: "BOM deleted successfully"
 *       400:
 *         description: Bad request - Invalid BOM ID
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
 *                   example: "Invalid BOM ID"
 *       404:
 *         description: BOM not found or does not belong to the company
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
 *                   example: "BOM not found or does not belong to your company"
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
 *                   example: "Error deleting BOM"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/bom/report:
 *   get:
 *     summary: Get BOM report with pagination and filtering
 *     description: Retrieves a paginated BOM report for the authenticated user's company. Supports filtering by BOM number. Returns simplified BOM data with final product and raw material product information.
 *     tags: [BOM]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: bom_no
 *         schema:
 *           type: string
 *         description: Filter by BOM number (partial match supported)
 *         example: "BOM098734"
 *     responses:
 *       200:
 *         description: BOM report fetched successfully
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
 *                   example: "BOM report fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     rows:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           bom_no:
 *                             type: string
 *                             example: "BOM098734"
 *                           quantity:
 *                             type: integer
 *                             example: 10
 *                           finalProduct:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               product_name:
 *                                 type: string
 *                                 example: "Final Product Name"
 *                               product_code:
 *                                 type: string
 *                                 example: "FP001"
 *                           rawMaterialProduct:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 2
 *                               product_name:
 *                                 type: string
 *                                 example: "Raw Material Product Name"
 *                               product_code:
 *                                 type: string
 *                                 example: "RM001"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 100
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 10
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPreviousPage:
 *                           type: boolean
 *                           example: false
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
 *                   example: "Error getting BOM report"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/bom/inventory-needed:
 *   get:
 *     summary: Get sum of inventory needed grouped by product ID
 *     description: Returns the sum of inventory needed per raw material product. Accepts comma-separated raw material product IDs (rm_product_ids). Inventory needed is computed from BOM and final product stock as (buffer_size + buffer_size*0.005 + sale_order_recieved) - (quantity + inventory_at_transit); only final product stock in FG store with positive shortfall is considered. Result is sum(inventory_needed * bom_quantity) grouped by raw_material_product_id.
 *     tags: [BOM]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rm_product_ids
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated raw material product IDs
 *         example: "1,2,3"
 *     responses:
 *       200:
 *         description: Inventory needed fetched successfully
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
 *                   example: "Inventory needed fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_id:
 *                         type: integer
 *                         description: Raw material product ID
 *                         example: 74
 *                       inventory_needed:
 *                         type: number
 *                         description: Sum of (final product shortfall × BOM quantity) for this raw material
 *                         example: 125.5
 *       400:
 *         description: Bad request - rm_product_ids is required
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
 *                   example: "Query parameter rm_product_ids (comma-separated product IDs) is required"
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
 *                   example: "Error getting inventory needed"
 *                 error:
 *                   type: string
 */
