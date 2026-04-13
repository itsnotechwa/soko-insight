import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get comprehensive analytics overview
router.get('/overview', analyticsController.getOverview);

// Get sales trends
router.get('/trends', analyticsController.getTrends);

// Get product performance
router.get('/products', analyticsController.getProductPerformance);

// Get channel comparison
router.get('/channels', analyticsController.getChannelComparison);

// Get category performance
router.get('/categories', analyticsController.getCategoryPerformance);

export default router;






