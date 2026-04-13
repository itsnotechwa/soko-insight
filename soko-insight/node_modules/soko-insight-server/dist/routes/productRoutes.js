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
const productController = __importStar(require("../controllers/productController"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_1 = require("../utils/validation");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Get all products with pagination
router.get('/', validation_1.validatePagination, errorHandler_1.validate, productController.getProducts);
// Get low stock products
router.get('/low-stock', productController.getLowStockProducts);
// Get single product
router.get('/:id', (0, validation_1.validateUUID)('id'), errorHandler_1.validate, productController.getProduct);
// Create product
router.post('/', validation_1.validateProduct, errorHandler_1.validate, productController.createProduct);
// Update product
router.put('/:id', (0, validation_1.validateUUID)('id'), validation_1.validateProduct, errorHandler_1.validate, productController.updateProduct);
// Delete product
router.delete('/:id', (0, validation_1.validateUUID)('id'), errorHandler_1.validate, productController.deleteProduct);
// Update stock
router.patch('/:id/stock', (0, validation_1.validateUUID)('id'), [
    (0, express_validator_1.body)('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    (0, express_validator_1.body)('operation').isIn(['add', 'subtract', 'set']).withMessage('Operation must be add, subtract, or set'),
], errorHandler_1.validate, productController.updateStock);
exports.default = router;
//# sourceMappingURL=productRoutes.js.map