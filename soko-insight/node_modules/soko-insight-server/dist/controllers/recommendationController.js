"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRecommendations = exports.getRecommendations = void 0;
const recommendationsService_1 = require("../services/recommendationsService");
const response_1 = require("../utils/response");
const errorHandler_1 = require("../middleware/errorHandler");
// Get recommendations for user
exports.getRecommendations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const recommendations = await recommendationsService_1.RecommendationsService.generateRecommendations(req.user.id);
    return (0, response_1.sendSuccess)(res, recommendations);
});
// Generate and save recommendations (creates notifications)
exports.generateRecommendations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const recommendations = await recommendationsService_1.RecommendationsService.generateAndSaveRecommendations(req.user.id);
    // Ensure recommendations is an array
    const recommendationsData = Array.isArray(recommendations) ? recommendations : [];
    return (0, response_1.sendSuccess)(res, recommendationsData, 'Recommendations generated and saved');
});
//# sourceMappingURL=recommendationController.js.map