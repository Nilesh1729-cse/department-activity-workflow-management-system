import { Router } from 'express';
import { AcademicController } from '../controllers/academicController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validation.js';
import {
  createDepartmentSchema,
  createProgramSchema,
  createBatchSchema,
} from '../validators/index.js';
import { Role } from '@prisma/client';

const router = Router();

// Public / Authenticated read access
router.get('/departments', requireAuth, AcademicController.listDepartments);
router.get('/programs', requireAuth, AcademicController.listPrograms);
router.get('/batches', requireAuth, AcademicController.listBatches);

// Admin-only creation
router.post('/departments', requireAuth, requireRole(Role.ROLE_ADMIN), validateBody(createDepartmentSchema), AcademicController.createDepartment);
router.post('/programs', requireAuth, requireRole(Role.ROLE_ADMIN), validateBody(createProgramSchema), AcademicController.createProgram);
router.post('/batches', requireAuth, requireRole(Role.ROLE_ADMIN), validateBody(createBatchSchema), AcademicController.createBatch);

export default router;
