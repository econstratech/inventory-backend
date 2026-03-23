const { Sequelize, fn, literal, col, Op, QueryTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const { ProductStockEntry, TrackProductStock } = require("../model");

/**
 * Stock valuation (top 10 by total stock value).
 * Query: type=age|category|store (default age)
 * - age: group by product (SKU/code, name)
 * - category: group by product category
 * - store: group by warehouse
 */
exports.GetStockValuation = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const companyIdStr = String(company_id);
    const { type = "age" } = req.query;

    if (!["age", "category", "store"].includes(type)) {
      return res.status(400).json({
        status: false,
        message: "Invalid type. Allowed values: age, category, store.",
      });
    }

    const replacements = { companyId: company_id, companyIdStr };
    const priceExpr = `COALESCE(p.regular_buying_price, p.wholesale_buying_price, p.product_price, 0)`;

    let sql;
    if (type === "age") {
      sql = `
        SELECT
          p.id AS product_id,
          COALESCE(NULLIF(TRIM(p.sku_product), ''), p.product_code, CONCAT('ID-', p.id)) AS item_id,
          p.product_name AS item_name,
          SUM(tps.quantity_changed) AS total_stock,
          SUM(tps.quantity_changed * tps.default_price) AS total_stock_value
        FROM track_product_stock tps
        INNER JOIN product p ON tps.product_id = p.id AND p.company_id = :companyIdStr
        WHERE tps.company_id = :companyId AND tps.status = 1 AND tps.status_in_out = 1
        GROUP BY tps.product_id
        ORDER BY total_stock_value DESC
        LIMIT 10
      `;
    } else if (type === "category") {
      sql = `
        SELECT
          p.product_category_id AS item_id,
          MAX(pc.title) AS item_name,
          SUM(tps.quantity_changed) AS total_stock,
          SUM(tps.quantity_changed * tps.default_price) AS total_stock_value
        FROM track_product_stock tps
        INNER JOIN product p ON tps.product_id = p.id AND p.company_id = :companyIdStr
        LEFT JOIN product_categories pc ON p.product_category_id = pc.id
        WHERE tps.company_id = :companyId AND tps.status = 1 AND tps.status_in_out = 1
        GROUP BY p.product_category_id
        ORDER BY total_stock_value DESC
        LIMIT 10
      `;
    } else {
      sql = `
        SELECT
          w.id AS item_id,
          w.name AS item_name,
          SUM(tps.quantity_changed) AS total_stock,
          SUM(tps.quantity_changed * tps.default_price) AS total_stock_value
        FROM track_product_stock tps
        INNER JOIN product p ON tps.product_id = p.id AND p.company_id = :companyIdStr
        INNER JOIN warehouses w ON tps.store_id = w.id AND w.company_id = :companyId
        WHERE tps.company_id = :companyId AND tps.status = 1 AND tps.status_in_out = 1
        GROUP BY w.id, w.name
        ORDER BY total_stock_value DESC
        LIMIT 10
      `;
    }

    const rows = await sequelize.query(sql, {
      replacements,
      type: QueryTypes.SELECT,
    });

    const normalized = rows.map((row) => {
      const base = {
        item_name:
          row.item_name ||
          (type === "category" ? "Uncategorized" : null) ||
          "",
        total_stock: Number(row.total_stock) || 0,
        total_stock_value: parseFloat(
          Number(row.total_stock_value || 0).toFixed(2)
        ),
      };

      if (type === "age") {
        return {
          product_id: Number(row.product_id),
          item_id: row.item_id != null ? String(row.item_id) : null,
          ...base,
        };
      }

      if (type === "category") {
        return {
          item_id:
            row.item_id === null || row.item_id === undefined
              ? null
              : Number(row.item_id),
          ...base,
        };
      }

      return {
        item_id: Number(row.item_id),
        ...base,
      };
    });

    return res.status(200).json({
      status: true,
      message: "Stock valuation fetched successfully",
      data: {
        type,
        rows: normalized,
      },
    });
  } catch (error) {
    console.error("GetStockValuation error:", error);
    return res.status(500).json({
      status: false,
      message: "Error getting stock valuation",
      error: error.message,
    });
  }
};

/**
 * Get inventory overview
 * returns: inventory overview
 * if error occurs, returns error message
 */
  exports.InventoryOverview = async (req, res) => {
    const company_id = req.user.company_id;
    try {
      const result = await TrackProductStock.findAll({
        where: { company_id },
        attributes: [
          'product_id',
          [fn('SUM', literal(`CASE WHEN status_in_out = 1 THEN quantity_changed ELSE -quantity_changed END`)), 'net_quantity'],
          'default_price'
        ],
        group: ['product_id', 'default_price']
      });
  
      let totalValuation = 0;
      const uniqueItems = new Set();
  
      result.forEach(row => {
        const qty = parseFloat(row.getDataValue('net_quantity') || 0);
        const price = parseFloat(row.default_price || 0);
        const value = qty * price;
  
        totalValuation += value;
        uniqueItems.add(row.product_id);
      });
  
      res.json({
        totalItems: uniqueItems.size,
        totalValuation: parseFloat(totalValuation.toFixed(2))
      });
    } catch (error) {
      console.error('Error in getInventoryOverview:', error);
      return res.status(500).json({
        status: false,
        message: "Error getting inventory overview",
        error: error.message,
      });
    }
  };

  /**
   * Get inventory performance
   * returns: inventory performance
   * if error occurs, returns error message
   * filters: company_id
   * type: weekly, monthly, quarterly
   */
  exports.InventoryPerformance = async (req, res) => {
    const company_id = req.user.company_id;
    const { type = 'weekly' } = req.query;
  
    try {
      let groupBy;
      let labelFormat;
  
      // Dynamic grouping based on type
      if (type === 'weekly') {
        groupBy = literal('YEARWEEK(created_at, 1)');
        labelFormat = 'weekly';
      } else if (type === 'monthly') {
        groupBy = fn('DATE_FORMAT', col('created_at'), '%Y-%m');
        labelFormat = 'monthly';
      } else if (type === 'quarterly') {
        groupBy = literal('CONCAT(YEAR(created_at), "-Q", QUARTER(created_at))');
        labelFormat = 'quarterly';
      } else {
        return res.status(400).json({ error: 'Invalid type' });
      }
  
      // get inventory performance
      const result = await TrackProductStock.findAll({
        where: { company_id },
        attributes: [
          [groupBy, 'period'],
          'status_in_out',
          [fn('SUM', col('quantity_changed')), 'total']
        ],
        group: ['period', 'status_in_out'],
        order: [[literal('period'), 'ASC']],
        raw: true
      });
  
      // Transform data
      const grouped = {};
  
      result.forEach(entry => {
        const period = entry.period;
        const status = entry.status_in_out;
        const total = parseFloat(entry.total || 0);
  
        if (!grouped[period]) {
          grouped[period] = { Inward: 0, Outward: 0 };
        }
  
        if (status === 1) grouped[period].Inward += total;
        else if (status === 0) grouped[period].Outward += total;
      });
  
      const sortedPeriods = Object.keys(grouped).sort();
  
      // Label formatting
      const labels = sortedPeriods.map(p => {
        if (labelFormat === 'weekly') {
          const year = p.toString().slice(0, 4);
          const week = p.toString().slice(4);
          return `Week ${week} - ${year}`;
        } else if (labelFormat === 'monthly') {
          const [year, month] = p.split('-');
          return `${month}-${year}`;
        } else {
          return p; // already like 2026-Q1
        }
      });
  
      const inwardData = sortedPeriods.map(p => grouped[p].Inward);
      const outwardData = sortedPeriods.map(p => grouped[p].Outward);
  
      // return inventory performance
      return res.status(200).json({
        status: true,
        message: "Inventory performance fetched successfully",
        data: {
            labels,
            datasets: {
                Inward: inwardData,
                Outward: outwardData,
            }
        },
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch inventory performance.' });
    }
  };

  /**
   * Get top items
   * returns: top items
   * if error occurs, returns error message
   */
  exports.TopItems = async (req, res) => {
    const company_id = req.user.company_id;
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
      // Top Selling Items
      const topSelling = await TrackProductStock.findAll({
        where: {
          company_id,
          status_in_out: 0,
          created_at: { [Op.gte]: threeMonthsAgo },
        },
        attributes: [
          'item_name',
          [fn('COUNT', fn('DISTINCT', col('reference_number'))), 'invoice_count'],
          [fn('SUM', literal('quantity_changed * default_price')), 'traded_amount'],
        ],
        group: ['item_name'],
        order: [[literal('traded_amount'), 'DESC']],
        limit: 5,
      });
  
      // Top Purchased Items
      const topPurchased = await TrackProductStock.findAll({
        where: {
          company_id,
          status_in_out: 1,
          created_at: { [Op.gte]: threeMonthsAgo },
        },
        attributes: [
          'item_name',
          [fn('COUNT', fn('DISTINCT', col('reference_number'))), 'invoice_count'],
          [fn('SUM', literal('quantity_changed * default_price')), 'traded_amount'],
        ],
        group: ['item_name'],
        order: [[literal('traded_amount'), 'DESC']],
        limit: 5,
      });
  
      return res.status(200).json({
        status: true,
        message: "Top items fetched successfully",
        data: {
            topSelling: topSelling.map(item => ({
            item_name: item.item_name,
            invoice_count: parseInt(item.getDataValue('invoice_count')),
            traded_amount: parseFloat(item.getDataValue('traded_amount') || 0),
            })),
            topPurchased: topPurchased.map(item => ({
            item_name: item.item_name,
            invoice_count: parseInt(item.getDataValue('invoice_count')),
            traded_amount: parseFloat(item.getDataValue('traded_amount') || 0),
            })),
        },
      });
    } catch (error) {
      console.error('Error in getTopItems:', error);
      return res.status(500).json({
        status: false,
        message: "Error getting top items",
        error: error.message,
      });
    }
  };

  /**
    * Get stock colour counts
    * filters: product_id, warehouse_id, product_type_id, searchkey
    * returns: stock colour counts
    * if error occurs, returns error message
  */
  exports.GetStockColourCounts = async (req, res) => {
    try {
      const where = {
        company_id: req.user.company_id,
      };
      
      let productWhere = {};
      let isProductRequired = false;
  
      // Percentage calculation
      const percentage = `
        (
          (ProductStockEntry.buffer_size + (ProductStockEntry.buffer_size * 0.005)
          - ProductStockEntry.inventory_at_transit
          - ProductStockEntry.quantity)
          / NULLIF(ProductStockEntry.buffer_size, 0)
        ) * 100
      `;
  
      // get stock colour counts
      const result = await ProductStockEntry.findOne({
        attributes: [
          // black
          [
            Sequelize.literal(`SUM(CASE WHEN ${percentage} >= 99 THEN 1 ELSE 0 END)`),
            "black",
          ],
          // red
          [
            Sequelize.literal(`SUM(CASE WHEN ${percentage} >= 66 AND ${percentage} < 99 THEN 1 ELSE 0 END)`),
            "red",
          ],
          // yellow
          [
            Sequelize.literal(`SUM(CASE WHEN ${percentage} >= 33 AND ${percentage} < 66 THEN 1 ELSE 0 END)`),
            "yellow",
          ],
          // green
          [
            Sequelize.literal(`SUM(CASE WHEN ${percentage} >= 5 AND ${percentage} < 33 THEN 1 ELSE 0 END)`),
            "green",
          ],
          // cyan
          [
            Sequelize.literal(`SUM(CASE WHEN ${percentage} < 5 THEN 1 ELSE 0 END)`),
            "cyan",
          ],
        ],
        where,
        include: [
          {
            association: "product",
            attributes: [],
            where: productWhere,
            required: isProductRequired,
          },
        ],
        raw: true,
      });
  
      // return stock colour counts
      return res.status(200).json({
        status: true,
        message: "Stock colour counts fetched successfully",
        data: {
          black: Number(result.black) || 0,
          red: Number(result.red) || 0,
          yellow: Number(result.yellow) || 0,
          green: Number(result.green) || 0,
          cyan: Number(result.cyan) || 0,
        },
      });
  
    } catch (error) {
      console.error("GetStockColourCounts error:", error);
      return res.status(500).json({
        status: false,
        message: "Error getting stock colour counts",
        error: error.message,
      });
    }
  };