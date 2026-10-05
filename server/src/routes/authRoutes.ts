import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { validateBody } from '../middleware/validation.js';
import { loginSchema } from '../validators/index.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', authLimiter, validateBody(loginSchema), AuthController.login);
router.get('/me', requireAuth, AuthController.me);
router.post('/logout', requireAuth, AuthController.logout);

export default router;
