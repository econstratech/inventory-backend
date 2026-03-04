const { Op, QueryTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const { Purchase, StockTransferLog } = require("../model");
const CommonHelper = require("../helpers/commonHelper");

const BATCH_SIZE = 200;

/** Escape a value for CSV (quote if contains comma, newline, or double quote) */
function csvEscape(val) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (/[,"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Get total purchase amount for the current month (company-scoped).
 * GET /api/report/total-purchase-of-this-month
 */
exports.getTotalPurchaseOfThisMonth = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const total = await Purchase.sum("total_amount", {
      where: {
        company_id,
        status: { [Op.ne]: 8 }, //Exclude cancelled purchase orders
        created_at: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
    });

    const totalPurchaseAmount = total != null ? Number(total) : 0;

    return res.status(200).json({
      status: true,
      message: "Total purchase of this month fetched successfully",
      data: {
        total_purchase_amount: totalPurchaseAmount,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    });
  } catch (error) {
    console.error("Get total purchase of this month error:", error);
    return res.status(500).json({
      status: false,
      message: "Error getting total purchase of this month",
      error: error.message,
    });
  }
};

/**
 * Get vendor-wise total purchase amount for the current month (company-scoped), ordered by amount descending.
 * GET /api/report/vendor-wise-total-purchase-of-this-month
 */
exports.getVendorWiseTotalPurchaseOfThisMonth = async (req, res) => {
  try {
    const company_id = req.user.company_id;

    const query = `
      SELECT
        p.vendor_id,
        v.vendor_name,
        SUM(p.total_amount) AS total_purchase_amount
      FROM purchase p
      INNER JOIN vendor v ON v.id = p.vendor_id
      WHERE p.company_id = :companyId
        AND p.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
        AND p.created_at <= LAST_DAY(NOW())
        AND v.status = 1
      GROUP BY p.vendor_id, v.id, v.vendor_name
      ORDER BY total_purchase_amount DESC
    `;
    const rows = await sequelize.query(query, {
      replacements: { companyId: company_id },
      type: QueryTypes.SELECT,
      raw: true,
    });

    const data = rows.map((r) => ({
      vendor_id: Number(r.vendor_id),
      vendor_name: r.vendor_name || "",
      total_purchase_amount: r.total_purchase_amount != null ? Number(r.total_purchase_amount) : 0,
    }));

    return res.status(200).json({
      status: true,
      message: "Vendor-wise total purchase of this month fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Get vendor-wise total purchase of this month error:", error);
    return res.status(500).json({
      status: false,
      message: "Error getting vendor-wise total purchase of this month",
      error: error.message,
    });
  }
};

/**
 * Get status-wise purchase order counts (company-scoped, all records).
 * GET /api/report/status-wise-po-report
 * Returns: active_po_count (status=2), pending_approval_count (status=3), grn_pending_count (status=5).
 */
exports.getStatusWisePOReport = async (req, res) => {
  try {
    const company_id = req.user.company_id;

    const query = `
      SELECT
        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) AS active_po_count,
        SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) AS pending_approval_count,
        SUM(CASE WHEN status = 5 THEN 1 ELSE 0 END) AS grn_pending_count,
        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) AS approved_po_count
      FROM purchase
      WHERE company_id = :companyId
    `;
    const rows = await sequelize.query(query, {
      replacements: { companyId: company_id },
      type: QueryTypes.SELECT,
      raw: true,
    });
    const row = rows[0] || {};

    const data = {
      active_po_count: Number(row.active_po_count) || 0,
      pending_approval_count: Number(row.pending_approval_count) || 0,
      grn_pending_count: Number(row.grn_pending_count) || 0,
      approved_po_count: Number(row.approved_po_count) || 0,
    };

    return res.status(200).json({
      status: true,
      message: "Status-wise PO report fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Get status-wise PO report error:", error);
    return res.status(500).json({
      status: false,
      message: "Error getting status-wise PO report",
      error: error.message,
    });
  }
};

/**
 * Get month-wise revenue report (company-scoped).
 * Revenue = sum over sales_product_received of (markup_percentage/100 * taxIncl) per product, grouped by month.
 * GET /api/report/month-wise-revenue-report
 */
exports.getMonthWiseRevenueReport = async (req, res) => {
  try {
    const company_id = req.user.company_id;

    const query = `
      SELECT
        YEAR(spr.created_at) AS year,
        MONTH(spr.created_at) AS month,
        SUM((COALESCE(p.markup_percentage, 0) / 100) * spr.taxIncl) AS revenue
      FROM sales_product_received spr
      INNER JOIN product p ON p.id = spr.product_id
      WHERE spr.company_id = :companyId
        AND spr.deleted_at IS NULL
      GROUP BY YEAR(spr.created_at), MONTH(spr.created_at)
      ORDER BY year DESC, month DESC
    `;
    const rows = await sequelize.query(query, {
      replacements: { companyId: company_id },
      type: QueryTypes.SELECT,
      raw: true,
    });

    const data = rows.map((r) => ({
      year: Number(r.year),
      month: Number(r.month),
      revenue: r.revenue != null ? Number(r.revenue) : 0,
    }));

    return res.status(200).json({
      status: true,
      message: "Month-wise revenue report fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Get month-wise revenue report error:", error);
    return res.status(500).json({
      status: false,
      message: "Error getting month-wise revenue report",
      error: error.message,
    });
  }
};

/**
 * Get item-wise purchase report (company-scoped). Main table recvproduct.
 * total amount without tax = received * unit_price; tax amount = that * 18/100; total received amount = sum of both. Group by product_id, order by created_at.
 * GET /api/report/item-wise-purchase-report?page=1&limit=10&start_date=...&end_date=...&product_id=...
 */
exports.getItemWisePurchaseReport = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const productIdParam = req.query.product_id;
    const product_id = productIdParam != null && productIdParam !== "" ? parseInt(productIdParam, 10) : null;
    const filterByProduct = Number.isInteger(product_id) && product_id > 0;
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;
    const filterByDateRange = start_date && end_date;

    const whereParts = ["rp.company_id = :companyId"];
    if (filterByProduct) whereParts.push("product_id = :productId");
    if (filterByDateRange) whereParts.push("rp.created_at >= :startDate", "rp.created_at <= :endDate");
    const whereClause = "WHERE " + whereParts.join(" AND ");

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM (
        SELECT 1
        FROM recvproduct rp
        ${whereClause}
        GROUP BY product_id
      ) AS grouped
    `;
    const replacements = { companyId: company_id };
    if (filterByProduct) replacements.productId = product_id;
    if (filterByDateRange) {
      replacements.startDate = new Date(start_date);
      replacements.endDate = new Date(end_date);
      replacements.endDate.setHours(23, 59, 59, 999);
    }
    const countResult = await sequelize.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
      raw: true,
    });
    const totalRecords = countResult[0]?.total ?? 0;

    const dataReplacements = { ...replacements, limit, offset };
    const dataQuery = `
      SELECT
        product_id,
        p.product_name,
        p.product_code,
        SUM(COALESCE(received, 0) * COALESCE(unit_price, 0)) AS total_amount_without_tax,
        SUM((COALESCE(received, 0) * COALESCE(unit_price, 0)) * 18 / 100) AS total_tax_amount,
        SUM((COALESCE(received, 0) * COALESCE(unit_price, 0)) * (1 + 18 / 100)) AS total_received_amount,
        MAX(rp.created_at) AS last_created_at
      FROM recvproduct rp INNER JOIN product p ON p.id = rp.product_id
      ${whereClause} AND p.status = 1
      GROUP BY rp.product_id
      ORDER BY last_created_at DESC
      LIMIT :limit OFFSET :offset
    `;
    const rows = await sequelize.query(dataQuery, {
      replacements: dataReplacements,
      type: QueryTypes.SELECT,
      raw: true,
    });

    const normalizedRows = rows.map((r) => ({
      product_id: Number(r.product_id),
      product_name: r.product_name || "",
      product_code: r.product_code || "",
      total_amount_without_tax: r.total_amount_without_tax != null ? Number(r.total_amount_without_tax) : 0,
      total_tax_amount: r.total_tax_amount != null ? Number(r.total_tax_amount) : 0,
      total_received_amount: r.total_received_amount != null ? Number(r.total_received_amount) : 0,
      last_created_at: r.last_created_at,
    }));

    const paginatedData = CommonHelper.paginate(
      { count: totalRecords, rows: normalizedRows },
      page,
      limit
    );

    return res.status(200).json({
      status: true,
      message: "Item-wise purchase report fetched successfully",
      data: paginatedData,
    });
  } catch (error) {
    console.error("Get item-wise purchase report error:", error);
    return res.status(500).json({
      status: false,
      message: "Error getting item-wise purchase report",
      error: error.message,
    });
  }
};

/**
 * Get month-wise total purchase report with pagination (company-scoped).
 * GET /api/report/monthly-purchase-report?page=1&limit=10
 */
exports.getMonthlyPurchaseReport = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM (
        SELECT 1
        FROM purchase
        WHERE company_id = :companyId AND status != 8
        GROUP BY YEAR(created_at), MONTH(created_at)
      ) AS grouped
    `;
    const countResult = await sequelize.query(countQuery, {
      replacements: { companyId: company_id },
      type: QueryTypes.SELECT,
      raw: true,
    });
    const totalRecords = countResult[0]?.total ?? 0;

    const dataQuery = `
      SELECT
        YEAR(created_at) AS year,
        MONTH(created_at) AS month,
        SUM(total_amount) AS total_purchase_amount,
        COUNT(*) AS total_po_count,
        SUM(CASE WHEN status = 10 THEN 1 ELSE 0 END) AS completed_po_count,
        SUM(CASE WHEN status = 10 THEN total_amount ELSE 0 END) AS completed_total_po_amount
      FROM purchase
      WHERE company_id = :companyId AND status != 8
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY year DESC, month DESC
      LIMIT :limit OFFSET :offset
    `;
    const rows = await sequelize.query(dataQuery, {
      replacements: {
        companyId: company_id,
        limit,
        offset,
      },
      type: QueryTypes.SELECT,
      raw: true,
    });

    const normalizedRows = rows.map((r) => ({
      year: Number(r.year),
      month: Number(r.month),
      total_purchase_amount: r.total_purchase_amount != null ? Number(r.total_purchase_amount) : 0,
      total_po_count: Number(r.total_po_count) || 0,
      completed_po_count: Number(r.completed_po_count) || 0,
      completed_total_po_amount: r.completed_total_po_amount != null ? Number(r.completed_total_po_amount) : 0,
    }));

    const paginatedData = CommonHelper.paginate(
      { count: totalRecords, rows: normalizedRows },
      page,
      limit
    );

    return res.status(200).json({
      status: true,
      message: "Monthly purchase report fetched successfully",
      data: paginatedData,
    });
  } catch (error) {
    console.error("Get monthly purchase report error:", error);
    return res.status(500).json({
      status: false,
      message: "Error getting monthly purchase report",
      error: error.message,
    });
  }
};

/**
 * Get pending po report (company-scoped).
 * GET /api/report/pending-po-report
 */
exports.getPendingPOReport = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { 
      start_date, 
      end_date,
      reference_number,
      warehouse_id,
      page = 1, 
      limit = 15, 
    } = req.query;

    // Set offset to calculate the number of records to skip
    const offset = (page - 1) * limit;

    // Initialize where condition
    const whereCondition = {
      company_id,
    };

    // Add date range filter
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      whereCondition.created_at = { [Op.between]: [startDate, endDate] };
    }

    // Add reference number filter
    if (reference_number) {
      whereCondition.reference_number = { [Op.eq]: reference_number };
    }

    // Add warehouse id filter
    if (warehouse_id) {
      whereCondition.warehouse_id = { [Op.eq]: warehouse_id };
    }

    // Get pending po report
    const pendingPo = await Purchase.findAndCountAll({
      attributes: ['id', 'reference_number', 'total_amount', 'created_at'],
      where: whereCondition,
      distinct: true,
      limit: parseInt(limit, 10),
      offset,
      order: [["created_at", "DESC"]],
      include: [
        {
          association: 'warehouse',
          attributes: ['id', 'name'],
        },
        {
          association: 'vendor',
          attributes: ['id', 'vendor_name', 'phone'],
        },
        {
          association: 'products',
          attributes: ['id', 'product_id', 'qty', 'unit_price', 'tax', 'tax_amount', 'taxExcl'],
          include: [
            {
              association: 'ProductsItem',
              attributes: ['id', 'product_code', 'product_name', 'sku_product'],
            }
          ]
        }
      ]
    });

    // Get paginated data
    const paginatedPendingPoData = CommonHelper.paginate(pendingPo, page, limit);

    // return response
    return res.status(200).json({
      status: true,
      message: "Pending po report fetched successfully",
      data: paginatedPendingPoData,
    });
  } catch (error) {
    console.error("Get pending po report error:", error);
    return res.status(500).json({
      status: false,
      message: "Error getting pending po report",
      error: error.message,
    });
  }
};

/** Format a value to 2 decimal places; returns "0.00" for NaN/invalid so CSV never shows "NaN" */
exports.formatDecimal = (val) => {
  if (val == null || val === "") return "";
  const n = Number(val);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
};


/**
 * Export pending PO report as CSV (batch-wise to avoid memory exhaustion).
 * GET /api/report/export/pending-po-report?start_date=...&end_date=...&reference_number=...&warehouse_id=...
 * Optional params: start_date, end_date, reference_number, warehouse_id.
 * Order: Purchase.id ASC. First 3 columns (PO Number, Vendor name, Store) only on first row per PO.
 * Filename: pending-po-reportDDMMYYYY.csv
 */
exports.exportPendingPOReport = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { start_date, end_date, reference_number, warehouse_id } = req.query;

    const whereCondition = { company_id };
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      whereCondition.created_at = { [Op.between]: [startDate, endDate] };
    }
    if (reference_number) {
      whereCondition.reference_number = { [Op.eq]: reference_number };
    }
    if (warehouse_id) {
      whereCondition.warehouse_id = { [Op.eq]: warehouse_id };
    }

    const d = new Date();
    const dateStr = `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${d.getFullYear()}`;
    const filename = `pending-po-report${dateStr}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const header = [
      "PO Number",
      "Vendor name",
      "Store",
      "Product Code",
      "Product Name",
      "PO Quantity",
      "Unit Price",
      "Tax %",
      "Net Amount",
      "Tax Amount",
      "Total Amount",
    ].join(",");
    res.write(header + "\n");

    let offset = 0;
    while (true) {
      const batch = await Purchase.findAll({
        attributes: ["id", "reference_number", "total_amount"],
        where: whereCondition,
        order: [["id", "ASC"]],
        limit: BATCH_SIZE,
        offset,
        include: [
          { association: "warehouse", attributes: ["id", "name"] },
          { association: "vendor", attributes: ["id", "vendor_name"] },
          {
            association: "products",
            attributes: ["id", "product_id", "qty", "unit_price", "tax", "tax_amount", "taxExcl", "total_amount", "taxIncl"],
            include: [
              {
                association: "ProductsItem",
                attributes: ["id", "product_code", "product_name", "sku_product"],
              },
            ],
          },
        ],
      });

      if (batch.length === 0) break;

      for (const po of batch) {
        const poNumber = csvEscape(po.reference_number);
        const vendorName = csvEscape(po.vendor?.vendor_name);
        const storeName = csvEscape(po.warehouse?.name);
        const products = po.products || [];


        products.forEach((pp, idx) => {
          const qtyNum = Number(pp.qty) || 0;
          const unitPriceNum = Number(pp.unit_price) || 0;
          const taxPctNum = Number(pp.tax) || 0;
          const productTotal = (pp.taxExcl != null && pp.taxExcl !== "")
            ? Number(pp.taxExcl)
            : qtyNum * unitPriceNum;
          const productTotalSafe = Number.isFinite(productTotal) ? productTotal : 0;
          const taxValue = (taxPctNum / 100) * productTotalSafe;
          const taxValueSafe = Number.isFinite(taxValue) ? taxValue : 0;
          const storedTotal = (pp.total_amount != null && pp.total_amount !== "") ? Number(pp.total_amount) : NaN;
          const totalWithTax = Number.isFinite(storedTotal)
            ? storedTotal
            : productTotalSafe + taxValueSafe;

          const product = pp.ProductsItem;
          const productCode = csvEscape(product?.product_code);
          const productName = csvEscape(product?.product_name);
          const qty = csvEscape(pp.qty);
          const unitPrice = csvEscape(exports.formatDecimal(pp.unit_price));
          const taxPct = csvEscape(pp.tax);
          const netAmount = csvEscape(exports.formatDecimal(productTotalSafe));
          const taxAmount = csvEscape(exports.formatDecimal(taxValueSafe));
          const totalAmount = csvEscape(exports.formatDecimal(totalWithTax));

          const rowData = [poNumber, vendorName, storeName, productCode, productName, qty, unitPrice, taxPct, netAmount, taxAmount, totalAmount];

          res.write(rowData.join(",") + "\n");
        });
      }

      offset += batch.length;
      if (batch.length < BATCH_SIZE) break;
    }

    res.end();
  } catch (error) {
    console.error("Export pending PO report error:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        status: false,
        message: "Error exporting pending PO report",
        error: error.message,
      });
    }
    res.end();
  }
};

exports.getStockTransferReport = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const {
      page = 1, 
      limit = 15,
      start_date, 
      end_date, 
      transfer_type 
    } = req.query;

    // Set offset to calculate the number of records to skip
    const offset = (page - 1) * limit;

    // Initialize where condition
    const whereCondition = { company_id };

    // Add date range filter
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      whereCondition.created_at = { [Op.between]: [startDate, endDate] };
    }

    // Add transfer type filter
    if (transfer_type) {
      whereCondition.transfer_type = { [Op.eq]: transfer_type };
    }

    // Get stock transfer report
    const stockTransferReport = await StockTransferLog.findAndCountAll({
      attributes: ['id', 'reference_number', 'transfer_type', 'created_at'],
      distinct: true,
      where: whereCondition,
      limit: parseInt(limit, 10),
      offset,
      order: [["created_at", "DESC"]],
      include: [
        { 
          association: 'stockTransferProducts',
          attributes: ['id', 'transferred_quantity'],
          include: [
            {
              association: 'product',
              attributes: ['id', 'product_name', 'product_code'],
            },
            {
              association: 'stockTransferBatches',
              attributes: ['id', 'receive_product_batch_id', 'quantity'],
              include: [
                {
                  association: 'receiveProductBatch',
                  attributes: ['id', 'batch_no', 'available_quantity', 'manufacture_date', 'expiry_date'],
                }
              ]
            }
          ]
        },
        { association: "fromWarehouse", attributes: ["id", "name"] },
        { association: "toWarehouse", attributes: ["id", "name"] },
        { association: "sales", attributes: ["id", "reference_number"] },
        { association: "purchase", attributes: ["id", "reference_number"] },
      ],
    });

    // Get paginated data
    const paginatedStockTransferReport = CommonHelper.paginate(stockTransferReport, page, limit);

    // return response
    return res.status(200).json({
      status: true,
      message: "Stock transfer report fetched successfully",
      data: paginatedStockTransferReport,
    });
  } catch (error) {
    console.error("Get stock transfer report error:", error);
    return res.status(500).json({
      status: false,
      message: "Error getting stock transfer report",
      error: error.message,
    });
  }
};

/**
 * Get month-wise sales report with pagination (company-scoped). Sale amount from sales_product_received.taxIncl, excluding sale orders with status = 8 (rejected). Includes total_completed_orders (status=10) and total_completed_order_amount.
 * GET /api/report/sales/monthly-report?page=1&limit=10
 */
exports.getMonthlySalesReport = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM (
        SELECT 1
        FROM sale
        WHERE company_id = :companyId AND status != 8
        GROUP BY YEAR(created_at), MONTH(created_at)
      ) AS grouped
    `;
    const countResult = await sequelize.query(countQuery, {
      replacements: { companyId: company_id },
      type: QueryTypes.SELECT,
      raw: true,
    });
    const totalRecords = countResult[0]?.total ?? 0;

    const dataQuery = `
      SELECT
        YEAR(spr.created_at) AS year,
        MONTH(spr.created_at) AS month,
        SUM(COALESCE(spr.total_amount, 0)) AS total_sales_amount,
        SUM(COALESCE(sprp.taxIncl, 0)) AS completed_total_so_amount,
        COUNT(*) AS total_so_count,
        COUNT(DISTINCT CASE WHEN spr.status = 11 AND sprp.sales_id IS NOT NULL AND sprp.deleted_at IS NULL THEN spr.id END) AS completed_so_count
         -- SUM(CASE WHEN spr.status = 11 AND sprp.sales_id IS NOT NULL AND sprp.deleted_at IS NULL THEN COALESCE(sprp.taxIncl, 0) ELSE 0 END) AS completed_total_so_amount
      FROM sale spr LEFT JOIN sales_product_received sprp ON spr.id = sprp.sales_id
      WHERE spr.company_id = :companyId AND spr.status != 8
      GROUP BY YEAR(spr.created_at), MONTH(spr.created_at)
      ORDER BY year DESC, month DESC
      LIMIT :limit OFFSET :offset
    `;
    const rows = await sequelize.query(dataQuery, {
      replacements: {
        companyId: company_id,
        limit,
        offset,
      },
      type: QueryTypes.SELECT,
      raw: true,
    });

    const normalizedRows = rows.map((r) => ({
      year: Number(r.year),
      month: Number(r.month),
      total_sales_amount: r.total_sales_amount != null ? Number(r.total_sales_amount) : 0,
      total_so_count: Number(r.total_so_count) || 0,
      completed_so_count: Number(r.completed_so_count) || 0,
      completed_total_so_amount: r.completed_total_so_amount != null ? Number(r.completed_total_so_amount) : 0,
    }));

    const paginatedData = CommonHelper.paginate(
      { count: totalRecords, rows: normalizedRows },
      page,
      limit
    );

    return res.status(200).json({
      status: true,
      message: "Monthly sales report fetched successfully",
      data: paginatedData,
    });
  } catch (error) {
    console.error("Get monthly purchase report error:", error);
    return res.status(500).json({
      status: false,
      message: "Error getting monthly purchase report",
      error: error.message,
    });
  }
};

/**
 * Get total sales amount for the current month (company-scoped).
 * GET /api/report/sales/total-sales-of-this-month
 */
exports.getTotalSalesOfThisMonth = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const query = `
      SELECT SUM(COALESCE(total_amount, 0)) AS total_sale_amount
      FROM sale WHERE company_id = :companyId AND status != 8
        AND created_at >= :startOfMonth
        AND created_at <= :endOfMonth
    `;
    const result = await sequelize.query(query, {
      replacements: { companyId: company_id, startOfMonth, endOfMonth },
      type: QueryTypes.SELECT,
      raw: true,
    });
    const total_sale_amount = result[0]?.total_sale_amount != null ? Number(result[0].total_sale_amount) : 0;

    return res.status(200).json({
      status: true,
      message: "Total sale of this month fetched successfully",
      data: {
        total_sale_amount,
        month,
        year,
      },
    });
  } catch (error) {
    console.error("Get total sales of this month error:", error);
    return res.status(500).json({
      status: false,
      message: "Error getting total sales of this month",
      error: error.message,
    });
  }
};

/**
 * Get status-wise sales order counts (company-scoped, all records).
 * GET /api/report/status-wise-sales-report
 * Returns: active_so_count (status=2), pending_approval_count (status=3), pending_dispatch_count (status=9), completed_so_count (status=11).
 */
exports.getStatusWiseSalesReport = async (req, res) => {
  try {
    const company_id = req.user.company_id;

    const query = `
      SELECT
        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) AS active_so_count,
        SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) AS pending_approval_count,
        SUM(CASE WHEN status = 9 THEN 1 ELSE 0 END) AS pending_dispatch_count,
        SUM(CASE WHEN status = 11 THEN 1 ELSE 0 END) AS completed_so_count
      FROM sale
      WHERE company_id = :companyId
    `;
    const rows = await sequelize.query(query, {
      replacements: { companyId: company_id },
      type: QueryTypes.SELECT,
      raw: true,
    });
    const row = rows[0] || {};

    const data = {
      active_so_count: Number(row.active_so_count) || 0,
      pending_approval_count: Number(row.pending_approval_count) || 0,
      pending_dispatch_count: Number(row.pending_dispatch_count) || 0,
      completed_so_count: Number(row.completed_so_count) || 0,
    };

    return res.status(200).json({
      status: true,
      message: "Status-wise sales report fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Get status-wise PO report error:", error);
    return res.status(500).json({
      status: false,
      message: "Error getting status-wise PO report",
      error: error.message,
    });
  }
};

/**
 * Get customer-wise total sales amount of the current month (company-scoped), ordered by amount descending.
 * GET /api/report/customer-wise-total-sales-of-this-month
 */
exports.getCustomerWiseTotalSalesOfThisMonth = async (req, res) => {
  try {
    const company_id = req.user.company_id;

    const query = `
      SELECT
        s.customer_id,
        c.name,
        COUNT(*) AS total_sales_count,
        SUM(s.total_amount) AS total_sales_amount
      FROM sale s 
      INNER JOIN customer c ON c.id = s.customer_id
      WHERE s.company_id = :companyId
        AND s.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
        AND s.created_at <= LAST_DAY(NOW())
      GROUP BY s.customer_id, c.id, c.name
      ORDER BY total_sales_amount DESC
    `;
    const rows = await sequelize.query(query, {
      replacements: { companyId: company_id },
      type: QueryTypes.SELECT,
      raw: true,
    });

    const data = rows.map((r) => ({
      customer_id: Number(r.customer_id),
      customer_name: r.name || "",
      total_sales_count: Number(r.total_sales_count) || 0,
      total_sales_amount: r.total_sales_amount != null ? Number(r.total_sales_amount) : 0,
    }));

    return res.status(200).json({
      status: true,
      message: "Customer-wise total sales of this month fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Get customer-wise total sales of this month error:", error);
    return res.status(500).json({
      status: false,
      message: "Error getting customer-wise total sales of this month",
      error: error.message,
    });
  }
};

/**
 * Get customer-wise sales report (company-scoped), ordered by amount descending.
 * GET /api/report/customer-wise-sales-report
 */
exports.getCustomerWiseSalesReport = async (req, res) => {
  try {
    const company_id = req.user.company_id;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { startDate, endDate, customerId } = req.query;

    const replacements = {
      companyId: company_id,
      limit,
      offset,
    };

    // Dynamic WHERE conditions
    let whereConditions = ` WHERE s.company_id = :companyId AND s.status in (9, 10, 11)`;

    if (startDate) {
      whereConditions += ` AND s.created_at >= :startDate `;
      replacements.startDate = startDate;
    }

    if (endDate) {
      whereConditions += ` AND s.created_at <= :endDate `;
      replacements.endDate = endDate;
    }

    if (customerId) {
      whereConditions += ` AND s.customer_id = :customerId `;
      replacements.customerId = customerId;
    }

    // 🔹 Main Data Query
    const dataQuery = `
      SELECT
        s.customer_id,
        c.name,
        COUNT(DISTINCT s.id) AS total_sales_count,
        SUM(COALESCE(s.total_amount,0)) AS total_sales_amount,
        MAX(s.created_at) AS last_order_date
      FROM sale s
      INNER JOIN customer c ON c.id = s.customer_id 
      INNER JOIN sales_product_received sprp ON sprp.sales_id = s.id
      ${whereConditions} 
      GROUP BY s.customer_id, c.name
      ORDER BY last_order_date DESC
      LIMIT :limit OFFSET :offset
    `;

    // 🔹 Count Query (for pagination)
    const countQuery = `
      SELECT COUNT(DISTINCT s.customer_id) AS total
      FROM sale s
      INNER JOIN customer c ON c.id = s.customer_id
      INNER JOIN sales_product_received sprp ON sprp.sales_id = s.id
      ${whereConditions}
    `;

    const rows = await sequelize.query(dataQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });

    const totalResult = await sequelize.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });

    const totalRecords = totalResult[0].total;

    return res.json({
      status: true,
      message: "Customer-wise sales report fetched successfully",
      pagination: {
        total: totalRecords,
        page,
        limit,
        totalPages: Math.ceil(totalRecords / limit),
      },
      data: rows,
    });

  } catch (error) {
    console.error("Get customer-wise sales report error:", error);
    return res.status(500).json({
      status: false,
      message: "Error getting customer-wise sales report",
      error: error.message,
    });
  }
};

/**
 * Get item-wise sales report (company-scoped). Main table sales_product_received.
 * total amount without tax = received * unit_price; tax amount = that * 18/100; total received amount = sum of both. Group by product_id, order by created_at.
 * GET /api/report/item-wise-sales-report?page=1&limit=10&start_date=...&end_date=...&product_id=...
 */
exports.getItemWiseSalesReport = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const productIdParam = req.query.product_id;
    const product_id = productIdParam != null && productIdParam !== "" ? parseInt(productIdParam, 10) : null;
    const filterByProduct = Number.isInteger(product_id) && product_id > 0;
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;
    const filterByDateRange = start_date && end_date;

    const whereParts = ["sprp.company_id = :companyId"];
    if (filterByProduct) whereParts.push("product_id = :productId");
    if (filterByDateRange) whereParts.push("sprp.created_at >= :startDate", "sprp.created_at <= :endDate");
    const whereClause = "WHERE " + whereParts.join(" AND ");

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM (
        SELECT sprp.product_id
        FROM sales_product_received sprp
        INNER JOIN product p ON p.id = sprp.product_id
        ${whereClause} AND p.status = 1
        GROUP BY sprp.product_id
      ) AS grouped
    `;
    const replacements = { companyId: company_id };
    if (filterByProduct) replacements.productId = product_id;
    if (filterByDateRange) {
      replacements.startDate = new Date(start_date);
      replacements.endDate = new Date(end_date);
      replacements.endDate.setHours(23, 59, 59, 999);
    }
    const countResult = await sequelize.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
      raw: true,
    });
    const totalRecords = countResult[0]?.total ?? 0;

    const dataReplacements = { ...replacements, limit, offset };
    const dataQuery = `
      SELECT
        product_id,
        p.product_name,
        p.product_code,
        COUNT(DISTINCT sprp.sales_id) AS total_sales_count,
        SUM(COALESCE(received_quantity, 0)) AS total_received_quantity,
        SUM(COALESCE(received_quantity, 0) * COALESCE(unit_price, 0)) AS total_amount_without_tax,
        SUM((COALESCE(received_quantity, 0) * COALESCE(unit_price, 0)) * 18 / 100) AS total_tax_amount,
        SUM((COALESCE(received_quantity, 0) * COALESCE(unit_price, 0)) * (1 + 18 / 100)) AS total_received_amount,
        MAX(sprp.created_at) AS last_created_at
      FROM sales_product_received sprp INNER JOIN product p ON p.id = sprp.product_id
      ${whereClause} AND p.status = 1
      GROUP BY sprp.product_id
      ORDER BY last_created_at DESC
      LIMIT :limit OFFSET :offset
    `;
    const rows = await sequelize.query(dataQuery, {
      replacements: dataReplacements,
      type: QueryTypes.SELECT,
      raw: true,
    });

    const normalizedRows = rows.map((r) => ({
      product_id: Number(r.product_id),
      product_name: r.product_name || "",
      product_code: r.product_code || "",
      total_sales_count: Number(r.total_sales_count) || 0,
      total_received_quantity: Number(r.total_received_quantity) || 0,
      total_amount_without_tax: r.total_amount_without_tax != null ? Number(r.total_amount_without_tax) : 0,
      total_tax_amount: r.total_tax_amount != null ? Number(r.total_tax_amount) : 0,
      total_received_amount: r.total_received_amount != null ? Number(r.total_received_amount) : 0,
      last_created_at: r.last_created_at,
    }));

    const paginatedData = CommonHelper.paginate(
      { count: totalRecords, rows: normalizedRows },
      page,
      limit
    );

    return res.status(200).json({
      status: true,
      message: "Item-wise sales report fetched successfully",
      data: paginatedData,
    });
  } catch (error) {
    console.error("Get item-wise sales report error:", error);
    return res.status(500).json({
      status: false,
      message: "Error getting item-wise sales report",
      error: error.message,
    });
  }
};
