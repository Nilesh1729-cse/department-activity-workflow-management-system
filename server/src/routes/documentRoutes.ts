import { Router } from 'express';
import { DocumentController } from '../controllers/documentController.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.get('/', requireAuth, DocumentController.listDocuments);
router.post('/upload', requireAuth, uploadMiddleware.single('file'), DocumentController.uploadDocument);
router.get('/:id/download', DocumentController.downloadDocument);

export default router;
