"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const forecastController_1 = require("../controllers/forecastController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Forecast routes
router.get('/product/:productId', forecastController_1.ForecastController.getProductForecast);
router.get('/inventory/:productId', forecastController_1.ForecastController.getInventoryOptimization);
router.post('/bulk', forecastController_1.ForecastController.getBulkForecast);
exports.default = router;
//# sourceMappingURL=forecastRoutes.js.map