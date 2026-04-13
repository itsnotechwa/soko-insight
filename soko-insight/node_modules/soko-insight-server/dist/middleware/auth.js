"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
exports.requireSellerType = requireSellerType;
exports.requireSubscription = requireSubscription;
exports.generateToken = generateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const response_1 = require("../utils/response");
const database_1 = require("../config/database");
// Authentication middleware
async function authenticate(req, res, next) {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            (0, response_1.sendUnauthorized)(res, 'No token provided');
            return;
        }
        const token = authHeader.split(' ')[1];
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        // Check if user still exists and is active
        const { rows } = await (0, database_1.query)('SELECT id, email, business_name, seller_type, subscription_tier, is_active FROM users WHERE id = $1', [decoded.id]);
        if (rows.length === 0) {
            (0, response_1.sendUnauthorized)(res, 'User not found');
            return;
        }
        const user = rows[0];
        if (!user.is_active) {
            (0, response_1.sendForbidden)(res, 'Account is deactivated');
            return;
        }
        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            businessName: user.business_name,
            sellerType: user.seller_type,
            subscriptionTier: user.subscription_tier,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            (0, response_1.sendUnauthorized)(res, 'Token expired');
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            (0, response_1.sendUnauthorized)(res, 'Invalid token');
            return;
        }
        console.error('Auth middleware error:', error);
        (0, response_1.sendUnauthorized)(res, 'Authentication failed');
    }
}
// Optional authentication (doesn't fail if no token)
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        const { rows } = await (0, database_1.query)('SELECT id, email, business_name, seller_type, subscription_tier FROM users WHERE id = $1 AND is_active = true', [decoded.id]);
        if (rows.length > 0) {
            const user = rows[0];
            req.user = {
                id: user.id,
                email: user.email,
                businessName: user.business_name,
                sellerType: user.seller_type,
                subscriptionTier: user.subscription_tier,
            };
        }
        next();
    }
    catch {
        // Ignore errors for optional auth
        next();
    }
}
// Seller type restriction middleware
function requireSellerType(...allowedTypes) {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendUnauthorized)(res);
            return;
        }
        if (!allowedTypes.includes(req.user.sellerType)) {
            (0, response_1.sendForbidden)(res, 'This feature is not available for your seller type');
            return;
        }
        next();
    };
}
// Subscription tier restriction middleware
function requireSubscription(...allowedTiers) {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendUnauthorized)(res);
            return;
        }
        if (!allowedTiers.includes(req.user.subscriptionTier)) {
            (0, response_1.sendForbidden)(res, 'This feature requires a higher subscription tier');
            return;
        }
        next();
    };
}
// Generate JWT token
function generateToken(user) {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        businessName: user.businessName,
        sellerType: user.sellerType,
        subscriptionTier: user.subscriptionTier,
    }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.expiresIn });
}
//# sourceMappingURL=auth.js.map