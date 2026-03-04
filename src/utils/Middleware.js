const jwt = require("jsonwebtoken");

/**
 * Authentication middleware that supports both Bearer token and direct token formats
 * Supports:
 * - Authorization: Bearer <token>
 * - Authorization: <token>
 * - authentication: Bearer <token>
 * - authentication: <token>
 */
exports.authToken = async (req, res, next) => {
    try {
        // Check both 'authorization' and 'authentication' headers (case-insensitive)
        const authHeader = req.headers.authorization || req.headers.authentication || 
                          req.headers.Authorization || req.headers.Authentication;
        
        if (!authHeader) {
            return res.status(401).json({ 
                status: false, 
                message: "Please log in. Authentication token is required." 
            });
        }

        // Extract token - handle both "Bearer <token>" and direct "<token>" formats
        let token;
        if (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer ')) {
            // Extract token after "Bearer " prefix
            token = authHeader.substring(7).trim();
        } else {
            // Use the header value directly as token
            token = authHeader.trim();
        }

        // Validate token is not empty
        if (!token || token.length === 0) {
            return res.status(401).json({ 
                status: false, 
                message: "Invalid authentication token format." 
            });
        }

        // Verify JWT token
        const verify = await jwt.verify(token, process.env.JWT_TOKEN);
        
        if (!verify) {
            return res.status(401).json({ 
                status: false, 
                message: "You are not verified. Invalid token." 
            });
        }

        // Attach user data to request object
        req.user = verify;
        next();
        
    } catch (err) {
        // Handle specific JWT errors
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

        // Generic error
        return res.status(400).json({ 
            status: false, 
            message: "Authentication error", 
            error: err.message 
        });
    }
}