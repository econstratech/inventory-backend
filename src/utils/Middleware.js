const jwt = require("jsonwebtoken");
const { AUTH_COOKIE_NAME } = require("./authCookie");

/**
 * Authentication middleware.
 *
 * Primary source: HttpOnly `token` cookie (set on login). This is what every
 * browser request to the SPA carries — JS never sees it, so XSS can't steal it.
 *
 * Fallback: `authentication` / `Authorization` header, used by inter-service
 * callers (e.g. the upstream ERP hitting `/user/get-bms-user-permission-list`).
 * If both header forms ever disappear, the header branch can be removed.
 */
exports.authToken = async (req, res, next) => {
    try {
        let token = req.cookies && req.cookies[AUTH_COOKIE_NAME];

        if (!token) {
            const authHeader = req.headers.authorization || req.headers.authentication ||
                              req.headers.Authorization || req.headers.Authentication;

            if (authHeader) {
                if (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer ')) {
                    token = authHeader.substring(7).trim();
                } else {
                    token = authHeader.trim();
                }
            }
        }

        if (!token || token.length === 0) {
            return res.status(401).json({
                status: false,
                message: "Please log in. Authentication token is required."
            });
        }

        const verify = await jwt.verify(token, process.env.JWT_TOKEN);

        if (!verify) {
            return res.status(401).json({
                status: false,
                message: "You are not verified. Invalid token."
            });
        }

        req.user = verify;
        next();

    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: false,
                message: "Invalid authentication token."
            });
        }

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: false,
                message: "Authentication token has expired. Please log in again."
            });
        }

        return res.status(400).json({
            status: false,
            message: "Authentication error",
            error: err.message
        });
    }
}
