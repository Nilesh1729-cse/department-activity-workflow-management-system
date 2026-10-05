import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendError, sendSuccess } from '../utils/response.js';
import path from 'path';
import fs from 'fs';
import { getParam } from '../utils/params.js';

export class DocumentController {
  static async uploadDocument(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      if (!req.file) return sendError(res, 'No file uploaded', 400);

      const { entityType, entityId } = req.body;
      if (!entityType || !entityId) {
        return sendError(res, 'entityType and entityId are required', 400);
      }

      const doc = await prisma.document.create({
        data: {
          entityType,
          entityId,
          fileName: req.file.originalname,
          storedFileName: req.file.filename,
          filePath: req.file.path,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          uploadedById: req.user.userId,
        },
      });

      return sendSuccess(res, doc, 'Document uploaded successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to upload document', 500);
    }
  }

  static async downloadDocument(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id);
      const doc = await prisma.document.findUnique({ where: { id } });

      if (!doc) return sendError(res, 'Document not found', 404);

      if (!fs.existsSync(doc.filePath)) {
        return sendError(res, 'File missing from storage', 404);
      }

      res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
      res.setHeader('Content-Type', doc.mimeType);
      return res.sendFile(path.resolve(doc.filePath));
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to download document', 500);
    }
  }

  static async listDocuments(req: Request, res: Response) {
    try {
      const { entityType, entityId } = req.query;
      if (!entityType || !entityId) {
        return sendError(res, 'entityType and entityId required', 400);
      }

      const docs = await prisma.document.findMany({
        where: {
          entityType: String(entityType),
          entityId: String(entityId),
        },
        include: {
          uploadedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return sendSuccess(res, docs);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to list documents', 500);
    }
  }
}
