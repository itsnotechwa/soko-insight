"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompetitorController = void 0;
const Competitor_1 = require("../models/Competitor");
const Product_1 = require("../models/Product");
const response_1 = require("../utils/response");
class CompetitorController {
    // Get all competitors
    static async getCompetitors(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20, search, platform, isActive } = req.query;
            const result = await Competitor_1.CompetitorModel.findByUserId(userId, {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                search: search,
                platform: platform,
                isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
            });
            (0, response_1.successResponse)(res, result, 'Competitors retrieved successfully');
        }
        catch (error) {
            (0, response_1.errorResponse)(res, error.message, 500);
        }
    }
    // Get single competitor
    static async getCompetitor(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const competitor = await Competitor_1.CompetitorModel.findById(id, userId);
            if (!competitor) {
                (0, response_1.errorResponse)(res, 'Competitor not found', 404);
                return;
            }
            (0, response_1.successResponse)(res, competitor, 'Competitor retrieved successfully');
        }
        catch (error) {
            (0, response_1.errorResponse)(res, error.message, 500);
        }
    }
    // Create competitor
    static async createCompetitor(req, res) {
        try {
            const userId = req.user.id;
            const { name, platform, website, notes } = req.body;
            if (!name) {
                (0, response_1.errorResponse)(res, 'Competitor name is required', 400);
                return;
            }
            const competitor = await Competitor_1.CompetitorModel.create({
                userId,
                name,
                platform,
                website,
                notes,
            });
            (0, response_1.successResponse)(res, competitor, 'Competitor created successfully', 201);
        }
        catch (error) {
            (0, response_1.errorResponse)(res, error.message, 500);
        }
    }
    // Update competitor
    static async updateCompetitor(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { name, platform, website, notes, isActive } = req.body;
            const competitor = await Competitor_1.CompetitorModel.update(id, userId, {
                name,
                platform,
                website,
                notes,
                isActive,
            });
            if (!competitor) {
                (0, response_1.errorResponse)(res, 'Competitor not found', 404);
                return;
            }
            (0, response_1.successResponse)(res, competitor, 'Competitor updated successfully');
        }
        catch (error) {
            (0, response_1.errorResponse)(res, error.message, 500);
        }
    }
    // Delete competitor
    static async deleteCompetitor(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const deleted = await Competitor_1.CompetitorModel.delete(id, userId);
            if (!deleted) {
                (0, response_1.errorResponse)(res, 'Competitor not found', 404);
                return;
            }
            (0, response_1.successResponse)(res, null, 'Competitor deleted successfully');
        }
        catch (error) {
            (0, response_1.errorResponse)(res, error.message, 500);
        }
    }
    // Add competitor price
    static async addPrice(req, res) {
        try {
            const userId = req.user.id;
            const { productId, competitorId, price } = req.body;
            if (!productId || !competitorId || price === undefined) {
                (0, response_1.errorResponse)(res, 'Product ID, competitor ID, and price are required', 400);
                return;
            }
            // Verify product belongs to user
            const product = await Product_1.ProductModel.findById(productId, userId);
            if (!product) {
                (0, response_1.errorResponse)(res, 'Product not found', 404);
                return;
            }
            // Verify competitor belongs to user
            const competitor = await Competitor_1.CompetitorModel.findById(competitorId, userId);
            if (!competitor) {
                (0, response_1.errorResponse)(res, 'Competitor not found', 404);
                return;
            }
            const priceRecord = await Competitor_1.CompetitorPriceModel.create({
                productId,
                competitorId,
                price: parseFloat(price),
            });
            (0, response_1.successResponse)(res, priceRecord, 'Price recorded successfully', 201);
        }
        catch (error) {
            (0, response_1.errorResponse)(res, error.message, 500);
        }
    }
    // Get price comparison for a product
    static async getPriceComparison(req, res) {
        try {
            const userId = req.user.id;
            const { productId } = req.params;
            // Verify product belongs to user
            const product = await Product_1.ProductModel.findById(productId, userId);
            if (!product) {
                (0, response_1.errorResponse)(res, 'Product not found', 404);
                return;
            }
            const comparison = await Competitor_1.CompetitorPriceModel.getPriceComparison(productId, product.sellingPrice);
            (0, response_1.successResponse)(res, comparison, 'Price comparison retrieved successfully');
        }
        catch (error) {
            (0, response_1.errorResponse)(res, error.message, 500);
        }
    }
    // Get price history
    static async getPriceHistory(req, res) {
        try {
            const userId = req.user.id;
            const { productId, competitorId } = req.params;
            const { days = 30 } = req.query;
            // Verify product belongs to user
            const product = await Product_1.ProductModel.findById(productId, userId);
            if (!product) {
                (0, response_1.errorResponse)(res, 'Product not found', 404);
                return;
            }
            // Verify competitor belongs to user
            const competitor = await Competitor_1.CompetitorModel.findById(competitorId, userId);
            if (!competitor) {
                (0, response_1.errorResponse)(res, 'Competitor not found', 404);
                return;
            }
            const history = await Competitor_1.CompetitorPriceModel.getPriceHistory(productId, competitorId, parseInt(days, 10));
            (0, response_1.successResponse)(res, history, 'Price history retrieved successfully');
        }
        catch (error) {
            (0, response_1.errorResponse)(res, error.message, 500);
        }
    }
}
exports.CompetitorController = CompetitorController;
//# sourceMappingURL=competitorController.js.map