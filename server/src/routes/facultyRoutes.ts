import { Router } from 'express';
import { FacultyController } from '../controllers/facultyController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', requireAuth, FacultyController.listFaculty);
router.get('/my-students', requireAuth, requireRole(Role.ROLE_FACULTY), FacultyController.getMyAssignedStudents);
router.get('/:id', requireAuth, FacultyController.getFacultyById);

export default router;
