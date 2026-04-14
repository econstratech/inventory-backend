/**
 * @swagger
 * tags:
 *   name: Master
 *   description: Master data management endpoints
 */

/**
 * @swagger
 * /api/master/uom:
 *   post:
 *     summary: Create a new Master UOM (Unit of Measurement) record
 *     tags: [Master]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Kilogram"
 *                 description: "Name of the unit of measurement (required, must be unique)"
 *               label:
 *                 type: string
 *                 example: "kg"
 *                 description: "Short label or abbreviation for the UOM (optional)"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *                 description: "Whether the UOM is active (defaults to true if not provided)"
 *     responses:
 *       200:
 *         description: Master UOM created successfully
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
 *                   example: "Master UOM created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Kilogram"
 *                     label:
 *                       type: string
 *                       example: "kg"
 *                     is_active:
 *                       type: boolean
 *                       example: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-09T10:00:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-09T10:00:00.000Z"
 *       400:
 *         description: Validation error or duplicate UOM name
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
 *                   example: "Name is required"
 *                   description: "Error message - either 'Name is required' or 'UOM with this name already exists'"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/master/uom/list:
 *   get:
 *     summary: Get all active Master UOMs
 *     tags: [Master]
 *     responses:
 *       '200':
 *         description: List of active UOMs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       label:
 *                         type: string
 *       '500':
 *         description: Server error
 */

/**
 * @swagger
 * /api/master/product-type:
 *   post:
 *     summary: Create a new Master Product Type record
 *     tags: [Master]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Raw Material (RM)"
 *                 description: "Name of the product type (required, must be unique)"
 *               is_active:
 *                 type: integer
 *                 example: 1
 *                 description: "Whether the product type is active or not (defaults to 1 if not provided)"
 *     responses:
 *       200:
 *         description: Master Product Type created successfully
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
 *                   example: "Master Product Type is created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Raw Material (RM)"
 *                     is_active:
 *                       type: integer
 *                       example: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-09T10:00:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-09T10:00:00.000Z"
 *       400:
 *         description: Validation error or duplicate product type
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
 *                   example: "Name is required"
 *                   description: "Error message - either 'Name is required' or 'Product type with this name already exists'"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/master/product-type/list:
 *   get:
 *     summary: Get all active master product types
 *     tags: [Master]
 *     responses:
 *       '200':
 *         description: List of active product types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *       '500':
 *         description: Server error
 */

/**
 * @swagger
 * /api/master/product-category:
 *   get:
 *     summary: Get active product categories (paginated)
 *     description: Returns active product categories (`status = 1`) for the authenticated user's company. Supports pagination and optional title search using `searchkey`.
 *     tags: [Master]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *         example: 10
 *       - in: query
 *         name: searchkey
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter categories by partial title match
 *         example: "raw"
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *           default: 1
 *         description: Filter by category status (use `1` for active categories only)
 *         example: 1
 *     responses:
 *       200:
 *         description: Product categories fetched successfully
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
 *                   example: "Product Categories fetched successfully"
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
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                             description: Product category ID
 *                           title:
 *                             type: string
 *                             example: "Raw Material"
 *                             description: Product category title
 *                           status:
 *                             type: integer
 *                             example: 1
 *                             description: Active status (1 = active)
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-01-09T10:00:00.000Z"
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-01-09T10:00:00.000Z"
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
 *                   example: "Failed to fetch active product categories"
 *                 error:
 *                   type: string
 *                   example: "Error details"
 */


/**
 * @swagger
 * /api/master/product-attribute:
 *   post:
 *     summary: Create a new Master Product Attribute record
 *     tags: [Master]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Category"
 *                 description: "Name of the product category (required, must be unique)"
 *               is_required:
 *                 type: integer
 *                 example: 1
 *                 description: "Whether this field is required or not for fill up the product form (defaults to 1 if not provided)"
 *               is_active:
 *                 type: integer
 *                 example: 1
 *                 description: "Whether the product attribute is active or not (defaults to 1 if not provided)"
 *               is_filterable:
 *                 type: integer
 *                 example: 1
 *                 description: "Whether the product attribute is filterable or not (defaults to 0 if not provided)"
 *               field_type:
 *                 type: string
 *                 example: "text"
 *                 description: "Field type of the product attribute (defaults to null if not provided)"
 *     responses:
 *       200:
 *         description: Master Product Attribute created successfully
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
 *                   example: "Master Product Attribute is created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Raw Material (RM)"
 *                     is_required:
 *                       type: integer
 *                       example: true
 *                     is_active:
 *                       type: integer
 *                       example: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-09T10:00:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-09T10:00:00.000Z"
 *                     deleted_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-09T10:00:00.000Z"
 *       400:
 *         description: Validation error or duplicate product attribute
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
 *                   example: "Name is required"
 *                   description: "Error message - either 'Name is required' or 'Product attribute with this name already exists'"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/master/product-attribute/{id}:
 *   put:
 *     summary: Update a product attribute by ID
 *     description: Updates name, is_required, and/or field_type. Send only the fields you want to update. At least one of name, is_required, or field_type is required.
 *     tags: [Master]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product attribute ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Attribute name (must be unique per company)
 *                 example: "Color"
 *               is_required:
 *                 type: integer
 *                 description: 1 = required, 0 = optional
 *                 example: 1
 *               field_type:
 *                 type: string
 *                 description: Field type (e.g. text, number, select)
 *                 example: "text"
 *     responses:
 *       200:
 *         description: Product attribute updated successfully
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
 *                   example: "Product attribute updated successfully"
 *       400:
 *         description: Validation error, duplicate name, or no fields provided
 *       404:
 *         description: Product attribute not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/master/product-attribute/list:
 *   get:
 *     summary: Get all active master product attributes
 *     tags: [Master]
 *     parameters:
 *       - in: query
 *         name: company_id
 *         schema:
 *           type: integer
 *         description: to apply filter by company ID
 *     responses:
 *       '200':
 *         description: List of active product attributes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       is_required:
 *                         type: integer
 *                       is_filterable:
 *                         type: integer
 *                       field_type:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-01-09T10:00:00.000Z"
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-01-09T10:00:00.000Z"
 *       '500':
 *         description: Server error
 */

/**
 * @swagger
 * /api/master/brand:
 *   post:
 *     summary: Create a new Master Brand record
 *     tags: [Master]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nike"
 *                 description: "Name of the brand (required, must be unique per company)"
 *               description:
 *                 type: string
 *                 example: "Premium athletic footwear and apparel brand"
 *                 description: "Description of the brand (optional)"
 *     responses:
 *       200:
 *         description: Master Brand created successfully
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
 *                   example: "Master Brand created successfully"
 *       400:
 *         description: Validation error or duplicate brand name
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
 *                   example: "Master Brand with this name already exists"
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
 *                   example: "Error creating Master Brand"
 *                 error:
 *                   type: string
 *                   example: "Error details"
 */

/**
 * @swagger
 * /api/master/brand/{id}:
 *   put:
 *     summary: Update a Master Brand by ID
 *     description: Updates name and/or description of an existing master brand. Brand must belong to the user's company.
 *     tags: [Master]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Master Brand ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nike"
 *                 description: Brand name
 *               description:
 *                 type: string
 *                 example: "Premium athletic footwear and apparel brand"
 *                 description: Brand description (optional)
 *           example:
 *             name: "Nike"
 *             description: "Premium athletic footwear and apparel brand"
 *     responses:
 *       200:
 *         description: Master Brand updated successfully
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
 *                   example: "Master Brand updated successfully"
 *       400:
 *         description: Master Brand not found
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
 *                   example: "Master Brand not found"
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
 *                   example: "Error updating Master Brand"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/master/brand/{id}:
 *   delete:
 *     summary: Delete a Master Brand by ID
 *     description: Permanently deletes a master brand. Brand must belong to the user's company.
 *     tags: [Master]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Master Brand ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Master Brand deleted successfully
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
 *                   example: "Master Brand deleted successfully"
 *       404:
 *         description: Master Brand not found
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
 *                   example: "Master Brand not found"
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
 *                   example: "Error deleting Master Brand"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/master/brand/list:
 *   get:
 *     summary: Get all active master brands
 *     description: Returns a list of all master brands for the authenticated user's company, ordered by name in ascending order. Supports optional search by brand name using the brandName query parameter.
 *     tags: [Master]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: brandName
 *         schema:
 *           type: string
 *         description: Optional search parameter to filter brands by name (partial match, case-insensitive)
 *         example: "Nike"
 *     responses:
 *       200:
 *         description: List of active master brands fetched successfully
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
 *                   example: "Master Brands fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                         description: Brand ID
 *                       name:
 *                         type: string
 *                         example: "Nike"
 *                         description: Brand name
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         example: "Premium athletic footwear and apparel brand"
 *                         description: Brand description
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
 *                   example: "Failed to fetch active master brands"
 *                 error:
 *                   type: string
 *                   example: "Error details"
 */

/**
 * @swagger
 * /api/master/production-steps:
 *   get:
 *     summary: Get all active production steps
 *     description: Returns active records from production steps master ordered by ID ascending.
 *     tags: [Master]
 *     security:
 *       - bearerAuth: []
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
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Cutting"
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         example: "Cut raw material as per BOM dimensions"
 *                       is_active:
 *                         type: integer
 *                         example: 1
 *       400:
 *         description: Error while getting production steps
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   description: Error object/message returned by the controller
 */

/**
 * @swagger
 * /api/master/production-steps:
 *   post:
 *     summary: Create production step (master + company)
 *     description: |
 *       Creates a row in the master production steps table, then creates a matching `CompanyProductionStep`
 *       for the authenticated user's company (`req.user.company_id`). The master step name must be unique.
 *     tags: [Master]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Production step name (trimmed). Must be unique across master steps.
 *                 example: "Cutting"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Optional description (trimmed). Omit or send empty string if none.
 *                 example: "Cut raw material as per BOM dimensions"
 *           example:
 *             name: "Cutting"
 *             description: "Cut raw material as per BOM dimensions"
 *     responses:
 *       200:
 *         description: Production step created successfully
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
 *                   example: "Production step created successfully"
 *       400:
 *         description: Duplicate master step name
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
 *                   example: "Production step with this name already exists"
 *       500:
 *         description: Server error while creating the step
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
 *                   example: "Error creating production step"
 *                 error:
 *                   type: string
 *                   description: Error message from the exception
 */