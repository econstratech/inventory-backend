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

module.exports = {
    removeSpecialChars,
    paginate,
    formatWeightNumber,
    formatTotalWeight,
    generateUniqueReferenceNumber,
}