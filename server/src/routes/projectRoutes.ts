import { Router } from 'express';
import { ProjectController } from '../controllers/projectController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAnyRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validation.js';
import { createProjectSchema, updateProjectSchema } from '../validators/index.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', requireAuth, ProjectController.listProjects);
router.get('/:id', requireAuth, ProjectController.getProjectById);
router.post(
  '/',
  requireAuth,
  requireAnyRole([Role.ROLE_FACULTY, Role.ROLE_HOD, Role.ROLE_ADMIN]),
  validateBody(createProjectSchema),
  ProjectController.createProject
);
router.post('/:id/submit', requireAuth, ProjectController.submitProject);

export default router;
