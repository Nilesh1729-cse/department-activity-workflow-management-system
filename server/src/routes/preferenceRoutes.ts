import { Router } from 'express';
import { PreferenceController } from '../controllers/preferenceController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validation.js';
import { submitPreferencesSchema } from '../validators/index.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/available', requireAuth, requireRole(Role.ROLE_STUDENT), PreferenceController.getAvailableProjects);
router.get('/my-preferences', requireAuth, requireRole(Role.ROLE_STUDENT), PreferenceController.getMyPreferences);
router.post(
  '/',
  requireAuth,
  requireRole(Role.ROLE_STUDENT),
  validateBody(submitPreferencesSchema),
  PreferenceController.submitPreferences
);

export default router;
