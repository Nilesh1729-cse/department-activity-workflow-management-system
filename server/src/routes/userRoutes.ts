import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAnyRole, requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validation.js';
import { createUserSchema, updateUserSchema } from '../validators/index.js';
import { Role } from '@prisma/client';

const router = Router();

// HOD & Admin can view users list
router.get('/', requireAuth, requireAnyRole([Role.ROLE_HOD, Role.ROLE_ADMIN]), UserController.listUsers);
router.get('/:id', requireAuth, requireAnyRole([Role.ROLE_HOD, Role.ROLE_ADMIN]), UserController.getUserById);

// Admin-only mutations
router.post('/', requireAuth, requireRole(Role.ROLE_ADMIN), validateBody(createUserSchema), UserController.createUser);
router.patch('/:id', requireAuth, requireRole(Role.ROLE_ADMIN), validateBody(updateUserSchema), UserController.updateUser);
router.patch('/:id/toggle-status', requireAuth, requireRole(Role.ROLE_ADMIN), UserController.toggleActiveStatus);

export default router;
