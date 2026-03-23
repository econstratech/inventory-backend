/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventory and stock summary endpoints
 */

/**
 * @swagger
 * /api/inventory/stock-colour-counts:
 *   get:
 *     summary: Get stock colour bucket counts
 *     description: |
 *       Aggregates product stock entries for the authenticated user's company into five colour buckets based on a buffer-utilisation percentage.
 *
 *       For each row, percentage is computed as:
 *       `((buffer_size + buffer_size * 0.005 - inventory_at_transit - quantity) / buffer_size) * 100`
 *       (buffer_size zero is handled via `NULLIF` in SQL).
 *
 *       Buckets (count of stock entries):
 *       - **black**: percentage >= 99
 *       - **red**: 66 <= percentage < 99
 *       - **yellow**: 33 <= percentage < 66
 *       - **green**: 5 <= percentage < 33
 *       - **cyan**: percentage < 5
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock colour counts fetched successfully
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
 *                   example: "Stock colour counts fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     black:
 *                       type: integer
 *                       description: Count of entries in the black bucket (>= 99%)
 *                       example: 2
 *                     red:
 *                       type: integer
 *                       description: Count of entries in the red bucket (66%–&lt;99%)
 *                       example: 5
 *                     yellow:
 *                       type: integer
 *                       description: Count of entries in the yellow bucket (33%–&lt;66%)
 *                       example: 8
 *                     green:
 *                       type: integer
 *                       description: Count of entries in the green bucket (5%–&lt;33%)
 *                       example: 12
 *                     cyan:
 *                       type: integer
 *                       description: Count of entries in the cyan bucket (&lt; 5%)
 *                       example: 3
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
 *                   example: "Error getting stock colour counts"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/inventory/stock-valuation:
 *   get:
 *     summary: Get top 10 stock valuation by dimension
 *     description: |
 *       Returns the top 10 groups by **total stock value** (sum of `quantity × unit price` per stock row).
 *       Unit price uses `COALESCE(regular_buying_price, wholesale_buying_price, product_price, 0)` from `product`.
 *
 *       - **age** (`type=age`): group by **product** — SKU/code, name, total quantity, valuation. Includes `product_id`.
 *       - **category** (`type=category`): group by **product category** — category id and title (uncategorized grouped separately).
 *       - **store** (`type=store`): group by **warehouse** — warehouse id and name.
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [age, category, store]
 *           default: age
 *         description: Grouping dimension
 *     responses:
 *       200:
 *         description: Stock valuation fetched successfully
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
 *                   example: "Stock valuation fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [age, category, store]
 *                       example: age
 *                     rows:
 *                       type: array
 *                       maxItems: 10
 *                       items:
 *                         type: object
 *                         properties:
 *                           product_id:
 *                             type: integer
 *                             description: Present when type is age
 *                             example: 42
 *                           item_id:
 *                             oneOf:
 *                               - type: string
 *                               - type: integer
 *                             nullable: true
 *                             description: SKU/code (age), category id (category), warehouse id (store)
 *                           item_name:
 *                             type: string
 *                             example: "Raw Material 11"
 *                           total_stock:
 *                             type: number
 *                             description: Sum of quantities in the group
 *                             example: 100000
 *                           total_stock_value:
 *                             type: number
 *                             description: Sum of quantity × unit price (raw number for UI formatting)
 *                             example: 12500000.5
 *       400:
 *         description: Invalid type query parameter
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
 *                   example: "Invalid type. Allowed values: age, category, store."
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
 *                   example: "Error getting stock valuation"
 *                 error:
 *                   type: string
 */
