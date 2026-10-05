import { Router } from 'express';
import { ReportController } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAnyRole } from '../middleware/rbac.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/dashboard-stats', requireAuth, ReportController.getDashboardStats);
router.get(
  '/analytics',
  requireAuth,
  requireAnyRole([Role.ROLE_HOD, Role.ROLE_ADMIN, Role.ROLE_FACULTY]),
  ReportController.getAnalytics
);

export default router;
