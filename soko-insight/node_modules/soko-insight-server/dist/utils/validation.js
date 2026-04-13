"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCompetitorPrice = exports.validateCompetitor = exports.validateQuickEntry = exports.validateSalesChannel = exports.validateProduct = exports.validateUpdateSubscription = exports.validateUpdateProfile = exports.validateLogin = exports.validateRegister = exports.validatePagination = exports.validateUUID = exports.validatePhone = exports.validatePassword = exports.validateEmail = void 0;
const express_validator_1 = require("express-validator");
// Common validation chains
exports.validateEmail = (0, express_validator_1.body)('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail();
exports.validatePassword = (0, express_validator_1.body)('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number');
exports.validatePhone = (0, express_validator_1.body)('phone')
    .optional()
    .matches(/^(\+254|0)[17]\d{8}$/)
    .withMessage('Please provide a valid Kenyan phone number');
const validateUUID = (field) => (0, express_validator_1.param)(field)
    .isUUID()
    .withMessage(`${field} must be a valid UUID`);
exports.validateUUID = validateUUID;
exports.validatePagination = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),
];
// Auth validation
exports.validateRegister = [
    exports.validateEmail,
    exports.validatePassword,
    (0, express_validator_1.body)('businessName')
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Business name must be between 2 and 255 characters'),
    (0, express_validator_1.body)('sellerType')
        .isIn(['small_trader', 'ecommerce', 'wholesaler'])
        .withMessage('Seller type must be one of: small_trader, ecommerce, wholesaler'),
    exports.validatePhone,
];
exports.validateLogin = [
    exports.validateEmail,
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required'),
];
exports.validateUpdateProfile = [
    (0, express_validator_1.body)('businessName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Business name must be between 2 and 255 characters'),
    exports.validatePhone,
    (0, express_validator_1.body)('languagePreference')
        .optional()
        .isIn(['en', 'sw'])
        .withMessage('Language must be en or sw'),
    (0, express_validator_1.body)('emailNotifications')
        .optional()
        .isBoolean()
        .withMessage('emailNotifications must be a boolean'),
    (0, express_validator_1.body)('smsNotifications')
        .optional()
        .isBoolean()
        .withMessage('smsNotifications must be a boolean'),
];
exports.validateUpdateSubscription = [
    (0, express_validator_1.body)('subscriptionTier')
        .isIn(['trial', 'starter', 'growth', 'pro'])
        .withMessage('Subscription tier must be one of: trial, starter, growth, pro'),
];
// Product validation
exports.validateProduct = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Product name is required and must be less than 255 characters'),
    (0, express_validator_1.body)('sellingPrice')
        .isFloat({ min: 0 })
        .withMessage('Selling price must be a positive number'),
    (0, express_validator_1.body)('costPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Cost price must be a positive number'),
    (0, express_validator_1.body)('currentStock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Current stock must be a non-negative integer'),
    (0, express_validator_1.body)('reorderLevel')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Reorder level must be a non-negative integer'),
    (0, express_validator_1.body)('sku')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('SKU must be less than 100 characters'),
    (0, express_validator_1.body)('categoryId')
        .optional()
        .isUUID()
        .withMessage('Category ID must be a valid UUID'),
];
// Sales channel validation
exports.validateSalesChannel = [
    (0, express_validator_1.body)('channelName')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Channel name is required'),
    (0, express_validator_1.body)('channelType')
        .isIn(['online', 'offline', 'mpesa'])
        .withMessage('Channel type must be one of: online, offline, mpesa'),
    (0, express_validator_1.body)('platform')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Platform must be less than 100 characters'),
];
// Sales data validation
exports.validateQuickEntry = [
    (0, express_validator_1.body)('productId')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    (0, express_validator_1.body)('quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer'),
    (0, express_validator_1.body)('unitPrice')
        .isFloat({ min: 0 })
        .withMessage('Unit price must be a positive number'),
    (0, express_validator_1.body)('saleDate')
        .optional()
        .isISO8601()
        .withMessage('Sale date must be a valid date'),
    (0, express_validator_1.body)('channelId')
        .optional()
        .isUUID()
        .withMessage('Channel ID must be a valid UUID'),
];
// Competitor validation
exports.validateCompetitor = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Competitor name is required'),
    (0, express_validator_1.body)('platform')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Platform must be less than 100 characters'),
    (0, express_validator_1.body)('website')
        .optional()
        .isURL()
        .withMessage('Website must be a valid URL'),
];
exports.validateCompetitorPrice = [
    (0, express_validator_1.body)('productId')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    (0, express_validator_1.body)('competitorId')
        .isUUID()
        .withMessage('Competitor ID must be a valid UUID'),
    (0, express_validator_1.body)('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
];
//# sourceMappingURL=validation.js.map