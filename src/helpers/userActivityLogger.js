const { UserActivityLog } = require('../model');

const extractClientIp = (req) => {
    if (!req) return null;
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
        return String(forwarded).split(',')[0].trim() || null;
    }
    return req.ip || req.connection?.remoteAddress || null;
};

/**
 * Register a user activity log entry.
 *
 * Best-effort: logging failures are swallowed so auditing never breaks
 * the business request. If a `transaction` is supplied the insert joins
 * it; otherwise the row is written independently (useful for logging
 * AFTER a successful commit so failed operations are not recorded).
 *
 * @param {Object}   options
 * @param {Object}   options.req               - Express request (provides user, company, ip, ua)
 * @param {string}   options.module            - Logical area, e.g. "sales", "purchase_order", "stock"
 * @param {string}   options.action            - Event code, e.g. "sale_order_create", "approve"
 * @param {string}   [options.entityType]      - Model/resource type, e.g. "Sale", "Purchase"
 * @param {number}   [options.entityId]        - Affected row id
 * @param {string}   [options.entityReference] - Human-readable handle, e.g. "S2543108"
 * @param {string}   [options.description]     - Activity feed summary
 * @param {Object}   [options.metadata]        - Extra JSON context (diffs, related ids, etc.)
 * @param {Object}   [options.transaction]     - Optional sequelize transaction
 * @returns {Promise<UserActivityLog|null>}
 */
const registerUserActivity = async ({
    req,
    module: moduleName,
    action,
    entityType = null,
    entityId = null,
    entityReference = null,
    description = null,
    metadata = null,
    transaction = null,
} = {}) => {
    try {
        const userId = req?.user?.id ?? null;
        const companyId = req?.user?.company_id ?? null;

        if (!companyId) {
            console.warn('[userActivityLogger] skipped — missing company_id on req.user');
            return null;
        }
        if (!moduleName || !action) {
            console.warn('[userActivityLogger] skipped — module and action are required');
            return null;
        }

        return await UserActivityLog.create(
            {
                company_id: companyId,
                user_id: userId,
                module: moduleName,
                action,
                entity_type: entityType,
                entity_id: entityId,
                entity_reference: entityReference,
                description,
                metadata,
                ip_address: extractClientIp(req),
                user_agent: req?.headers?.['user-agent'] ?? null,
            },
            transaction ? { transaction } : undefined
        );
    } catch (err) {
        console.error('[userActivityLogger] failed to register activity:', err);
        return null;
    }
};

module.exports = { registerUserActivity };
