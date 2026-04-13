import { Request, Response } from 'express';
import { NotificationModel } from '../models/Notification';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';

// Get all notifications for user
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, isRead, category, type } = req.query;
  
  const result = await NotificationModel.findByUserId(req.user!.id, {
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 50,
    isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
    category: category as string,
    type: type as string,
  });
  
  return sendPaginated(
    res,
    result.notifications,
    page ? parseInt(page as string, 10) : 1,
    limit ? parseInt(limit as string, 10) : 50,
    result.total
  );
});

// Get unread count
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await NotificationModel.getUnreadCount(req.user!.id);
  
  return sendSuccess(res, { count });
});

// Mark notification as read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await NotificationModel.markAsRead(req.params.id, req.user!.id);
  
  if (!notification) {
    return sendError(res, 'Notification not found', 404);
  }
  
  return sendSuccess(res, notification, 'Notification marked as read');
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const count = await NotificationModel.markAllAsRead(req.user!.id);
  
  return sendSuccess(res, { count }, `Marked ${count} notifications as read`);
});

// Delete notification
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await NotificationModel.delete(req.params.id, req.user!.id);
  
  if (!deleted) {
    return sendError(res, 'Notification not found', 404);
  }
  
  return sendSuccess(res, null, 'Notification deleted');
});






