"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const productRoutes_1 = __importDefault(require("./productRoutes"));
const salesChannelRoutes_1 = __importDefault(require("./salesChannelRoutes"));
const salesRoutes_1 = __importDefault(require("./salesRoutes"));
const analyticsRoutes_1 = __importDefault(require("./analyticsRoutes"));
const notificationRoutes_1 = __importDefault(require("./notificationRoutes"));
const recommendationRoutes_1 = __importDefault(require("./recommendationRoutes"));
const competitorRoutes_1 = __importDefault(require("./competitorRoutes"));
const forecastRoutes_1 = __importDefault(require("./forecastRoutes"));
const trendsRoutes_1 = __importDefault(require("./trendsRoutes"));
const router = (0, express_1.Router)();
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
// API routes
router.use('/auth', authRoutes_1.default);
router.use('/products', productRoutes_1.default);
router.use('/channels', salesChannelRoutes_1.default);
router.use('/sales', salesRoutes_1.default);
router.use('/analytics', analyticsRoutes_1.default);
router.use('/notifications', notificationRoutes_1.default);
router.use('/recommendations', recommendationRoutes_1.default);
router.use('/competitors', competitorRoutes_1.default);
router.use('/forecast', forecastRoutes_1.default);
router.use('/trends', trendsRoutes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map