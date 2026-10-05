import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import academicRoutes from './academicRoutes.js';
import studentRoutes from './studentRoutes.js';
import facultyRoutes from './facultyRoutes.js';
import requestRoutes from './requestRoutes.js';
import activityRoutes from './activityRoutes.js';
import approvalRoutes from './approvalRoutes.js';
import projectRoutes from './projectRoutes.js';
import preferenceRoutes from './preferenceRoutes.js';
import allocationRoutes from './allocationRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import announcementRoutes from './announcementRoutes.js';
import reportRoutes from './reportRoutes.js';
import auditRoutes from './auditRoutes.js';
import documentRoutes from './documentRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/academic', academicRoutes);
apiRouter.use('/students', studentRoutes);
apiRouter.use('/faculty', facultyRoutes);
apiRouter.use('/requests', requestRoutes);
apiRouter.use('/activities', activityRoutes);
apiRouter.use('/approvals', approvalRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/projects/preferences', preferenceRoutes);
apiRouter.use('/allocations', allocationRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/announcements', announcementRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/audit-logs', auditRoutes);
apiRouter.use('/documents', documentRoutes);

export default apiRouter;
