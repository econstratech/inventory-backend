/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Product management endpoints
 */

/**
 * @swagger
 * /api/product/add:
 *   post:
 *     summary: Add a new product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *          application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_code
 *               - product_name
 *               - product_type_id
 *               - product_variants
 *             properties:
 *               product_code:
 *                 type: string
 *                 description: Unique product code for the product
 *                 example: "TRWEE456"
 *               product_name:
 *                 type: string
 *                 description: Name of the product
 *                 example: "Product 002"
 *               product_type_id:
 *                 type: integer
 *                 description: ID of the product type
 *                 example: 4
 *               product_category_id:
 *                 type: integer
 *                 description: ID of the product category
 *                 example: 28514
 *               brand_id:
 *                 type: integer
 *                 description: ID of the brand
 *                 example: 1
 *               is_batch_applicable:
 *                 type: integer
 *                 description: Whether batch tracking is applicable (1 = yes, 0 = no)
 *                 example: 0
 *               markup_percentage:
 *                 type: string
 *                 description: Markup percentage for the product
 *                 example: "5"
 *               dynamic_attributes:
 *                 type: array
 *                 description: Dynamic product attributes based on product type
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_attribute_id
 *                     - is_required
 *                     - value
 *                   properties:
 *                     product_attribute_id:
 *                       type: integer
 *                       description: ID of the product attribute
 *                       example: 1
 *                     is_required:
 *                       type: integer
 *                       description: 1 = required, 0 = optional
 *                       example: 0
 *                     value:
 *                       type: string
 *                       description: Value for the attribute
 *                       example: "Leather"
 *               product_variants:
 *                 type: array
 *                 description: Product variants with different UOMs and weights
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - uom_id
 *                     - weight
 *                   properties:
 *                     uom_id:
 *                       type: integer
 *                       description: Unit of measurement ID
 *                       example: 1
 *                     weight:
 *                       type: number
 *                       description: Weight per unit
 *                       example: 10
 *           example:
 *             product_code: "TRWEE456"
 *             product_name: "Product 002"
 *             product_type_id: 4
 *             dynamic_attributes:
 *               - product_attribute_id: 1
 *                 is_required: 0
 *                 value: "Leather"
 *               - product_attribute_id: 3
 *                 is_required: 0
 *                 value: "Red"
 *             product_variants:
 *               - uom_id: 1
 *                 weight: 10
 *             product_category_id: 28514
 *             markup_percentage: "5"
 *             brand_id: 1
 *     responses:
 *       200:
 *         description: Product created successfully
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
 *                   example: "Product has been added successfully"
 *       400:
 *         description: Validation error
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
 *                   example: "Product code must be unique"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error adding product:"
 */

/**
 * @swagger
 * /api/product/list:
 *   get:
 *     summary: Get all products
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: product_category_id
 *         schema:
 *           type: integer
 *         description: Product category ID
 *       - in: query
 *         name: searchkey
 *         schema:
 *           type: string
 *         description: search key
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Response type. If set to 'dropDown', returns minimal data without associations. For any other value or if omitted, returns full product data with associations (product variants, attributes, categories, etc.)
 *         example: "dropDown"
 *     responses:
 *       200:
 *         description: List of products
 */

/**
 * @swagger
 * /api/product/all-deleted-products:
 *   get:
 *     summary: Get all deleted products
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of deleted products
 */

/**
 * @swagger
 * /api/product/delete-multiple-restore:
 *   delete:
 *     summary: Restore multiple deleted products
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Products restored successfully
 */

/**
 * @swagger
 * /api/product/delete-multiple:
 *   delete:
 *     summary: Delete multiple products
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Products deleted successfully
 */

/**
 * @swagger
 * /api/product/update/{id}:
 *   post:
 *     summary: Update a product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *          application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_code:
 *                 type: string
 *                 example: Product Code
 *               product_name:
 *                 type: string
 *               product_type_id:
 *                 type: integer
 *                 example: 1
 *               uom_id:
 *                 type: integer
 *                 example: 1
 *               buffer_size:
 *                 type: integer
 *                 example: 50
 *               is_batch_applicable:
 *                 type: integer
 *                 example: 0
 *               dynamic_attributes:
 *                 type: array
 *                 description: Dynamic product attributes based on product type
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_attribute_id:
 *                       type: integer
 *                       example: 1
 *                     is_required:
 *                       type: integer
 *                       description: 1 = required, 0 = optional
 *                       example: 1
 *                     value:
 *                       type: string
 *                       example: Textile Garments
 *     responses:
 *       200:
 *         description: Product updated successfully
 */

/**
 * @swagger
 * /api/product/update-variants/{id}:
 *   post:
 *     summary: Update product variants
 *     description: Updates or creates product variants for a product. Variants with an id field will be updated. Variants without an id or with id null will be created as new entries. All operations are performed within a transaction.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_variants
 *             properties:
 *               product_variants:
 *                 type: array
 *                 description: Array of product variants to update or create. Variants with id are updated, variants without id or with id null are created.
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - uom_id
 *                     - weight
 *                   properties:
 *                     id:
 *                       type: integer
 *                       nullable: true
 *                       description: Variant ID. If provided, the variant will be updated. If null or not provided, a new variant will be created.
 *                       example: 1
 *                     uom_id:
 *                       type: integer
 *                       description: Unit of measurement ID
 *                       example: 2
 *                     weight:
 *                       type: number
 *                       description: Weight per unit (will be saved as weight_per_unit)
 *                       example: 300
 *           example:
 *             product_variants:
 *               - id: 1
 *                 uom_id: 2
 *                 weight: 300
 *               - id: 2
 *                 uom_id: 2
 *                 weight: 250
 *               - id: null
 *                 uom_id: 2
 *                 weight: 250
 *     responses:
 *       200:
 *         description: Product variants updated successfully
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
 *                   example: "Product variants updated successfully"
 *       400:
 *         description: Validation error
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
 *                   example: "product_variants array is required and must not be empty"
 *       404:
 *         description: Product not found
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
 *                   example: "Product not found or does not belong to your company"
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
 *                   example: "Error updating product variants"
 */

/**
 * @swagger
 * /api/product/variants/{id}:
 *   get:
 *     summary: Get all variants of a product
 *     description: Retrieves all available variants for a specific product, including UOM (Unit of Measurement) details. Returns product information along with all its variants. Supports optional filtering by UOM ID and weight per unit.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *         example: 1
 *       - in: query
 *         name: uom_id
 *         schema:
 *           type: integer
 *         description: Optional filter by Unit of Measurement ID
 *         example: 2
 *       - in: query
 *         name: weight
 *         schema:
 *           type: integer
 *         description: Optional filter by weight per unit (exact match)
 *         example: 300
 *     responses:
 *       200:
 *         description: Product variants fetched successfully
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
 *                   example: "Product variants fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         product_code:
 *                           type: string
 *                           example: "TRWEE456"
 *                         product_name:
 *                           type: string
 *                           example: "Product 002"
 *                     variants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           uom_id:
 *                             type: integer
 *                             example: 2
 *                           weight_per_unit:
 *                             type: integer
 *                             example: 300
 *                           price_per_unit:
 *                             type: number
 *                             format: decimal
 *                             example: 150.50
 *                           status:
 *                             type: integer
 *                             example: 1
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-01-19T12:30:00.000Z"
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-01-19T12:30:00.000Z"
 *                           masterUOM:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 2
 *                               name:
 *                                 type: string
 *                                 example: "Kilogram"
 *                               label:
 *                                 type: string
 *                                 example: "kg"
 *       404:
 *         description: Product not found
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
 *                   example: "Product not found or does not belong to your company"
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
 *                   example: "Error fetching product variants"
 *                 error:
 *                   type: string
 *                   example: "Error details"
 */

/**
 * @swagger
 * /api/product/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */

/**
 * @swagger
 * /api/product/bulk-upload:
 *   post:
 *     summary: Bulk upload products from file
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file with products
 *     responses:
 *       200:
 *         description: Products uploaded successfully
 */

/**
 * @swagger
 * /api/product/details/{id}:
 *   get:
 *     summary: Get a specific product by ID
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 */

/**
 * @swagger
 * /api/product/storewise-all-products/{id}:
 *   get:
 *     summary: Get all products by store
 *     description: Returns paginated stock entries for a given store/warehouse. Each row includes stock entry id, quantity, and associated product (id, product_name, product_code). Supports search by product code, SKU, or product name.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Store/warehouse ID
 *         example: 1
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         description: Number of records per page
 *         example: 10
 *       - in: query
 *         name: searchkey
 *         schema:
 *           type: string
 *         description: Search by product code, SKU, or product name (partial match)
 *         example: "PROD-001"
 *     responses:
 *       200:
 *         description: List of products for the store
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
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total_records:
 *                           type: integer
 *                           example: 50
 *                         total_pages:
 *                           type: integer
 *                           example: 5
 *                         current_page:
 *                           type: integer
 *                           example: 1
 *                         per_page:
 *                           type: integer
 *                           example: 10
 *                         has_next_page:
 *                           type: boolean
 *                           example: true
 *                         has_prev_page:
 *                           type: boolean
 *                           example: false
 *                         next_page:
 *                           type: integer
 *                           nullable: true
 *                           example: 2
 *                         prev_page:
 *                           type: integer
 *                           nullable: true
 *                           example: null
 *                     rows:
 *                       type: array
 *                       description: Stock entries for the store
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: Stock entry ID
 *                             example: 1
 *                           quantity:
 *                             type: number
 *                             example: 100
 *                           product:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 12
 *                               product_name:
 *                                 type: string
 *                                 example: "Product Name"
 *                               product_code:
 *                                 type: string
 *                                 example: "PROD-001"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */

/**
 * @swagger
 * /api/product/update-stock:
 *   post:
 *     summary: Update product stock with tracking
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               store_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Stock updated successfully
 */

/**
 * @swagger
 * /api/product/update-stockonly:
 *   post:
 *     summary: Update product stock only
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Stock updated successfully
 */

/**
 * @swagger
 * /api/product/update-stocktransfer:
 *   post:
 *     summary: Transfer or scrap stock between stores
 *     description: Creates a stock transfer log and processes each product (transfer or scrap by transfer_type). Supports batch-level transfers when is_batch_applicable is true and batches are provided. from_store and to_store may be null (e.g. for scrap). Processed within a transaction; on failure the transaction is rolled back.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transfer_type
 *               - products
 *             properties:
 *               from_store:
 *                 type: integer
 *                 nullable: true
 *                 description: Source warehouse/store ID (null for scrap)
 *                 example: 10
 *               to_store:
 *                 type: integer
 *                 nullable: true
 *                 description: Destination warehouse/store ID (null for scrap)
 *                 example: null
 *               sales_order_reference_number:
 *                 type: string
 *                 nullable: true
 *                 description: Sales order reference number (null for stock transfer)
 *                 example: "SO-001"
 *               purchase_order_reference_number:
 *                 type: string
 *                 nullable: true
 *                 description: Purchase order reference number (null for stock transfer)
 *                 example: "PO-001"
 *               comment:
 *                 type: string
 *                 description: Optional comment for the transfer
 *                 example: "Scrap all mentioned items"
 *               transfer_type:
 *                 type: string
 *                 description: Type of transfer (e.g. stock transfer, scrap)
 *                 example: "scrap_items"
 *               products:
 *                 type: array
 *                 description: List of products to transfer/scrap with quantities and optional batch breakdown
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - transferred_quantity
 *                     - is_batch_applicable
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Stock entry ID (product stock entry id)
 *                       example: 2618
 *                     transferred_quantity:
 *                       type: integer
 *                       description: Total quantity to transfer/scrap
 *                       example: 4
 *                     warehouse_id:
 *                       type: integer
 *                       description: Warehouse ID (null for scrap)
 *                       example: 10
 *                     is_batch_applicable:
 *                       type: boolean
 *                       description: Whether this product uses batch-level allocation
 *                       example: true
 *                     batches:
 *                       type: array
 *                       description: Batch-wise allocation (when is_batch_applicable is true). Empty when not batch applicable.
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: Batch ID (e.g. ReceiveProductBatch id)
 *                             example: 8
 *                           available_quantity:
 *                             type: integer
 *                             example: 10
 *                           quantity:
 *                             type: integer
 *                             description: Quantity to take from this batch
 *                             example: 4
 *           example:
 *             from_store: 10
 *             to_store: null
 *             comment: "Scrap all mentioned items"
 *             transfer_type: "scrap_items"
 *             products:
 *               - id: 2618
 *                 transferred_quantity: 4
 *                 is_batch_applicable: true
 *                 batches:
 *                   - id: 8
 *                     available_quantity: 10
 *                     quantity: 4
 *               - id: 2624
 *                 transferred_quantity: 6
 *                 is_batch_applicable: false
 *                 batches: []
 *     responses:
 *       200:
 *         description: Stock transfer recorded successfully
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
 *                   example: "Stock transfer recorded successfully"
 *       500:
 *         description: Server error (transaction rolled back on failure)
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
 *                   example: "Error in UpdateStockTranfer"
 *                 error:
 *                   type: string
 *                   example: "Error details"
 */

/**
 * @swagger
 * /api/product/low-quantity-products:
 *   get:
 *     summary: Get products with low quantity
 *     tags: [Product]
 *     security: []
 *     responses:
 *       200:
 *         description: List of low quantity products
 */

/**
 * @swagger
 * /api/product/over-stock-products:
 *   get:
 *     summary: Get products with over stock
 *     tags: [Product]
 *     security: []
 *     responses:
 *       200:
 *         description: List of over stock products
 */

/**
 * @swagger
 * /api/product/add-to-stock:
 *   post:
 *     summary: Add multiple products to stock
 *     description: Add multiple products to stock at once. Validates that no duplicate product_id, product_variant_id, and warehouse_id combinations exist in the payload. Each entry must include a product variant ID.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             description: Array of stock entries to add
 *             items:
 *               type: object
 *               required:
 *                 - product_id
 *                 - product_variant_id
 *                 - warehouse_id
 *                 - quantity
 *               properties:
 *                 product_id:
 *                   type: integer
 *                   example: 12
 *                   description: ID of the product
 *                 product_variant_id:
 *                   type: integer
 *                   example: 5
 *                   description: ID of the product variant (UOM-specific variant)
 *                 warehouse_id:
 *                   type: integer
 *                   example: 1
 *                   description: ID of the warehouse
 *                 quantity:
 *                   type: integer
 *                   example: 50
 *                   description: Quantity to add to stock
 *                 buffer_size:
 *                   type: integer
 *                   example: 10
 *                   description: Buffer size for the product (optional)
 *             example:
 *               - product_id: 12
 *                 product_variant_id: 5
 *                 warehouse_id: 1
 *                 quantity: 50
 *                 buffer_size: 10
 *               - product_id: 16
 *                 product_variant_id: 8
 *                 warehouse_id: 1
 *                 quantity: 100
 *                 buffer_size: 10
 *     responses:
 *       200:
 *         description: Stock entries added successfully
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
 *                   example: "2 stock entries added successfully"
 *                 data:
 *                   type: array
 *                   description: Array of created stock entries
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       company_id:
 *                         type: integer
 *                         example: 1
 *                       product_id:
 *                         type: integer
 *                         example: 12
 *                       product_variant_id:
 *                         type: integer
 *                         example: 5
 *                       warehouse_id:
 *                         type: integer
 *                         example: 1
 *                       buffer_size:
 *                         type: integer
 *                         example: 10
 *                       user_id:
 *                         type: integer
 *                         example: 1
 *                       quantity:
 *                         type: integer
 *                         example: 50
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-01-19T12:30:00.000Z"
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-01-19T12:30:00.000Z"
 *       400:
 *         description: Validation error or duplicate entries found
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
 *                   example: "Duplicate product_id and warehouse_id combinations found in payload"
 *                   description: Error message indicating duplicate entries or validation errors
 *                 errors:
 *                   type: array
 *                   description: List of validation errors (present when validation fails)
 *                   items:
 *                     type: string
 *                     example: "Entry 1: product_variant_id is required"
 *                 duplicates:
 *                   type: array
 *                   description: List of duplicate entries (present when duplicates are found)
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_id:
 *                         type: integer
 *                         example: 12
 *                       product_variant_id:
 *                         type: integer
 *                         example: 5
 *                       warehouse_id:
 *                         type: integer
 *                         example: 1
 *                       entry_index:
 *                         type: integer
 *                         example: 3
 *                 existing_entries:
 *                   type: array
 *                   description: List of existing stock entries (present when stock already exists)
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_id:
 *                         type: integer
 *                         example: 12
 *                       product_variant_id:
 *                         type: integer
 *                         example: 5
 *                       warehouse_id:
 *                         type: integer
 *                         example: 1
 *                 missing_products:
 *                   type: array
 *                   description: List of product IDs that do not exist
 *                   items:
 *                     type: integer
 *                     example: 99
 *                 missing_warehouses:
 *                   type: array
 *                   description: List of warehouse IDs that do not exist
 *                   items:
 *                     type: integer
 *                     example: 99
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
 *                   example: "Error adding products to stock"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/product/bulk-add-to-stock:
 *   post:
 *     summary: Bulk add to stock from CSV
 *     description: Upload a CSV file with headers "Product Code", "Store Name", "Quantity". Rows are aggregated by (Product Code, Store Name); quantity is summed for duplicates. If a ProductStockEntry already exists for that product and store, quantity is added to the existing value; otherwise a new entry is created. Optimized for 200+ rows. Invalid rows (unknown product or store) are skipped and reported in the response.
 *     tags: [Product]
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
 *                 description: CSV file with headers Product Code, Store Name, Quantity
 *     responses:
 *       200:
 *         description: Bulk add to stock completed
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
 *                   example: "Bulk add to stock completed."
 *                 created:
 *                   type: integer
 *                   description: Number of new stock entries created
 *                   example: 120
 *                 updated:
 *                   type: integer
 *                   description: Number of existing entries updated (quantity added)
 *                   example: 85
 *                 errors:
 *                   type: array
 *                   description: Present only when some rows were skipped (product or store not found)
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_code:
 *                         type: string
 *                         example: "PROD-X"
 *                       store_name:
 *                         type: string
 *                         example: "Store A"
 *                       reason:
 *                         type: string
 *                         example: "Product not found"
 *       400:
 *         description: No file, invalid file type, no valid rows, or no rows could be processed
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
 *                 errors:
 *                   type: array
 *                   description: Per-row errors when product or store not found
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_code:
 *                         type: string
 *                       store_name:
 *                         type: string
 *                       reason:
 *                         type: string
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
 *                   example: "Error processing bulk add to stock"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/product/product-available-batches/{id}:
 *   get:
 *     summary: Get available batches for a product
 *     description: Returns received product batches for the given product ID, scoped to the user's company. Only includes batches linked to purchases with status 10 (completed). Each batch includes id, batch_no, manufacture_date, expiry_date, quantity, available_quantity, and associated purchase (id, reference_number).
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *         example: 74
 *     responses:
 *       200:
 *         description: Available batches fetched successfully
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
 *                     batches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 7
 *                           batch_no:
 *                             type: string
 *                             example: "T889573"
 *                           manufacture_date:
 *                             type: string
 *                             format: date
 *                             example: "2025-11-14"
 *                           expiry_date:
 *                             type: string
 *                             format: date
 *                             example: "2026-05-22"
 *                           quantity:
 *                             type: integer
 *                             example: 20
 *                           available_quantity:
 *                             type: integer
 *                             example: 15
 *                           purchase:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 196
 *                               reference_number:
 *                                 type: string
 *                                 example: "4868336"
 *       400:
 *         description: Bad request or error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Error response (structure may vary)
 */

/**
 * @swagger
 * /api/product/stock-entries:
 *   get:
 *     summary: Get all stock entries
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: integer
 *         description: Product ID
 *       - in: query
 *         name: brand_id
 *         schema:
 *           type: integer
 *         description: Brand ID (filters stock entries by product brand)
 *       - in: query
 *         name: product_type_id
 *         schema:
 *           type: integer
 *         description: Product type ID (filters stock entries by product type)
 *       - in: query
 *         name: warehouse_id
 *         schema:
 *           type: integer
 *         description: Warehouse ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: searchkey
 *         schema:
 *           type: string
 *         description: search key
 *     responses:
 *       200:
 *         description: List of stock entries
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
 *                   example: "List of stock entries"
 *                 data:
 *                   type: array
 *                   description: Array of stock entries
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       company_id:
 *                         type: integer
 *                         example: 1
 *                       product_id:
 *                         type: integer
 *                         example: 12
 *                       warehouse_id:
 *                         type: integer
 *                         example: 1
 *                       user_id:
 *                         type: integer
 *                         example: 1
 *                       quantity:
 *                         type: integer
 *                         example: 50
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-01-19T12:30:00.000Z"
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-01-19T12:30:00.000Z"
 *                       deleted_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-01-19T12:30:00.000Z"
 *       400:
 *         description: Validation error
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
 *                   example: "Validation error"
 *                 errors:
 *                   type: array
 *                   description: List of validation errors
 *                   items:
 *                     type: string
 *                     example: "product_id is required"
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
 *                   example: "Server error"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/product/stock-entries/{id}:
 *   get:
 *     summary: Get a specific stock entry by ID
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Stock entry ID
 *     responses:
 *       200:
 *         description: Stock entry details
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
 *                   example: "Stock entry details"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     product_id:
 *                       type: integer
 *                       example: 1
 *                     warehouse_id:
 *                       type: integer
 *                       example: 1
 *                     quantity:
 *                       type: integer
 *                       example: 50
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-19T12:30:00.000Z"
 *       404:
 *         description: Stock entry not found
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
 *                   example: "Stock entry not found"
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
 *                   example: "Server error"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/product/stock-entries/{id}:
 *   put:
 *     summary: Update stock entry quantity
 *     description: Updates the quantity of a specific stock entry. The stock entry must exist and match the provided product_id and warehouse_id.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Stock entry ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - warehouse_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: integer
 *                 description: Product ID (must match the stock entry)
 *                 example: 12
 *               warehouse_id:
 *                 type: integer
 *                 description: Warehouse ID (must match the stock entry)
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 description: New quantity to update
 *                 example: 75
 *           example:
 *             product_id: 12
 *             warehouse_id: 1
 *             quantity: 75
 *     responses:
 *       200:
 *         description: Stock entry updated successfully
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
 *                   example: "Stock entry updated successfully"
 *       404:
 *         description: Stock entry not found
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
 *                   example: "Stock entry not found"
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
 *                   example: "Error updating stock entry"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/product/stock-entries/{id}:
 *   delete:
 *     summary: Delete a stock entry by ID
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Stock entry ID
 *     responses:
 *       200:
 *         description: Stock entry deleted successfully
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
 *                   example: "Stock entry deleted successfully"
 *       404:
 *         description: Stock entry not found
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
 *                   example: "Stock entry not found"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
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
 *                   example: "Server error"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/product/store-wise-stock/{id}:
 *   get:
 *     summary: Get store-wise stock for a particular product
 *     description: Retrieves available stock information for a specific product across all warehouses/stores. Returns quantity, inventory at transit, and inventory at production for each warehouse.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *         example: 12
 *     responses:
 *       200:
 *         description: Store-wise stock fetched successfully
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
 *                   example: "Store-wise stock fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: object
 *                       description: Product information
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 12
 *                         product_name:
 *                           type: string
 *                           example: "Product Name"
 *                         product_code:
 *                           type: string
 *                           example: "PROD-001"
 *                     stores:
 *                       type: array
 *                       description: Array of stock entries per warehouse/store
 *                       items:
 *                         type: object
 *                         properties:
 *                           stock_entry_id:
 *                             type: integer
 *                             example: 1
 *                           warehouse:
 *                             type: object
 *                             description: Warehouse information
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               name:
 *                                 type: string
 *                                 example: "Main Warehouse"
 *                               address:
 *                                 type: string
 *                                 example: "123 Main St"
 *                               city:
 *                                 type: string
 *                                 example: "New York"
 *                               state:
 *                                 type: string
 *                                 example: "NY"
 *                           available_stock:
 *                             type: integer
 *                             description: Available quantity in stock
 *                             example: 50
 *                           inventory_at_transit:
 *                             type: integer
 *                             description: Quantity in transit
 *                             example: 10
 *                           inventory_at_production:
 *                             type: integer
 *                             description: Quantity in production
 *                             example: 5
 *                           total_available:
 *                             type: integer
 *                             description: Total available stock (available + transit + production)
 *                             example: 65
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-01-19T10:30:00.000Z"
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-01-19T10:30:00.000Z"
 *                     total_stock_across_all_stores:
 *                       type: integer
 *                       description: Total stock across all warehouses/stores
 *                       example: 130
 *       404:
 *         description: Product not found
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
 *                   example: "Product not found"
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
 *                   example: "Error getting store-wise stock"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */

/**
 * @swagger
 * /api/product/indent-required-products:
 *   get:
 *     summary: Get indent required products
 *     description: Returns paginated stock entries where inventory is below required level. Required level is computed as (buffer_size + buffer_size * 0.005 + sale_order_recieved) - (quantity + inventory_at_transit); only rows where this value is greater than 0 are returned. Supports filtering by product_id, warehouse_id, product_type_id, and search by product name, SKU, or product code.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         description: Number of records per page
 *         example: 10
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: integer
 *         description: Filter by product ID
 *         example: 12
 *       - in: query
 *         name: warehouse_id
 *         schema:
 *           type: integer
 *         description: Filter by warehouse ID
 *         example: 1
 *       - in: query
 *         name: product_type_id
 *         schema:
 *           type: integer
 *         description: Filter by product type ID
 *         example: 1
 *       - in: query
 *         name: searchkey
 *         schema:
 *           type: string
 *         description: Search by product name, SKU, or product code (partial match)
 *         example: "PROD-001"
 *     responses:
 *       200:
 *         description: Indent required products fetched successfully
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
 *                   example: "Indent required products fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total_records:
 *                           type: integer
 *                           example: 25
 *                         total_pages:
 *                           type: integer
 *                           example: 3
 *                         current_page:
 *                           type: integer
 *                           example: 1
 *                         per_page:
 *                           type: integer
 *                           example: 10
 *                         has_next_page:
 *                           type: boolean
 *                           example: true
 *                         has_prev_page:
 *                           type: boolean
 *                           example: false
 *                         next_page:
 *                           type: integer
 *                           nullable: true
 *                           example: 2
 *                         prev_page:
 *                           type: integer
 *                           nullable: true
 *                           example: null
 *                     rows:
 *                       type: array
 *                       description: Stock entries with inventory below required level
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           quantity:
 *                             type: number
 *                             example: 20
 *                           inventory_at_transit:
 *                             type: number
 *                             example: 5
 *                           inventory_at_production:
 *                             type: number
 *                             example: 0
 *                           sale_order_recieved:
 *                             type: number
 *                             example: 10
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           inventory_needed:
 *                             type: number
 *                             description: Computed shortfall (buffer + 0.5% + sale_order_recieved - quantity - inventory_at_transit)
 *                             example: 15.5
 *                           product:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               product_name:
 *                                 type: string
 *                               sku_product:
 *                                 type: string
 *                               product_code:
 *                                 type: string
 *                               buffer_size:
 *                                 type: number
 *                               is_batch_applicable:
 *                                 type: integer
 *                               productCategory:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                   title:
 *                                     type: string
 *                               masterProductType:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                           warehouse:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
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
 *                   example: "Error getting indent required products"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */