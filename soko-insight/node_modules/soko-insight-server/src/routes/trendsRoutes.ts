import { Router } from 'express';
import { TrendsController } from '../controllers/trendsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Trends routes
router.post('/', TrendsController.getTrends);

export default router;

