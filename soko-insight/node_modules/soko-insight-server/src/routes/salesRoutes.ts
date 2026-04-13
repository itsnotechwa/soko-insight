import { Router } from 'express';
import * as salesController from '../controllers/salesController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import { validateQuickEntry, validateUUID, validatePagination } from '../utils/validation';
import { body } from 'express-validator';
import { upload } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get sales data with filters
router.get('/', validatePagination, validate, salesController.getSales);

// Get sales summary
router.get('/summary', salesController.getSummary);

// Get daily sales for charts
router.get('/daily', salesController.getDailySales);

// Get top products
router.get('/top-products', salesController.getTopProducts);

// Get sales by channel
router.get('/by-channel', salesController.getSalesByChannel);

// Quick entry - create single sale
router.post('/quick-entry', validateQuickEntry, validate, salesController.quickEntry);

// Bulk create sales
router.post(
  '/bulk',
  [
    body('sales').isArray({ min: 1 }).withMessage('Sales array is required'),
    body('sales.*.productId').optional().isUUID().withMessage('Product ID must be a valid UUID'),
    body('sales.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('sales.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
    body('sales.*.saleDate').isISO8601().withMessage('Sale date must be a valid date'),
  ],
  validate,
  salesController.bulkCreate
);

// Delete sale
router.delete('/:id', validateUUID('id'), validate, salesController.deleteSale);

// File upload routes
router.post('/upload/detect-headers', upload.single('file'), salesController.detectHeaders);
router.post('/upload', upload.single('file'), salesController.uploadFile);
router.post('/upload/mpesa', upload.single('file'), salesController.uploadMpesa);

export default router;

