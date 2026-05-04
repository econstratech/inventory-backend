const crypto = require("crypto");
const ProductVariant = require("../model/ProductVariant");

/**
 * Remove all special characters from input string except whitespaces
 * @param {*} str
 * @returns {str}
 */
const removeSpecialChars = (str) => {
    return str.replace(/[^a-zA-Z0-9 ]/g, '');
}

/**
 * Global pagination formatter for Sequelize findAndCountAll
 *
 * @param {Object} result - Sequelize findAndCountAll result
 * @param {Number} page - Current page number
 * @param {Number} limit - Records per page
 * @returns {Object} Paginated response
 */
const paginate = (result, page = 1, limit = 10) => {
    const totalRecords = result.count;
    const totalPages = Math.ceil(totalRecords / limit);

    return {
        pagination: {
            total_records: totalRecords,
            total_pages: totalPages,
            current_page: Number(page),
            per_page: Number(limit),
            has_next_page: page < totalPages,
            has_prev_page: page > 1,
            next_page: page < totalPages ? page + 1 : null,
            prev_page: page > 1 ? page - 1 : null
        },
        rows: result.rows,
    };
};

/**
 * Format weight number
 * @param {number} value - Value to format
 * @returns {string} Formatted weight number
 */
const formatWeightNumber = (value) => {
    const num = Number(value) || 0;
    return Number.isInteger(num) ? `${num}` : `${parseFloat(num.toFixed(2))}`;
};

/**
 * Format total weight
 * @param {number} weightPerUnit - Weight per unit
 * @param {number} qty - Quantity
 * @param {string} uomLabel - Unit of measurement label
 * @returns {string} Formatted total weight
 */
const formatTotalWeight = (weightPerUnit, qty, uomLabel) => {
    const perUnit = Number(weightPerUnit) || 0;
    const quantity = Number(qty) || 0;
    const total = perUnit * quantity;
    const label = String(uomLabel || '').trim().toLowerCase();
  
    if (!label) return formatWeightNumber(total);
  
    // Normalize gram-based units so large totals are shown in higher units.
    if (label === 'g' || label === 'gram' || label === 'grams') {
      if (total >= 1000) return `${formatWeightNumber(total / 1000)} kg`;
      return `${formatWeightNumber(total)} g`;
    }
  
    if (label === 'mg') {
      const grams = total / 1000;
      if (grams >= 1000) return `${formatWeightNumber(grams / 1000)} kg`;
      if (grams >= 1) return `${formatWeightNumber(grams)} g`;
      return `${formatWeightNumber(total)} mg`;
    }
  
    if (label === 'kg') {
      return `${formatWeightNumber(total)} kg`;
    }
  
    return `${formatWeightNumber(total)} ${uomLabel}`;
};


/**
 * Generate a unique reference number
 * @param {string} prefix - Prefix for the reference number
 * @param {number} numberLength - Length of the reference number
 * @returns {string} Unique reference number
 */
const generateUniqueReferenceNumber = (prefix, numberLength = 6) => {
    const year = new Date().getFullYear();
    const referenceNumber = Math.floor(10 ** (numberLength - 1) + Math.random() * 9 * 10 ** (numberLength - 1));
    return `${prefix}-${year}-${referenceNumber}`;
}

const PRODUCT_VARIANT_BARCODE_LENGTH = 12;
const PRODUCT_VARIANT_BARCODE_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PRODUCT_VARIANT_BARCODE_MAX_ATTEMPTS = 10;

const buildRandomBarcode = () => {
    let code = '';
    for (let i = 0; i < PRODUCT_VARIANT_BARCODE_LENGTH; i++) {
        code += PRODUCT_VARIANT_BARCODE_CHARS[crypto.randomInt(0, PRODUCT_VARIANT_BARCODE_CHARS.length)];
    }
    return code;
};

/**
 * Generate a unique 12-character uppercase alphanumeric barcode for a ProductVariant.
 *
 * Uniqueness is enforced against `product_variants.barcode_number` (including
 * soft-deleted rows). For bulk creation, pass the same `reserved` Set across
 * iterations so codes allocated earlier in the batch — but not yet flushed to
 * the DB — are also avoided. The returned code is added to `reserved` automatically.
 *
 * @param {Object} [options]
 * @param {import('sequelize').Transaction} [options.transaction] - Sequelize transaction to read within
 * @param {Set<string>} [options.reserved] - Codes already allocated in the current batch
 * @returns {Promise<string>} 12-character uppercase alphanumeric barcode
 * @throws {Error} If a unique code cannot be generated within the attempt limit
 */
const generateUniqueProductVariantBarcode = async ({ transaction, reserved } = {}) => {
    for (let attempt = 0; attempt < PRODUCT_VARIANT_BARCODE_MAX_ATTEMPTS; attempt++) {
        const code = buildRandomBarcode();
        if (reserved && reserved.has(code)) continue;

        const collision = await ProductVariant.findOne({
            attributes: ['id'],
            where: { barcode_number: code },
            paranoid: false,
            raw: true,
            transaction,
        });
        if (collision) continue;

        if (reserved) reserved.add(code);
        return code;
    }
    throw new Error(`Failed to generate a unique product variant barcode after ${PRODUCT_VARIANT_BARCODE_MAX_ATTEMPTS} attempts`);
};

module.exports = {
    removeSpecialChars,
    paginate,
    formatWeightNumber,
    formatTotalWeight,
    generateUniqueReferenceNumber,
    generateUniqueProductVariantBarcode,
}