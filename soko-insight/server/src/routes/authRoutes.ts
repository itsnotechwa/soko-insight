import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import { validateRegister, validateLogin, validateUpdateProfile, validatePassword, validateUpdateSubscription } from '../utils/validation';
import { body } from 'express-validator';

const router = Router();

// Public routes
router.post('/register', validateRegister, validate, authController.register);
router.post('/login', validateLogin, validate, authController.login);
router.get('/plans', authController.getPricingPlans);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, validateUpdateProfile, validate, authController.updateProfile);
router.put('/subscription', authenticate, validateUpdateSubscription, validate, authController.updateSubscription);

router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('New password must be different from current password');
        }
        return true;
      }),
  ],
  validate,
  authController.changePassword
);

router.post(
  '/deactivate',
  authenticate,
  [body('password').notEmpty().withMessage('Password is required')],
  validate,
  authController.deactivateAccount
);

export default router;

