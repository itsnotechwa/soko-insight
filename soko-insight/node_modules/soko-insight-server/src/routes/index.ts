import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import salesChannelRoutes from './salesChannelRoutes';
import salesRoutes from './salesRoutes';
import analyticsRoutes from './analyticsRoutes';
import notificationRoutes from './notificationRoutes';
import recommendationRoutes from './recommendationRoutes';
import competitorRoutes from './competitorRoutes';
import forecastRoutes from './forecastRoutes';
import trendsRoutes from './trendsRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/channels', salesChannelRoutes);
router.use('/sales', salesRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/competitors', competitorRoutes);
router.use('/forecast', forecastRoutes);
router.use('/trends', trendsRoutes);

export default router;

