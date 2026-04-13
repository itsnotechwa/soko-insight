"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForecastController = void 0;
const Product_1 = require("../models/Product");
const mlService_1 = require("../services/mlService");
const response_1 = require("../utils/response");
const database_1 = require("../config/database");
class ForecastController {
    // Get forecast for a product
    static async getProductForecast(req, res) {
        try {
            const userId = req.user.id;
            const { productId } = req.params;
            const { days = 7, model = 'sarima' } = req.query;
            // Verify product belongs to user
            const product = await Product_1.ProductModel.findById(productId, userId);
            if (!product) {
                (0, response_1.errorResponse)(res, 'Product not found', 404);
                return;
            }
            // Get historical sales data (last 90 days minimum, or all available)
            const { rows } = await (0, database_1.query)(`SELECT sale_date as date, SUM(quantity) as quantity, SUM(total_amount) as revenue
         FROM sales_data
         WHERE product_id = $1 AND user_id = $2
         GROUP BY sale_date
         ORDER BY sale_date ASC`, [productId, userId]);
            if (rows.length < 7) {
                (0, response_1.errorResponse)(res, 'Insufficient sales data. Need at least 7 days of sales history.', 400);
                return;
            }
            // Prepare sales data for ML service
            // #region agent log
            fetch('http://127.0.0.1:7245/ingest/f95be562-4ac5-45c9-8b92-5fade3576870', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'forecastController.ts:38', message: 'Raw rows from DB query', data: { rowsCount: rows.length, sampleRow: rows[0] ? { date: rows[0].date, dateType: typeof rows[0].date, dateIsDate: rows[0].date instanceof Date, quantity: rows[0].quantity, quantityType: typeof rows[0].quantity, revenue: rows[0].revenue } : null }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
            // #endregion
            const salesData = rows.map((row, index) => {
                // Handle date - PostgreSQL returns Date objects or strings depending on driver
                let dateStr;
                if (row.date instanceof Date) {
                    dateStr = row.date.toISOString().split('T')[0];
                }
                else if (typeof row.date === 'string') {
                    dateStr = row.date.split('T')[0];
                }
                else {
                    // Fallback: try to convert to date
                    dateStr = new Date(row.date).toISOString().split('T')[0];
                }
                // Handle quantity - SUM() returns numeric type (Decimal/BigInt/Number)
                let qty;
                if (typeof row.quantity === 'number') {
                    qty = Math.floor(row.quantity);
                }
                else {
                    qty = parseInt(String(row.quantity), 10);
                    if (isNaN(qty)) {
                        qty = 0;
                    }
                }
                // #region agent log
                if (index === 0) {
                    fetch('http://127.0.0.1:7245/ingest/f95be562-4ac5-45c9-8b92-5fade3576870', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'forecastController.ts:52', message: 'Transformed data point (first)', data: { originalDate: row.date, dateStr, originalQuantity: row.quantity, qty, hasDate: !!dateStr, hasQuantity: typeof qty === 'number' && !isNaN(qty) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
                }
                // #endregion
                return {
                    date: dateStr,
                    quantity: qty,
                    revenue: row.revenue ? parseFloat(String(row.revenue)) : undefined,
                };
            });
            // #region agent log
            fetch('http://127.0.0.1:7245/ingest/f95be562-4ac5-45c9-8b92-5fade3576870', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'forecastController.ts:67', message: 'Sales data array before ML service call', data: { salesDataCount: salesData.length, sampleData: salesData[0], allHaveDate: salesData.every(d => d.date && typeof d.date === 'string'), allHaveQuantity: salesData.every(d => typeof d.quantity === 'number' && !isNaN(d.quantity)), invalidEntries: salesData.filter(d => !d.date || typeof d.quantity !== 'number' || isNaN(d.quantity)) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
            // #endregion
            // Call ML service
            const forecast = await mlService_1.mlService.forecast({
                product_id: productId,
                sales_data: salesData,
                forecast_days: parseInt(days, 10),
                model: model,
            });
            (0, response_1.successResponse)(res, forecast, 'Forecast generated successfully');
        }
        catch (error) {
            (0, response_1.errorResponse)(res, error.message, 500);
        }
    }
    // Get inventory optimization recommendation
    static async getInventoryOptimization(req, res) {
        try {
            const userId = req.user.id;
            const { productId } = req.params;
            const { leadTimeDays = 7, safetyStockPercentage = 0.2 } = req.query;
            // Verify product belongs to user
            const product = await Product_1.ProductModel.findById(productId, userId);
            if (!product) {
                (0, response_1.errorResponse)(res, 'Product not found', 404);
                return;
            }
            // Get forecast first
            const { rows } = await (0, database_1.query)(`SELECT sale_date as date, SUM(quantity) as quantity
         FROM sales_data
         WHERE product_id = $1 AND user_id = $2
         GROUP BY sale_date
         ORDER BY sale_date ASC`, [productId, userId]);
            let forecastedDemand = 0;
            if (rows.length >= 7) {
                // Get forecast for lead time period
                const salesData = rows.map(row => {
                    // Handle date - PostgreSQL returns Date objects or strings depending on driver
                    let dateStr;
                    if (row.date instanceof Date) {
                        dateStr = row.date.toISOString().split('T')[0];
                    }
                    else if (typeof row.date === 'string') {
                        dateStr = row.date.split('T')[0];
                    }
                    else {
                        dateStr = new Date(row.date).toISOString().split('T')[0];
                    }
                    // Handle quantity - SUM() returns numeric type
                    let qty;
                    if (typeof row.quantity === 'number') {
                        qty = Math.floor(row.quantity);
                    }
                    else {
                        qty = parseInt(String(row.quantity), 10);
                        if (isNaN(qty))
                            qty = 0;
                    }
                    return {
                        date: dateStr,
                        quantity: qty,
                    };
                });
                try {
                    const forecast = await mlService_1.mlService.forecast({
                        product_id: productId,
                        sales_data: salesData,
                        forecast_days: parseInt(leadTimeDays, 10),
                        model: 'sarima',
                    });
                    // Sum forecasted demand over lead time
                    forecastedDemand = forecast.forecasts.reduce((sum, f) => sum + f.predicted_demand, 0);
                }
                catch (error) {
                    // If forecasting fails, use average of recent sales
                    const avgDailySales = rows.slice(-14).reduce((sum, row) => {
                        const qty = typeof row.quantity === 'number' ? row.quantity : parseInt(String(row.quantity), 10);
                        return sum + (isNaN(qty) ? 0 : qty);
                    }, 0) / Math.min(14, rows.length);
                    forecastedDemand = Math.ceil(avgDailySales * parseInt(leadTimeDays, 10));
                }
            }
            else {
                // Use average of available sales data
                const avgDailySales = rows.length > 0
                    ? rows.reduce((sum, row) => {
                        const qty = typeof row.quantity === 'number' ? row.quantity : parseInt(String(row.quantity), 10);
                        return sum + (isNaN(qty) ? 0 : qty);
                    }, 0) / rows.length
                    : 0;
                forecastedDemand = Math.ceil(avgDailySales * parseInt(leadTimeDays, 10));
            }
            // Get optimization recommendation
            const optimization = await mlService_1.mlService.optimizeInventory({
                product_id: productId,
                current_stock: product.currentStock,
                reorder_level: product.reorderLevel,
                forecasted_demand: forecastedDemand,
                lead_time_days: parseInt(leadTimeDays, 10),
                safety_stock_percentage: parseFloat(safetyStockPercentage),
            });
            (0, response_1.successResponse)(res, optimization, 'Inventory optimization retrieved successfully');
        }
        catch (error) {
            (0, response_1.errorResponse)(res, error.message, 500);
        }
    }
    // Bulk forecast for multiple products
    static async getBulkForecast(req, res) {
        try {
            const userId = req.user.id;
            const { days = 7, model = 'sarima' } = req.query;
            const { productIds } = req.body;
            if (!productIds || !Array.isArray(productIds)) {
                (0, response_1.errorResponse)(res, 'productIds array is required', 400);
                return;
            }
            const forecasts = [];
            for (const productId of productIds) {
                try {
                    // Verify product belongs to user
                    const product = await Product_1.ProductModel.findById(productId, userId);
                    if (!product)
                        continue;
                    // Get historical sales data
                    const { rows } = await (0, database_1.query)(`SELECT sale_date as date, SUM(quantity) as quantity
             FROM sales_data
             WHERE product_id = $1 AND user_id = $2
             GROUP BY sale_date
             ORDER BY sale_date ASC`, [productId, userId]);
                    if (rows.length < 7)
                        continue;
                    const salesData = rows.map(row => {
                        // Handle date - PostgreSQL returns Date objects or strings depending on driver
                        let dateStr;
                        if (row.date instanceof Date) {
                            dateStr = row.date.toISOString().split('T')[0];
                        }
                        else if (typeof row.date === 'string') {
                            dateStr = row.date.split('T')[0];
                        }
                        else {
                            dateStr = new Date(row.date).toISOString().split('T')[0];
                        }
                        // Handle quantity - SUM() returns numeric type
                        let qty;
                        if (typeof row.quantity === 'number') {
                            qty = Math.floor(row.quantity);
                        }
                        else {
                            qty = parseInt(String(row.quantity), 10);
                            if (isNaN(qty))
                                qty = 0;
                        }
                        return {
                            date: dateStr,
                            quantity: qty,
                        };
                    });
                    const forecast = await mlService_1.mlService.forecast({
                        product_id: productId,
                        sales_data: salesData,
                        forecast_days: parseInt(days, 10),
                        model: model,
                    });
                    forecasts.push({
                        product_id: productId,
                        product_name: product.name,
                        ...forecast,
                    });
                }
                catch (error) {
                    // Skip products that fail
                    continue;
                }
            }
            (0, response_1.successResponse)(res, { forecasts }, 'Bulk forecast completed');
        }
        catch (error) {
            (0, response_1.errorResponse)(res, error.message, 500);
        }
    }
}
exports.ForecastController = ForecastController;
//# sourceMappingURL=forecastController.js.map