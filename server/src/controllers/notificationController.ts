import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { getParam } from '../utils/params.js';

export class NotificationController {
  static async listNotifications(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const notifications = await prisma.notification.findMany({
        where: { recipientId: req.user.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const unreadCount = await prisma.notification.count({
        where: { recipientId: req.user.userId, isRead: false },
      });

      return sendSuccess(res, { notifications, unreadCount });
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to list notifications', 500);
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const id = getParam(req.params.id);

      const notification = await prisma.notification.findUnique({ where: { id } });
      if (!notification || notification.recipientId !== req.user.userId) {
        return sendError(res, 'Notification not found', 404);
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return sendSuccess(res, updated, 'Notification marked as read');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update notification', 500);
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      await prisma.notification.updateMany({
        where: { recipientId: req.user.userId, isRead: false },
        data: { isRead: true },
      });

      return sendSuccess(res, null, 'All notifications marked as read');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to mark all as read', 500);
    }
  }
}
