"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrendsController = void 0;
const mlService_1 = require("../services/mlService");
const response_1 = require("../utils/response");
class TrendsController {
    // Get Google Trends data
    static async getTrends(req, res) {
        try {
            const { keywords, geo = 'KE', timeframe = 'today 12-m' } = req.body;
            if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
                (0, response_1.errorResponse)(res, 'keywords array is required with at least one keyword', 400);
                return;
            }
            if (keywords.length > 5) {
                (0, response_1.errorResponse)(res, 'Maximum 5 keywords allowed', 400);
                return;
            }
            const trends = await mlService_1.mlService.getTrends({
                keywords,
                geo: geo,
                timeframe: timeframe,
            });
            (0, response_1.successResponse)(res, trends, 'Trends retrieved successfully');
        }
        catch (error) {
            (0, response_1.errorResponse)(res, error.message, 500);
        }
    }
}
exports.TrendsController = TrendsController;
//# sourceMappingURL=trendsController.js.map