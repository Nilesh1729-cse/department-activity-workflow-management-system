import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendError, sendSuccess } from './utils/response.js';

export const createApp = () => {
  const app = express();

  // Basic security and parsing middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static files for uploads
  const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  app.use('/uploads', express.static(uploadDir));

  // Swagger Documentation endpoint
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Department Activity & Workflow API Docs',
  }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    sendSuccess(res, {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Department Activity & Workflow Management System',
      version: '1.0.0',
    }, 'Service is healthy');
  });

  // Mount API router
  app.use('/api', apiRouter);

  // 404 Handler
  app.use((req, res) => {
    sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
