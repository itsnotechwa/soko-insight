"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStock = exports.getLowStockProducts = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProduct = exports.getProducts = void 0;
const Product_1 = require("../models/Product");
const response_1 = require("../utils/response");
const errorHandler_1 = require("../middleware/errorHandler");
// Get all products for current user
exports.getProducts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, search, categoryId, isActive, sortBy, sortOrder } = req.query;
    const result = await Product_1.ProductModel.findByUserId(req.user.id, {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        search: search,
        categoryId: categoryId,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        sortBy: sortBy,
        sortOrder: sortOrder,
    });
    return (0, response_1.sendPaginated)(res, result.products, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20, result.total);
});
// Get single product
exports.getProduct = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const product = await Product_1.ProductModel.findById(req.params.id, req.user.id);
    if (!product) {
        return (0, response_1.sendNotFound)(res, 'Product not found');
    }
    return (0, response_1.sendSuccess)(res, product);
});
// Create product
exports.createProduct = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { name, sku, description, categoryId, costPrice, sellingPrice, currentStock, reorderLevel, unit } = req.body;
    const product = await Product_1.ProductModel.create({
        userId: req.user.id,
        name,
        sku,
        description,
        categoryId,
        costPrice,
        sellingPrice,
        currentStock,
        reorderLevel,
        unit,
    });
    return (0, response_1.sendCreated)(res, product, 'Product created successfully');
});
// Update product
exports.updateProduct = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { name, sku, description, categoryId, costPrice, sellingPrice, currentStock, reorderLevel, unit, isActive } = req.body;
    const product = await Product_1.ProductModel.update(req.params.id, req.user.id, {
        name,
        sku,
        description,
        categoryId,
        costPrice,
        sellingPrice,
        currentStock,
        reorderLevel,
        unit,
        isActive,
    });
    if (!product) {
        return (0, response_1.sendNotFound)(res, 'Product not found');
    }
    return (0, response_1.sendSuccess)(res, product, 'Product updated successfully');
});
// Delete product
exports.deleteProduct = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const deleted = await Product_1.ProductModel.delete(req.params.id, req.user.id);
    if (!deleted) {
        return (0, response_1.sendNotFound)(res, 'Product not found');
    }
    return (0, response_1.sendSuccess)(res, null, 'Product deleted successfully');
});
// Get low stock products
exports.getLowStockProducts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const products = await Product_1.ProductModel.getLowStock(req.user.id);
    return (0, response_1.sendSuccess)(res, products);
});
// Update stock
exports.updateStock = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { quantity, operation } = req.body;
    if (!['add', 'subtract', 'set'].includes(operation)) {
        return (0, response_1.sendError)(res, 'Operation must be one of: add, subtract, set', 400);
    }
    const product = await Product_1.ProductModel.updateStock(req.params.id, quantity, operation);
    if (!product) {
        return (0, response_1.sendNotFound)(res, 'Product not found');
    }
    return (0, response_1.sendSuccess)(res, product, 'Stock updated successfully');
});
//# sourceMappingURL=productController.js.map