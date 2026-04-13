"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const competitorController_1 = require("../controllers/competitorController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Competitor routes
router.get('/', competitorController_1.CompetitorController.getCompetitors);
router.get('/:id', competitorController_1.CompetitorController.getCompetitor);
router.post('/', competitorController_1.CompetitorController.createCompetitor);
router.put('/:id', competitorController_1.CompetitorController.updateCompetitor);
router.delete('/:id', competitorController_1.CompetitorController.deleteCompetitor);
// Price routes
router.post('/prices', competitorController_1.CompetitorController.addPrice);
router.get('/prices/comparison/:productId', competitorController_1.CompetitorController.getPriceComparison);
router.get('/prices/history/:productId/:competitorId', competitorController_1.CompetitorController.getPriceHistory);
exports.default = router;
//# sourceMappingURL=competitorRoutes.js.map