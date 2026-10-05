import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, NotificationController.listNotifications);
router.patch('/read-all', requireAuth, NotificationController.markAllAsRead);
router.patch('/:id/read', requireAuth, NotificationController.markAsRead);

export default router;
