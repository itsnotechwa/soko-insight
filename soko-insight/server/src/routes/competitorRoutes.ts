import { Router } from 'express';
import { CompetitorController } from '../controllers/competitorController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Competitor routes
router.get('/', CompetitorController.getCompetitors);
router.get('/:id', CompetitorController.getCompetitor);
router.post('/', CompetitorController.createCompetitor);
router.put('/:id', CompetitorController.updateCompetitor);
router.delete('/:id', CompetitorController.deleteCompetitor);

// Price routes
router.post('/prices', CompetitorController.addPrice);
router.get('/prices/comparison/:productId', CompetitorController.getPriceComparison);
router.get('/prices/history/:productId/:competitorId', CompetitorController.getPriceHistory);

export default router;

