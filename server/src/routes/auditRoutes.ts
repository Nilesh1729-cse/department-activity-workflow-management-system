import { Router } from 'express';
import { AuditController } from '../controllers/auditController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAnyRole } from '../middleware/rbac.js';
import { Role } from '@prisma/client';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireAnyRole([Role.ROLE_HOD, Role.ROLE_ADMIN]),
  AuditController.listAuditLogs
);

export default router;
