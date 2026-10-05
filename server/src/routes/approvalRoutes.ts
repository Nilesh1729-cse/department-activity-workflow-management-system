import { Router } from 'express';
import { ApprovalController } from '../controllers/approvalController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAnyRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validation.js';
import { approvalActionSchema, rejectionActionSchema } from '../validators/index.js';
import { Role } from '@prisma/client';

const router = Router();

router.get(
  '/pending',
  requireAuth,
  requireAnyRole([Role.ROLE_HOD, Role.ROLE_ADMIN, Role.ROLE_FACULTY]),
  ApprovalController.getPendingApprovals
);

router.post(
  '/:taskId/approve',
  requireAuth,
  requireAnyRole([Role.ROLE_HOD, Role.ROLE_ADMIN]),
  validateBody(approvalActionSchema),
  ApprovalController.approve
);

router.post(
  '/:taskId/reject',
  requireAuth,
  requireAnyRole([Role.ROLE_HOD, Role.ROLE_ADMIN]),
  validateBody(rejectionActionSchema),
  ApprovalController.reject
);

router.get('/history/:instanceId', requireAuth, ApprovalController.getHistory);

export default router;
