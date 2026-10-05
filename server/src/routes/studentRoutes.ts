import { Router } from 'express';
import { StudentController } from '../controllers/studentController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAnyRole } from '../middleware/rbac.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', requireAuth, requireAnyRole([Role.ROLE_FACULTY, Role.ROLE_HOD, Role.ROLE_ADMIN]), StudentController.listStudents);
router.get('/:id', requireAuth, StudentController.getStudentById);

export default router;
