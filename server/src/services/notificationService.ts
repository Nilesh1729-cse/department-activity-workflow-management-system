import { prisma } from '../config/prisma.js';
import { NotificationType, Role } from '@prisma/client';

export class NotificationService {
  static async notifyUser(params: {
    recipientId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
  }) {
    try {
      return await prisma.notification.create({
        data: {
          recipientId: params.recipientId,
          title: params.title,
          message: params.message,
          type: params.type || NotificationType.INFO,
          link: params.link,
        },
      });
    } catch (error) {
      console.error('[NotificationService] Failed to create user notification:', error);
      return null;
    }
  }

  static async notifyRole(params: {
    role: Role;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
  }) {
    try {
      const users = await prisma.user.findMany({
        where: { role: params.role, isActive: true },
        select: { id: true },
      });

      if (!users.length) return [];

      return await prisma.notification.createMany({
        data: users.map((u) => ({
          recipientId: u.id,
          title: params.title,
          message: params.message,
          type: params.type || NotificationType.INFO,
          link: params.link,
        })),
      });
    } catch (error) {
      console.error('[NotificationService] Failed to notify role:', error);
      return [];
    }
  }
}
