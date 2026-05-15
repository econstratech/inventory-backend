/**
 * @swagger
 * tags:
 *   name: POS
 *   description: Point-of-sale order endpoints
 */

/**
 * @swagger
 * /api/pos/getAllOrdersWithItems:
 *   get:
 *     summary: Get paginated order + item details for the logged-in company
 *     description: >
 *       Returns one row per order item (orders joined with order_items, customer,
 *       and product). Results are scoped to the authenticated user's
 *       `company_id`. Supports pagination, date/month/year filtering,
 *       item-status filtering, and free-text search across customer name,
 *       product name, product code, and custom_order_id. Pass `limit=all`
 *       to disable pagination and return every matching row.
 *     tags: [POS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number. Ignored when `limit=all`.
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           oneOf:
 *             - type: integer
 *               minimum: 1
 *               maximum: 500
 *             - type: string
 *               enum: [all]
 *           default: 10
 *         description: Items per page (1–500), or the literal string `all` to return every matching row unpaginated.
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: Filter by order_item status (e.g. 0 = in-progress, 1 = delivered, 2 = cancelled).
 *         example: 0
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [Pending, Paid, Cancelled, Failed]
 *         description: Filter by `orders.payment_status`. Drives the four tabs in the SPA (Pending = Inprogress, Paid = Complete, Cancelled = Cancel, Failed = Failed).
 *         example: "Pending"
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Lower bound (inclusive) on `orders.created_at`. ISO date or datetime.
 *         example: "2026-01-01"
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Upper bound (inclusive) on `orders.created_at`. ISO date or datetime.
 *         example: "2026-05-31"
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter by MONTH(orders.created_at).
 *         example: 5
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by YEAR(orders.created_at).
 *         example: 2026
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive LIKE search across customer name, product name, product code, and `orders.custom_order_id`.
 *         example: "INV-2026"
 *     responses:
 *       200:
 *         description: Order item details fetched successfully
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
 *                   example: "Order item details fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total_records:
 *                           type: integer
 *                           description: Total matching order_items count (before pagination).
 *                           example: 137
 *                         total_pages:
 *                           type: integer
 *                           example: 14
 *                         current_page:
 *                           type: integer
 *                           description: Always 1 when `limit=all`.
 *                           example: 1
 *                         per_page:
 *                           type: integer
 *                           description: Effective page size (the requested limit, or the full result count when `limit=all`).
 *                           example: 10
 *                         has_next_page:
 *                           type: boolean
 *                           description: Always false when `limit=all`.
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
 *                       description: One element per order item. The column list is explicit and minimal — only fields the OrderStatus SPA actually renders are returned.
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: Order ID (orders.id).
 *                             example: 412
 *                           custom_order_id:
 *                             type: string
 *                             example: "POS-2026-000412"
 *                           grand_total:
 *                             type: string
 *                             description: Order grand total (DECIMAL, serialized as string).
 *                             example: "1949.50"
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-05-12T08:34:21.000Z"
 *                           payment_type:
 *                             type: string
 *                             example: "Cash"
 *                           payment_status:
 *                             type: string
 *                             example: "Paid"
 *                           customer_name:
 *                             type: string
 *                             example: "AJIT SINGH OM PARKASH PRIVATE LIMITED"
 *                           order_item_id:
 *                             type: integer
 *                             description: order_items.id
 *                             example: 1023
 *                           quantity:
 *                             type: number
 *                             example: 3
 *                           price:
 *                             type: string
 *                             description: Per-unit price (DECIMAL, serialized as string).
 *                             example: "649.83"
 *                           remarks:
 *                             type: string
 *                             nullable: true
 *                             example: "Deliver before 6 PM"
 *                           item_status:
 *                             type: integer
 *                             description: order_items.status. 0 = in-progress, 1 = delivered, 2 = cancelled.
 *                             example: 0
 *                           product_name:
 *                             type: string
 *                             example: "Plywood Sheet 18mm"
 *                           product_code:
 *                             type: string
 *                             example: "P009876"
 *                           product_image:
 *                             type: string
 *                             nullable: true
 *                             description: Relative path of the product attachment file.
 *                             example: "uploads/products/p009876.jpg"
 *       401:
 *         description: Missing or invalid auth token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
