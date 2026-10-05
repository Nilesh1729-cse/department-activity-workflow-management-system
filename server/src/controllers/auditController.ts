import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendError, sendSuccess } from '../utils/response.js';

export class AuditController {
  static async listAuditLogs(req: Request, res: Response) {
    try {
      const { action, entityType, actorId, search } = req.query;
      const where: any = {};

      if (action) where.action = String(action);
      if (entityType) where.entityType = String(entityType);
      if (actorId) where.actorId = String(actorId);
      if (search) {
        where.OR = [
          { action: { contains: String(search), mode: 'insensitive' } },
          { entityType: { contains: String(search), mode: 'insensitive' } },
          { actor: { name: { contains: String(search), mode: 'insensitive' } } },
        ];
      }

      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });

      return sendSuccess(res, logs);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to list audit logs', 500);
    }
  }
}
