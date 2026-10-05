import { prisma } from '../config/prisma.js';

export interface AuditLogParams {
  actorId?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static async log(params: AuditLogParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          actorId: params.actorId,
          actorRole: params.actorRole,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
          newValue: params.newValue ? JSON.stringify(params.newValue) : null,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      console.error('[AuditService] Failed to record audit log:', error);
      // Non-blocking so audit failures do not crash the primary transaction
      return null;
    }
  }
}
