import { Router } from 'express';
import { ActivityController } from '../controllers/activityController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAnyRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validation.js';
import { createActivitySchema } from '../validators/index.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', requireAuth, ActivityController.listActivities);
router.get('/:id', requireAuth, ActivityController.getActivityById);
router.post(
  '/',
  requireAuth,
  requireAnyRole([Role.ROLE_FACULTY, Role.ROLE_HOD]),
  validateBody(createActivitySchema),
  ActivityController.createActivity
);
router.post('/:id/submit', requireAuth, ActivityController.submitActivity);

export default router;
