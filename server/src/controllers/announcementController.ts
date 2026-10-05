import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { AnnouncementAudience, Role } from '@prisma/client';
import { AuditService } from '../services/auditService.js';
import { getParam } from '../utils/params.js';

export class AnnouncementController {
  static async listAnnouncements(req: Request, res: Response) {
    try {
      const { priority, search } = req.query;
      const where: any = {};

      // Filter by audience if user is logged in
      if (req.user) {
        if (req.user.role === Role.ROLE_STUDENT) {
          where.audience = { in: [AnnouncementAudience.ALL, AnnouncementAudience.STUDENTS] };
        } else if (req.user.role === Role.ROLE_FACULTY) {
          where.audience = { in: [AnnouncementAudience.ALL, AnnouncementAudience.FACULTY] };
        }
      }

      if (priority) where.priority = priority;
      if (search) {
        where.OR = [
          { title: { contains: String(search), mode: 'insensitive' } },
          { content: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      const announcements = await prisma.announcement.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
        orderBy: [{ priority: 'desc' }, { publishDate: 'desc' }],
      });

      return sendSuccess(res, announcements);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to list announcements', 500);
    }
  }

  static async createAnnouncement(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { title, content, audience, priority, publishDate, expiryDate } = req.body;

      const announcement = await prisma.announcement.create({
        data: {
          authorId: req.user.userId,
          title,
          content,
          audience: audience || AnnouncementAudience.ALL,
          priority: priority || 'NORMAL',
          publishDate: publishDate ? new Date(publishDate) : new Date(),
          expiryDate: expiryDate ? new Date(expiryDate) : null,
        },
      });

      await AuditService.log({
        actorId: req.user.userId,
        actorRole: req.user.role,
        action: 'CREATE_ANNOUNCEMENT',
        entityType: 'ANNOUNCEMENT',
        entityId: announcement.id,
        newValue: { title: announcement.title, audience: announcement.audience },
        ipAddress: req.ip,
      });

      return sendSuccess(res, announcement, 'Announcement published successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create announcement', 400);
    }
  }

  static async deleteAnnouncement(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const id = getParam(req.params.id);

      const announcement = await prisma.announcement.findUnique({ where: { id } });
      if (!announcement) return sendError(res, 'Announcement not found', 404);

      if (req.user.role !== Role.ROLE_HOD && req.user.role !== Role.ROLE_ADMIN) {
        return sendError(res, 'Access denied', 403);
      }

      await prisma.announcement.delete({ where: { id } });

      await AuditService.log({
        actorId: req.user.userId,
        actorRole: req.user.role,
        action: 'DELETE_ANNOUNCEMENT',
        entityType: 'ANNOUNCEMENT',
        entityId: id,
      });

      return sendSuccess(res, null, 'Announcement deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete announcement', 500);
    }
  }
}
