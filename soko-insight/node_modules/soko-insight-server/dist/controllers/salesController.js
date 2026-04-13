"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMpesa = exports.uploadFile = exports.detectHeaders = exports.getSalesByChannel = exports.getTopProducts = exports.getDailySales = exports.getSummary = exports.deleteSale = exports.bulkCreate = exports.quickEntry = exports.getSales = void 0;
const SalesData_1 = require("../models/SalesData");
const Product_1 = require("../models/Product");
const response_1 = require("../utils/response");
const errorHandler_1 = require("../middleware/errorHandler");
const fileProcessor_1 = require("../services/fileProcessor");
const mpesaParser_1 = require("../services/mpesaParser");
const path_1 = __importDefault(require("path"));
// Get sales data with filters
exports.getSales = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, startDate, endDate, productId, channelId, sortBy, sortOrder } = req.query;
    const result = await SalesData_1.SalesDataModel.findByUserId(req.user.id, {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        productId: productId,
        channelId: channelId,
        sortBy: sortBy,
        sortOrder: sortOrder,
    });
    return (0, response_1.sendPaginated)(res, result.sales, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50, result.total);
});
// Quick entry - create single sale
exports.quickEntry = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { productId, quantity, unitPrice, saleDate, channelId, notes } = req.body;
    // Get product to calculate cost
    let costAmount = 0;
    if (productId) {
        const product = await Product_1.ProductModel.findById(productId, req.user.id);
        if (!product) {
            return (0, response_1.sendNotFound)(res, 'Product not found');
        }
        costAmount = product.costPrice * quantity;
        // Update product stock
        await Product_1.ProductModel.updateStock(productId, quantity, 'subtract');
    }
    const sale = await SalesData_1.SalesDataModel.create({
        userId: req.user.id,
        productId,
        channelId,
        saleDate: saleDate ? new Date(saleDate) : new Date(),
        quantity,
        unitPrice,
        costAmount,
        entryMethod: 'quick_entry',
        notes,
    });
    return (0, response_1.sendCreated)(res, sale, 'Sale recorded successfully');
});
// Bulk create sales (manual entry)
exports.bulkCreate = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sales } = req.body;
    if (!Array.isArray(sales) || sales.length === 0) {
        return (0, response_1.sendError)(res, 'Sales array is required', 400);
    }
    const records = sales.map((sale) => ({
        userId: req.user.id,
        productId: sale.productId,
        channelId: sale.channelId,
        saleDate: new Date(sale.saleDate),
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        costAmount: sale.costAmount,
        entryMethod: 'manual',
        notes: sale.notes,
    }));
    const result = await SalesData_1.SalesDataModel.bulkCreate(records);
    return (0, response_1.sendCreated)(res, result, `Created ${result.created} sales records`);
});
// Delete sale
exports.deleteSale = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const deleted = await SalesData_1.SalesDataModel.delete(req.params.id, req.user.id);
    if (!deleted) {
        return (0, response_1.sendNotFound)(res, 'Sale not found');
    }
    return (0, response_1.sendSuccess)(res, null, 'Sale deleted successfully');
});
// Get sales summary
exports.getSummary = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const summary = await SalesData_1.SalesDataModel.getSummary(req.user.id, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
    return (0, response_1.sendSuccess)(res, summary);
});
// Get daily sales for charts
exports.getDailySales = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return (0, response_1.sendError)(res, 'startDate and endDate are required', 400);
    }
    const dailySales = await SalesData_1.SalesDataModel.getDailySales(req.user.id, new Date(startDate), new Date(endDate));
    return (0, response_1.sendSuccess)(res, dailySales);
});
// Get top products
exports.getTopProducts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { limit, startDate, endDate } = req.query;
    const topProducts = await SalesData_1.SalesDataModel.getTopProducts(req.user.id, limit ? parseInt(limit, 10) : 10, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
    return (0, response_1.sendSuccess)(res, topProducts);
});
// Get sales by channel
exports.getSalesByChannel = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const salesByChannel = await SalesData_1.SalesDataModel.getSalesByChannel(req.user.id, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
    return (0, response_1.sendSuccess)(res, salesByChannel);
});
// Detect file headers for column mapping
exports.detectHeaders = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const file = req.file;
    if (!file) {
        return (0, response_1.sendError)(res, 'No file uploaded', 400);
    }
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    const fileType = ext === '.csv' ? 'csv' : 'xlsx';
    const headers = fileProcessor_1.FileProcessor.detectHeaders(file.buffer, fileType);
    return (0, response_1.sendSuccess)(res, { headers, fileType });
});
// Upload CSV/Excel file
exports.uploadFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const file = req.file;
    const { channelId, defaultChannelId, skipFirstRow, dateFormat, columnMapping: columnMappingStr, } = req.body;
    if (!file) {
        return (0, response_1.sendError)(res, 'No file uploaded', 400);
    }
    if (!columnMappingStr) {
        return (0, response_1.sendError)(res, 'Column mapping is required', 400);
    }
    let columnMapping;
    try {
        columnMapping = JSON.parse(columnMappingStr);
    }
    catch (error) {
        return (0, response_1.sendError)(res, 'Invalid column mapping format', 400);
    }
    // Validate required mappings
    if (!columnMapping.saleDate || (!columnMapping.quantity || (!columnMapping.unitPrice && !columnMapping.totalAmount))) {
        return (0, response_1.sendError)(res, 'Missing required column mappings: saleDate, quantity, and (unitPrice or totalAmount)', 400);
    }
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    let processedRows;
    try {
        if (ext === '.csv') {
            processedRows = await fileProcessor_1.FileProcessor.processCSV(file.buffer, {
                userId: req.user.id,
                channelId,
                defaultChannelId,
                columnMapping,
                skipFirstRow: skipFirstRow === 'true',
                dateFormat,
            });
        }
        else if (ext === '.xlsx' || ext === '.xls') {
            processedRows = await fileProcessor_1.FileProcessor.processExcel(file.buffer, {
                userId: req.user.id,
                channelId,
                defaultChannelId,
                columnMapping,
                skipFirstRow: skipFirstRow === 'true',
                dateFormat,
            });
        }
        else {
            return (0, response_1.sendError)(res, 'Unsupported file type. Only CSV and Excel files are supported.', 400);
        }
        // Separate valid and invalid rows
        const validRows = [];
        const invalidRows = [];
        processedRows.forEach((processed) => {
            if (processed.data && processed.errors.length === 0) {
                validRows.push(processed.data);
            }
            else {
                invalidRows.push({
                    row: processed.row,
                    errors: processed.errors,
                });
            }
        });
        // Bulk create valid sales records
        let created = 0;
        let failed = 0;
        if (validRows.length > 0) {
            // Calculate cost amounts for products
            const productIds = new Set(validRows.filter(r => r.productId).map(r => r.productId));
            const products = await Promise.all(Array.from(productIds).map(id => Product_1.ProductModel.findById(id, req.user.id)));
            const productMap = new Map();
            products.forEach(p => {
                if (p)
                    productMap.set(p.id, p.costPrice);
            });
            // Add cost amounts and update stock
            for (const record of validRows) {
                try {
                    if (record.productId) {
                        const costPrice = productMap.get(record.productId) || 0;
                        record.costAmount = costPrice * record.quantity;
                        // Update product stock
                        await Product_1.ProductModel.updateStock(record.productId, record.quantity, 'subtract');
                    }
                    await SalesData_1.SalesDataModel.create(record);
                    created++;
                }
                catch (error) {
                    console.error('Failed to create sales record:', error);
                    failed++;
                }
            }
        }
        return (0, response_1.sendSuccess)(res, {
            total: processedRows.length,
            created,
            failed,
            invalid: invalidRows.length,
            invalidRows: invalidRows.slice(0, 50), // Limit to first 50 invalid rows
            summary: {
                successRate: processedRows.length > 0 ? ((created / processedRows.length) * 100).toFixed(2) + '%' : '0%',
            },
        }, `Processed ${processedRows.length} rows. Created ${created} sales records.`);
    }
    catch (error) {
        console.error('File processing error:', error);
        return (0, response_1.sendError)(res, error instanceof Error ? error.message : 'Failed to process file', 500);
    }
});
// Upload M-Pesa statement
exports.uploadMpesa = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const file = req.file;
    const { channelId, minAmount, excludeWithdrawals } = req.body;
    if (!file) {
        return (0, response_1.sendError)(res, 'No file uploaded', 400);
    }
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (ext !== '.csv') {
        return (0, response_1.sendError)(res, 'M-Pesa statements must be in CSV format. Please export from M-Pesa portal as CSV.', 400);
    }
    try {
        const parsedTransactions = await mpesaParser_1.MpesaParser.parseCSV(file.buffer, {
            userId: req.user.id,
            channelId,
            minAmount: minAmount ? parseFloat(minAmount) : undefined,
            excludeWithdrawals: excludeWithdrawals === 'true',
        });
        // Separate valid and invalid transactions
        const validTransactions = parsedTransactions.filter((t) => t.salesData && t.errors.length === 0);
        const invalidTransactions = parsedTransactions.filter((t) => !t.salesData || t.errors.length > 0);
        // Get products to match transactions
        const productsResult = await Product_1.ProductModel.findByUserId(req.user.id, { limit: 1000 });
        const productPriceMap = new Map();
        productsResult.products.forEach((p) => {
            const price = Math.round(p.sellingPrice * 100) / 100; // Round to 2 decimals
            productPriceMap.set(price, p.id);
        });
        // Match transactions to products
        const matchedTransactions = await mpesaParser_1.MpesaParser.matchToProducts(validTransactions, productPriceMap);
        // Bulk create sales records
        let created = 0;
        let failed = 0;
        for (const parsed of matchedTransactions) {
            if (!parsed.salesData)
                continue;
            try {
                // Calculate cost if product is matched
                if (parsed.salesData.productId) {
                    const product = await Product_1.ProductModel.findById(parsed.salesData.productId, req.user.id);
                    if (product) {
                        parsed.salesData.costAmount = product.costPrice * parsed.salesData.quantity;
                        // Update product stock
                        await Product_1.ProductModel.updateStock(parsed.salesData.productId, parsed.salesData.quantity, 'subtract');
                    }
                }
                await SalesData_1.SalesDataModel.create(parsed.salesData);
                created++;
            }
            catch (error) {
                console.error('Failed to create sales record from M-Pesa transaction:', error);
                failed++;
            }
        }
        return (0, response_1.sendSuccess)(res, {
            total: parsedTransactions.length,
            created,
            failed,
            invalid: invalidTransactions.length,
            invalidTransactions: invalidTransactions.slice(0, 50).map((t) => ({
                row: t.row,
                errors: t.errors,
            })),
            summary: {
                successRate: parsedTransactions.length > 0
                    ? ((created / parsedTransactions.length) * 100).toFixed(2) + '%'
                    : '0%',
            },
        }, `Processed ${parsedTransactions.length} M-Pesa transactions. Created ${created} sales records.`);
    }
    catch (error) {
        console.error('M-Pesa parsing error:', error);
        return (0, response_1.sendError)(res, error instanceof Error ? error.message : 'Failed to process M-Pesa statement', 500);
    }
});
//# sourceMappingURL=salesController.js.map