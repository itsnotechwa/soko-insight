"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendCreated = sendCreated;
exports.sendPaginated = sendPaginated;
exports.sendError = sendError;
exports.sendNotFound = sendNotFound;
exports.sendUnauthorized = sendUnauthorized;
exports.sendForbidden = sendForbidden;
exports.sendServerError = sendServerError;
exports.sendValidationError = sendValidationError;
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
function sendSuccess(res, data, message, statusCode = 200) {
    const response = {
        success: true,
        message,
        data,
    };
    return res.status(statusCode).json(response);
}
function sendCreated(res, data, message = 'Resource created successfully') {
    return sendSuccess(res, data, message, 201);
}
function sendPaginated(res, data, page, limit, total, message) {
    const response = {
        success: true,
        message,
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
    return res.status(200).json(response);
}
function sendError(res, message, statusCode = 400, errors) {
    const response = {
        success: false,
        error: message,
        errors,
    };
    return res.status(statusCode).json(response);
}
function sendNotFound(res, message = 'Resource not found') {
    return sendError(res, message, 404);
}
function sendUnauthorized(res, message = 'Unauthorized') {
    return sendError(res, message, 401);
}
function sendForbidden(res, message = 'Forbidden') {
    return sendError(res, message, 403);
}
function sendServerError(res, message = 'Internal server error') {
    return sendError(res, message, 500);
}
function sendValidationError(res, errors) {
    return sendError(res, 'Validation failed', 422, errors);
}
// Alias functions for backward compatibility (used by Phase 4 controllers)
function successResponse(res, data, message, statusCode = 200) {
    return sendSuccess(res, data, message, statusCode);
}
function errorResponse(res, message, statusCode = 400) {
    return sendError(res, message, statusCode);
}
//# sourceMappingURL=response.js.map