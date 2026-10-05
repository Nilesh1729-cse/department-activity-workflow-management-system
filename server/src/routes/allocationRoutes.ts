import { Router } from 'express';
import { AllocationController } from '../controllers/allocationController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAnyRole, requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validation.js';
import { generateAllocationSchema } from '../validators/index.js';
import { Role } from '@prisma/client';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireAnyRole([Role.ROLE_HOD, Role.ROLE_ADMIN, Role.ROLE_FACULTY]),
  AllocationController.getOverview
);

router.post(
  '/generate',
  requireAuth,
  requireAnyRole([Role.ROLE_HOD, Role.ROLE_ADMIN]),
  validateBody(generateAllocationSchema),
  AllocationController.generate
);

router.post(
  '/finalize',
  requireAuth,
  requireAnyRole([Role.ROLE_HOD, Role.ROLE_ADMIN]),
  validateBody(generateAllocationSchema),
  AllocationController.finalize
);

router.get(
  '/my-allocation',
  requireAuth,
  requireRole(Role.ROLE_STUDENT),
  AllocationController.getMyAllocation
);

export default router;
