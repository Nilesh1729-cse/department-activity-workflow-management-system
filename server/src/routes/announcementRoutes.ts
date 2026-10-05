import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcementController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAnyRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validation.js';
import { createAnnouncementSchema } from '../validators/index.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', requireAuth, AnnouncementController.listAnnouncements);
router.post(
  '/',
  requireAuth,
  requireAnyRole([Role.ROLE_HOD, Role.ROLE_ADMIN]),
  validateBody(createAnnouncementSchema),
  AnnouncementController.createAnnouncement
);
router.delete('/:id', requireAuth, requireAnyRole([Role.ROLE_HOD, Role.ROLE_ADMIN]), AnnouncementController.deleteAnnouncement);

export default router;
