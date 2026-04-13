import { Router } from 'express';
import * as productController from '../controllers/productController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import { validateProduct, validateUUID, validatePagination } from '../utils/validation';
import { body } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all products with pagination
router.get('/', validatePagination, validate, productController.getProducts);

// Get low stock products
router.get('/low-stock', productController.getLowStockProducts);

// Get single product
router.get('/:id', validateUUID('id'), validate, productController.getProduct);

// Create product
router.post('/', validateProduct, validate, productController.createProduct);

// Update product
router.put('/:id', validateUUID('id'), validateProduct, validate, productController.updateProduct);

// Delete product
router.delete('/:id', validateUUID('id'), validate, productController.deleteProduct);

// Update stock
router.patch(
  '/:id/stock',
  validateUUID('id'),
  [
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('operation').isIn(['add', 'subtract', 'set']).withMessage('Operation must be add, subtract, or set'),
  ],
  validate,
  productController.updateStock
);

export default router;

