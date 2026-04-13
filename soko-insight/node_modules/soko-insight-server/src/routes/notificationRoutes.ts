import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { validateUUID } from '../utils/validation';
import { validate } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all notifications
router.get('/', notificationController.getNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:id/read', validateUUID('id'), validate, notificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', validateUUID('id'), validate, notificationController.deleteNotification);

export default router;






