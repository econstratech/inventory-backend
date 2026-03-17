/**
 * @swagger
 * tags:
 *   name: Report
 *   description: Report endpoints
 */

/**
 * @swagger
 * /api/report/total-purchase-of-this-month:
 *   get:
 *     summary: Get total purchase amount of current month
 *     description: Returns the sum of total_amount for all purchases created in the current month for the authenticated user's company.
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total purchase of this month fetched successfully
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
 *                   example: "Total purchase of this month fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_purchase_amount:
 *                       type: number
 *                       description: Sum of purchase total_amount for the current month
 *                       example: 125000.50
 *                     month:
 *                       type: integer
 *                       description: Current month (1-12)
 *                       example: 2
 *                     year:
 *                       type: integer
 *                       description: Current year
 *                       example: 2026
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
 *                   example: "Error getting total purchase of this month"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/report/vendor-wise-total-purchase-of-this-month:
 *   get:
 *     summary: Get vendor-wise total purchase amount of current month
 *     description: Returns total purchase amount grouped by vendor for the current month for the authenticated user's company. Results are ordered by total_purchase_amount descending.
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor-wise total purchase of this month fetched successfully
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
 *                   example: "Vendor-wise total purchase of this month fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       vendor_id:
 *                         type: integer
 *                         example: 1
 *                       vendor_name:
 *                         type: string
 *                         example: "Acme Supplies"
 *                       total_purchase_amount:
 *                         type: number
 *                         example: 85000.50
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
 *                   example: "Error getting vendor-wise total purchase of this month"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/report/month-wise-revenue-report:
 *   get:
 *     summary: Get month-wise revenue report
 *     description: Returns revenue grouped by year and month for the authenticated user's company. Revenue is calculated product-wise from dispatched sale products (sales_product_received). For each received product row, revenue = (markup_percentage / 100) * taxIncl where markup_percentage comes from the product table and taxIncl is the sold amount. Results are ordered by year and month descending.
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Month-wise revenue report fetched successfully
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
 *                   example: "Month-wise revenue report fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       year:
 *                         type: integer
 *                         example: 2026
 *                       month:
 *                         type: integer
 *                         description: Month 1-12
 *                         example: 2
 *                       revenue:
 *                         type: number
 *                         description: Sum of (markup_percentage/100 * taxIncl) for all received products in that month
 *                         example: 12500.75
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
 *                   example: "Error getting month-wise revenue report"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/report/monthly-sales-report:
 *   get:
 *     summary: Get monthly sales report with pagination
 *     description: Returns sales data grouped by year and month. Rejected sale orders (status = 8) are excluded. Each row includes total_sales_amount (sum of sales_product_received.taxIncl), total_so_count (sale orders in month), completed_so_count (sale orders with status=11 that have at least one sales_product_received row), and completed_total_so_amount (sum of sales_product_received.taxIncl for those completed orders). Supports pagination via page and limit.
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         description: Items per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Monthly sales report fetched successfully
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
 *                   example: "Monthly sales report fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total_records:
 *                           type: integer
 *                           example: 24
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
 *                           year:
 *                             type: integer
 *                             example: 2026
 *                           month:
 *                             type: integer
 *                             description: Month 1-12
 *                             example: 2
 *                           total_sales_amount:
 *                             type: number
 *                             description: Sum of sales_product_received.taxIncl for that month (excluding status=8)
 *                             example: 85000.50
 *                           total_so_count:
 *                             type: integer
 *                             description: Total count of sale orders in that month (excluding status=8)
 *                             example: 42
 *                           completed_so_count:
 *                             type: integer
 *                             description: Count of sale orders with status=11 (completed) that have at least one sales_product_received row in that month
 *                             example: 15
 *                           completed_total_so_amount:
 *                             type: number
 *                             description: Sum of sales_product_received.taxIncl for completed orders (status=11) in that month
 *                             example: 72000.00
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
 *                   example: "Error getting monthly sales report"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/report/total-sales-of-this-month:
 *   get:
 *     summary: Get total sale amount of current month
 *     description: Returns the sum of taxIncl (sale amount) from sales_product_received for the current month. Rejected sale orders (status = 8) are excluded via join with sale table. Only non-deleted received rows for the company are included. Response includes total_sale_amount, month (1-12), and year.
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total sale of this month fetched successfully
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
 *                   example: "Total sale of this month fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_sale_amount:
 *                       type: number
 *                       description: Sum of taxIncl (sale amount) from sales_product_received for the current month
 *                       example: 103639.4
 *                     month:
 *                       type: integer
 *                       description: Current month (1-12)
 *                       example: 2
 *                     year:
 *                       type: integer
 *                       description: Current year
 *                       example: 2026
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
 *                   example: "Error getting total sales of this month"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/report/status-wise-sales-report:
 *   get:
 *     summary: Get status-wise sales report
 *     description: Returns counts of sale orders by status for the authenticated user's company. active_so_count (status=2), pending_approval_count (status=3), pending_dispatch_count (status=9), completed_so_count (status=11).
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status-wise sales report fetched successfully
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
 *                   example: "Status-wise sales report fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     active_so_count:
 *                       type: integer
 *                       description: Count of sale orders with status=2 (active)
 *                       example: 5
 *                     pending_approval_count:
 *                       type: integer
 *                       description: Count of sale orders with status=3 (pending approval)
 *                       example: 3
 *                     pending_dispatch_count:
 *                       type: integer
 *                       description: Count of sale orders with status=9 (pending discount)
 *                       example: 2
 *                     completed_so_count:
 *                       type: integer
 *                       description: Count of sale orders with status=11 (completed)
 *                       example: 120
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
 *                   example: "Error getting status-wise sales report"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/report/customer-wise-total-sales-of-this-month:
 *   get:
 *     summary: Get customer-wise total sales of current month
 *     description: Returns total sales count and total sales amount (sum of sale.total_amount) grouped by customer for the current month for the authenticated user's company. Results are ordered by total_sales_amount descending.
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer-wise total sales of this month fetched successfully
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
 *                   example: "Customer-wise total sales of this month fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       customer_id:
 *                         type: integer
 *                         example: 1
 *                       customer_name:
 *                         type: string
 *                         example: "Acme Corp"
 *                       total_sales_count:
 *                         type: integer
 *                         description: Count of sale orders for this customer in the current month
 *                         example: 8
 *                       total_sales_amount:
 *                         type: number
 *                         description: Sum of sale total_amount for this customer in the current month
 *                         example: 125000.50
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
 *                   example: "Error getting customer-wise total sales of this month"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/report/customer-wise-sales-report:
 *   get:
 *     summary: Get customer-wise sales report with pagination
 *     description: Returns sales count and total sales amount grouped by customer for the authenticated user's company. Optional filters by startDate, endDate, and customerId. Results ordered by total_sales_amount descending.
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         description: Items per page
 *         example: 10
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter sales from this date (inclusive)
 *         example: "2026-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter sales until this date (inclusive)
 *         example: "2026-01-31"
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *         description: Filter by customer ID
 *         example: 5
 *     responses:
 *       200:
 *         description: Customer-wise sales report fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       customer_id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         description: Customer name
 *                         example: "Acme Corp"
 *                       total_sales_count:
 *                         type: integer
 *                         description: Count of sale orders for this customer (within filters)
 *                         example: 12
 *                       total_sales_amount:
 *                         type: number
 *                         description: Sum of sale total_amount for this customer (within filters)
 *                         example: 185000.50
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of customers (groups) matching filters
 *                       example: 45
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 5
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
 *                   example: "Error getting customer-wise sales report"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/report/item-wise-purchase-report:
 *   get:
 *     summary: Get item-wise purchase report with pagination
 *     description: Returns purchase totals grouped by product from recvproduct. Per row total amount without tax = received * unit_price; tax amount = that * 18/100; total received amount = sum of both. Results ordered by last created_at (most recent first). Supports pagination and optional filters by product_id and date range (start_date, end_date; both required for date filter).
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         description: Items per page
 *         example: 10
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (use with end_date)
 *         example: "2026-01-01"
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (use with start_date)
 *         example: "2026-02-28"
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: integer
 *         description: Filter by product ID (optional)
 *         example: 10
 *     responses:
 *       200:
 *         description: Item-wise purchase report fetched successfully
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
 *                   example: "Item-wise purchase report fetched successfully"
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
 *                       items:
 *                         type: object
 *                         properties:
 *                           product_id:
 *                             type: integer
 *                             example: 10
 *                           total_amount_without_tax:
 *                             type: number
 *                             description: Sum of (received * unit_price) for this product
 *                             example: 10000
 *                           total_tax_amount:
 *                             type: number
 *                             description: Sum of (received * unit_price * 18/100)
 *                             example: 1800
 *                           total_received_amount:
 *                             type: number
 *                             description: total_amount_without_tax + total_tax_amount
 *                             example: 11800
 *                           last_created_at:
 *                             type: string
 *                             format: date-time
 *                             description: Latest created_at for this product in recvproduct
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
 *                   example: "Error getting item-wise purchase report"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/report/item-wise-sales-report:
 *   get:
 *     summary: Get item-wise sales report with pagination
 *     description: Returns sales totals grouped by product from sales_product_received. Each row includes total_sales_count (distinct sales_id count), total_received_quantity (sum of received_quantity), total_amount_without_tax = sum of (received_quantity * unit_price), total_tax_amount = that * 18/100, and total_received_amount = sum of (received_quantity * unit_price * 1.18). Only active products (status=1) are included. Results ordered by last_created_at (most recent first). Supports pagination and optional filters by product_id and date range (start_date, end_date; both required for date filter).
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         description: Items per page
 *         example: 10
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (use with end_date)
 *         example: "2026-01-01"
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (use with start_date)
 *         example: "2026-02-28"
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: integer
 *         description: Filter by product ID (optional)
 *         example: 10
 *     responses:
 *       200:
 *         description: Item-wise sales report fetched successfully
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
 *                   example: "Item-wise sales report fetched successfully"
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
 *                       items:
 *                         type: object
 *                         properties:
 *                           product_id:
 *                             type: integer
 *                             example: 2624
 *                           product_name:
 *                             type: string
 *                             example: "Plywood"
 *                           product_code:
 *                             type: string
 *                             example: "P009876"
 *                           total_sales_count:
 *                             type: integer
 *                             description: Count of distinct sale orders (sales_id) for this product
 *                             example: 12
 *                           total_received_quantity:
 *                             type: number
 *                             description: Sum of received_quantity for this product
 *                             example: 45
 *                           total_amount_without_tax:
 *                             type: number
 *                             description: Sum of (received_quantity * unit_price) for this product
 *                             example: 100000
 *                           total_tax_amount:
 *                             type: number
 *                             description: Sum of (received_quantity * unit_price * 18/100)
 *                             example: 18000
 *                           total_received_amount:
 *                             type: number
 *                             description: Sum of (received_quantity * unit_price * 1.18)
 *                             example: 118000
 *                           last_created_at:
 *                             type: string
 *                             format: date-time
 *                             description: Latest created_at for this product in sales_product_received
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
 *                   example: "Error getting item-wise sales report"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/report/monthly-purchase-report:
 *   get:
 *     summary: Get month-wise total purchase report with pagination
 *     description: Returns total purchase amount grouped by year and month for the authenticated user's company. Each row includes total_po_count (all POs in that month), completed_po_count (POs with status=10), and completed_total_po_amount (sum of total_amount for POs with status=10). Results are ordered by year and month descending. Supports pagination via page and limit.
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         description: Items per page
 *         example: 15
 *     responses:
 *       200:
 *         description: Monthly purchase report fetched successfully
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
 *                   example: "Monthly purchase report fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total_records:
 *                           type: integer
 *                           example: 24
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
 *                           year:
 *                             type: integer
 *                             example: 2026
 *                           month:
 *                             type: integer
 *                             description: Month 1-12
 *                             example: 2
 *                           total_purchase_amount:
 *                             type: number
 *                             example: 85000.50
 *                           total_po_count:
 *                             type: integer
 *                             description: Total number of purchase orders in that month
 *                             example: 12
 *                           completed_po_count:
 *                             type: integer
 *                             description: Number of POs with status=10 (completed) in that month
 *                             example: 8
 *                           completed_total_po_amount:
 *                             type: number
 *                             description: Sum of total_amount for POs with status=10 in that month
 *                             example: 52000.00
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
 *                   example: "Error getting monthly purchase report"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/report/status-wise-po-report:
 *   get:
 *     summary: Get status-wise purchase order counts
 *     description: Returns counts of purchase orders by status for the authenticated user's company (all records, no date filter). Active PO (status=2), Pending for approval (status=3), GRN pending (status=5).
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status-wise PO report fetched successfully
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
 *                   example: "Status-wise PO report fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     active_po_count:
 *                       type: integer
 *                       description: Count of active POs (status=2)
 *                       example: 5
 *                     pending_approval_count:
 *                       type: integer
 *                       description: Count of POs pending for approval (status=3)
 *                       example: 2
 *                     grn_pending_count:
 *                       type: integer
 *                       description: Count of POs with GRN pending (status=5)
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
 *                   example: "Error getting status-wise PO report"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/report/pending-po-report:
 *   get:
 *     summary: Get pending PO report with pagination
 *     description: Returns paginated purchase orders for the company. Optionally filter by date range (start_date, end_date), reference_number, or warehouse_id. Each row includes warehouse, vendor, and products with product details.
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (use with end_date)
 *         example: "2026-01-01"
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (use with start_date)
 *         example: "2026-02-28"
 *       - in: query
 *         name: reference_number
 *         schema:
 *           type: string
 *         description: Filter by purchase order reference number (exact match)
 *         example: "PO-2026-001"
 *       - in: query
 *         name: warehouse_id
 *         schema:
 *           type: integer
 *         description: Filter by warehouse ID
 *         example: 1
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *           minimum: 1
 *         description: Items per page
 *         example: 15
 *     responses:
 *       200:
 *         description: Pending PO report fetched successfully
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
 *                   example: "Pending po report fetched successfully"
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
 *                           example: 4
 *                         current_page:
 *                           type: integer
 *                           example: 1
 *                         per_page:
 *                           type: integer
 *                           example: 15
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
 *                           reference_number:
 *                             type: string
 *                             example: "PO-2026-001"
 *                           total_amount:
 *                             type: string
 *                             example: "25000.00"
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           warehouse:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                           vendor:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               vendor_name:
 *                                 type: string
 *                               phone:
 *                                 type: string
 *                           products:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 product_id:
 *                                   type: integer
 *                                 qty:
 *                                   type: integer
 *                                 unit_price:
 *                                   type: string
 *                                 tax:
 *                                   type: integer
 *                                 tax_amount:
 *                                   type: number
 *                                 taxExcl:
 *                                   type: number
 *                                 product:
 *                                   type: object
 *                                   nullable: true
 *                                   properties:
 *                                     id:
 *                                       type: integer
 *                                     product_code:
 *                                       type: string
 *                                     product_name:
 *                                       type: string
 *                                     sku_product:
 *                                       type: string
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
 *                   example: "Error getting pending po report"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/report/export/pending-po-report:
 *   get:
 *     summary: Export pending PO report as CSV
 *     description: Streams a CSV file of pending POs ordered by Purchase.id ASC. All query parameters are optional. Filter by start_date and end_date (both required for date filter), reference_number, or warehouse_id. For POs with multiple products, the first three columns (PO Number, Vendor name, Store) are filled only on the first row per PO; subsequent rows have data from Product Code onwards. File is generated in batches to avoid memory exhaustion. Filename format pending-po-reportDDMMYYYY.csv (e.g. pending-po-report07022026.csv).
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (use with end_date)
 *         example: "2025-11-24"
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (use with start_date)
 *         example: "2026-02-24"
 *       - in: query
 *         name: reference_number
 *         schema:
 *           type: string
 *         description: Filter by purchase order reference number (exact match)
 *       - in: query
 *         name: warehouse_id
 *         schema:
 *           type: integer
 *         description: Filter by warehouse ID
 *     responses:
 *       200:
 *         description: CSV file download (headers PO Number, Vendor name, Store, Product Code, Product Name, PO Quantity, Unit Price, Tax %, Net Amount, Tax Amount, Total Amount)
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Server error (only if headers not yet sent)
 */

/**
 * @swagger
 * /api/report/stock-transfer-report:
 *   get:
 *     summary: Get stock transfer report with pagination
 *     description: Returns paginated stock transfer logs for the company. Optionally filter by start_date and end_date (both required for date range) and transfer_type. Each row includes stockTransferProducts (with product and stockTransferBatches/receiveProductBatch), from_warehouse, to_warehouse, sales, and purchase. Ordered by created_at DESC.
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *           minimum: 1
 *         description: Items per page
 *         example: 15
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (use with end_date)
 *         example: "2026-01-01"
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (use with start_date)
 *         example: "2026-02-28"
 *       - in: query
 *         name: transfer_type
 *         schema:
 *           type: string
 *         description: Filter by transfer type
 *     responses:
 *       200:
 *         description: Stock transfer report fetched successfully
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
 *                   example: "Stock transfer report fetched successfully"
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
 *                           example: 4
 *                         current_page:
 *                           type: integer
 *                           example: 1
 *                         per_page:
 *                           type: integer
 *                           example: 15
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
 *                           reference_number:
 *                             type: string
 *                           transfer_type:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           stockTransferProducts:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 transferred_quantity:
 *                                   type: number
 *                                 product:
 *                                   type: object
 *                                   properties:
 *                                     id:
 *                                       type: integer
 *                                     product_name:
 *                                       type: string
 *                                     product_code:
 *                                       type: string
 *                                 stockTransferBatches:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       id:
 *                                         type: integer
 *                                       receive_product_batch_id:
 *                                         type: integer
 *                                       receiveProductBatch:
 *                                         type: object
 *                                         properties:
 *                                           id:
 *                                             type: integer
 *                                           batch_no:
 *                                             type: string
 *                                           quantity:
 *                                             type: number
 *                           from_warehouse:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                           to_warehouse:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                           sales:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               reference_number:
 *                                 type: string
 *                           purchase:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               reference_number:
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
 *                   example: "Error getting stock transfer report"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/report/batch-expiration-report:
 *   get:
 *     summary: Get batch expiration report with pagination
 *     description: Returns paginated receive product batches for the company, ordered by expiry_date ascending. Optionally filter by expiry_date to show only batches expiring on or before that date. Each row includes batch details and product variant with UOM and product info.
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         description: Items per page
 *         example: 10
 *       - in: query
 *         name: expiry_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter batches expiring on or before this date (inclusive)
 *         example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Batch expiration report fetched successfully
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
 *                   example: "Batch expiration report fetched successfully"
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
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: Batch ID
 *                             example: 1
 *                           batch_no:
 *                             type: string
 *                             example: "BATCH-001"
 *                           manufacture_date:
 *                             type: string
 *                             format: date
 *                             nullable: true
 *                           expiry_date:
 *                             type: string
 *                             format: date
 *                             nullable: true
 *                           available_quantity:
 *                             type: number
 *                             description: Available quantity for this batch
 *                             example: 100
 *                           productVariant:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               weight_per_unit:
 *                                 type: number
 *                               masterUOM:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                   name:
 *                                     type: string
 *                                   label:
 *                                     type: string
 *                               product:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                   product_name:
 *                                     type: string
 *                                   product_code:
 *                                     type: string
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
 *                   example: "Error getting batch expiration report"
 *                 error:
 *                   type: string
 */
