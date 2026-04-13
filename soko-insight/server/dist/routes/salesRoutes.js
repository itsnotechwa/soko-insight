"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const salesController = __importStar(require("../controllers/salesController"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_1 = require("../utils/validation");
const express_validator_1 = require("express-validator");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Get sales data with filters
router.get('/', validation_1.validatePagination, errorHandler_1.validate, salesController.getSales);
// Get sales summary
router.get('/summary', salesController.getSummary);
// Get daily sales for charts
router.get('/daily', salesController.getDailySales);
// Get top products
router.get('/top-products', salesController.getTopProducts);
// Get sales by channel
router.get('/by-channel', salesController.getSalesByChannel);
// Quick entry - create single sale
router.post('/quick-entry', validation_1.validateQuickEntry, errorHandler_1.validate, salesController.quickEntry);
// Bulk create sales
router.post('/bulk', [
    (0, express_validator_1.body)('sales').isArray({ min: 1 }).withMessage('Sales array is required'),
    (0, express_validator_1.body)('sales.*.productId').optional().isUUID().withMessage('Product ID must be a valid UUID'),
    (0, express_validator_1.body)('sales.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    (0, express_validator_1.body)('sales.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
    (0, express_validator_1.body)('sales.*.saleDate').isISO8601().withMessage('Sale date must be a valid date'),
], errorHandler_1.validate, salesController.bulkCreate);
// Delete sale
router.delete('/:id', (0, validation_1.validateUUID)('id'), errorHandler_1.validate, salesController.deleteSale);
// File upload routes
router.post('/upload/detect-headers', upload_1.upload.single('file'), salesController.detectHeaders);
router.post('/upload', upload_1.upload.single('file'), salesController.uploadFile);
router.post('/upload/mpesa', upload_1.upload.single('file'), salesController.uploadMpesa);
exports.default = router;
//# sourceMappingURL=salesRoutes.js.map