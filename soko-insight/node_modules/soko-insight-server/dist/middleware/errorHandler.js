"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.validate = validate;
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
const express_validator_1 = require("express-validator");
const response_1 = require("../utils/response");
const config_1 = require("../config");
// Custom error class
class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// Validation middleware (to be used after express-validator checks)
function validate(req, res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: 'path' in err ? err.path : 'unknown',
            message: err.msg,
        }));
        (0, response_1.sendValidationError)(res, formattedErrors);
        return;
    }
    next();
}
// 404 handler
function notFoundHandler(req, res) {
    (0, response_1.sendError)(res, `Route ${req.originalUrl} not found`, 404);
}
// Global error handler
function errorHandler(err, req, res, _next) {
    console.error('Error:', err);
    // Handle known operational errors
    if (err instanceof AppError) {
        (0, response_1.sendError)(res, err.message, err.statusCode);
        return;
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        (0, response_1.sendError)(res, 'Invalid token', 401);
        return;
    }
    if (err.name === 'TokenExpiredError') {
        (0, response_1.sendError)(res, 'Token expired', 401);
        return;
    }
    // Handle PostgreSQL errors
    if ('code' in err) {
        const pgError = err;
        // Unique violation
        if (pgError.code === '23505') {
            const match = pgError.detail?.match(/Key \((.+)\)=/);
            const field = match ? match[1] : 'field';
            (0, response_1.sendError)(res, `A record with this ${field} already exists`, 409);
            return;
        }
        // Foreign key violation
        if (pgError.code === '23503') {
            (0, response_1.sendError)(res, 'Referenced record does not exist', 400);
            return;
        }
        // Check constraint violation
        if (pgError.code === '23514') {
            (0, response_1.sendError)(res, 'Invalid value provided', 400);
            return;
        }
    }
    // Handle multer errors
    if (err.name === 'MulterError') {
        const multerError = err;
        if (multerError.code === 'LIMIT_FILE_SIZE') {
            (0, response_1.sendError)(res, 'File too large', 413);
            return;
        }
        (0, response_1.sendError)(res, `File upload error: ${multerError.message}`, 400);
        return;
    }
    // Default to 500 server error
    if (config_1.config.nodeEnv === 'development') {
        (0, response_1.sendError)(res, err.message || 'Internal server error', 500);
    }
    else {
        (0, response_1.sendServerError)(res);
    }
}
// Async handler wrapper to catch async errors
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=errorHandler.js.map