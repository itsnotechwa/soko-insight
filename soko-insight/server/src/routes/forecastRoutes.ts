import { Router } from 'express';
import { ForecastController } from '../controllers/forecastController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Forecast routes
router.get('/product/:productId', ForecastController.getProductForecast);
router.get('/inventory/:productId', ForecastController.getInventoryOptimization);
router.post('/bulk', ForecastController.getBulkForecast);

export default router;

