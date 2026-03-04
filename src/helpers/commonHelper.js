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


module.exports = {
    removeSpecialChars,
    paginate,
}