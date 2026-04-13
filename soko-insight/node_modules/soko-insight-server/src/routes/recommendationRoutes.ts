import { Router } from 'express';
import * as recommendationController from '../controllers/recommendationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get recommendations
router.get('/', recommendationController.getRecommendations);

// Generate and save recommendations
router.post('/generate', recommendationController.generateRecommendations);

export default router;






