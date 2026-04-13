"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trendsController_1 = require("../controllers/trendsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Trends routes
router.post('/', trendsController_1.TrendsController.getTrends);
exports.default = router;
//# sourceMappingURL=trendsRoutes.js.map