"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const Notification_1 = require("../models/Notification");
const response_1 = require("../utils/response");
const errorHandler_1 = require("../middleware/errorHandler");
// Get all notifications for user
exports.getNotifications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, isRead, category, type } = req.query;
    const result = await Notification_1.NotificationModel.findByUserId(req.user.id, {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        category: category,
        type: type,
    });
    return (0, response_1.sendPaginated)(res, result.notifications, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50, result.total);
});
// Get unread count
exports.getUnreadCount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const count = await Notification_1.NotificationModel.getUnreadCount(req.user.id);
    return (0, response_1.sendSuccess)(res, { count });
});
// Mark notification as read
exports.markAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const notification = await Notification_1.NotificationModel.markAsRead(req.params.id, req.user.id);
    if (!notification) {
        return (0, response_1.sendError)(res, 'Notification not found', 404);
    }
    return (0, response_1.sendSuccess)(res, notification, 'Notification marked as read');
});
// Mark all notifications as read
exports.markAllAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const count = await Notification_1.NotificationModel.markAllAsRead(req.user.id);
    return (0, response_1.sendSuccess)(res, { count }, `Marked ${count} notifications as read`);
});
// Delete notification
exports.deleteNotification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const deleted = await Notification_1.NotificationModel.delete(req.params.id, req.user.id);
    if (!deleted) {
        return (0, response_1.sendError)(res, 'Notification not found', 404);
    }
    return (0, response_1.sendSuccess)(res, null, 'Notification deleted');
});
//# sourceMappingURL=notificationController.js.map