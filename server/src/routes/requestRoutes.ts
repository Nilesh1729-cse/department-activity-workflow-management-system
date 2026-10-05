import { Router } from 'express';
import { RequestController } from '../controllers/requestController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validation.js';
import { createRequestSchema } from '../validators/index.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', requireAuth, RequestController.listRequests);
router.get('/:id', requireAuth, RequestController.getRequestById);
router.post('/', requireAuth, requireRole(Role.ROLE_STUDENT), validateBody(createRequestSchema), RequestController.createRequest);
router.post('/:id/submit', requireAuth, RequestController.submitRequest);

export default router;
