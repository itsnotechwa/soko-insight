import { body, param, query, ValidationChain } from 'express-validator';

// Common validation chains
export const validateEmail = body('email')
  .isEmail()
  .withMessage('Please provide a valid email address')
  .normalizeEmail();

export const validatePassword = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/\d/)
  .withMessage('Password must contain at least one number');

export const validatePhone = body('phone')
  .optional()
  .matches(/^(\+254|0)[17]\d{8}$/)
  .withMessage('Please provide a valid Kenyan phone number');

export const validateUUID = (field: string) =>
  param(field)
    .isUUID()
    .withMessage(`${field} must be a valid UUID`);

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
];

// Auth validation
export const validateRegister: ValidationChain[] = [
  validateEmail,
  validatePassword,
  body('businessName')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Business name must be between 2 and 255 characters'),
  body('sellerType')
    .isIn(['small_trader', 'ecommerce', 'wholesaler'])
    .withMessage('Seller type must be one of: small_trader, ecommerce, wholesaler'),
  validatePhone,
];

export const validateLogin: ValidationChain[] = [
  validateEmail,
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const validateUpdateProfile: ValidationChain[] = [
  body('businessName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Business name must be between 2 and 255 characters'),
  validatePhone,
  body('languagePreference')
    .optional()
    .isIn(['en', 'sw'])
    .withMessage('Language must be en or sw'),
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('emailNotifications must be a boolean'),
  body('smsNotifications')
    .optional()
    .isBoolean()
    .withMessage('smsNotifications must be a boolean'),
];

export const validateUpdateSubscription: ValidationChain[] = [
  body('subscriptionTier')
    .isIn(['trial', 'starter', 'growth', 'pro'])
    .withMessage('Subscription tier must be one of: trial, starter, growth, pro'),
];

// Product validation
export const validateProduct: ValidationChain[] = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Product name is required and must be less than 255 characters'),
  body('sellingPrice')
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a positive number'),
  body('costPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),
  body('currentStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current stock must be a non-negative integer'),
  body('reorderLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer'),
  body('sku')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('SKU must be less than 100 characters'),
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
];

// Sales channel validation
export const validateSalesChannel: ValidationChain[] = [
  body('channelName')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Channel name is required'),
  body('channelType')
    .isIn(['online', 'offline', 'mpesa'])
    .withMessage('Channel type must be one of: online, offline, mpesa'),
  body('platform')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Platform must be less than 100 characters'),
];

// Sales data validation
export const validateQuickEntry: ValidationChain[] = [
  body('productId')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  body('saleDate')
    .optional()
    .isISO8601()
    .withMessage('Sale date must be a valid date'),
  body('channelId')
    .optional()
    .isUUID()
    .withMessage('Channel ID must be a valid UUID'),
];

// Competitor validation
export const validateCompetitor: ValidationChain[] = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Competitor name is required'),
  body('platform')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Platform must be less than 100 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
];

export const validateCompetitorPrice: ValidationChain[] = [
  body('productId')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  body('competitorId')
    .isUUID()
    .withMessage('Competitor ID must be a valid UUID'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
];

