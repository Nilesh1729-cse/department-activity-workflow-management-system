import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { WorkflowService } from '../services/workflowService.js';
import { Role, WorkflowEntityType, WorkflowStatus } from '@prisma/client';
import { getParam } from '../utils/params.js';

export class ActivityController {
  static async listActivities(req: Request, res: Response) {
    try {
      const { status, type, departmentId, search } = req.query;
      const where: any = {};

      if (status && Object.values(WorkflowStatus).includes(status as WorkflowStatus)) {
        where.status = status as WorkflowStatus;
      }
      if (type) where.activityType = type;
      if (departmentId) where.departmentId = String(departmentId);
      if (search) {
        where.OR = [
          { title: { contains: String(search), mode: 'insensitive' } },
          { description: { contains: String(search), mode: 'insensitive' } },
          { organizer: { contains: String(search), mode: 'insensitive' } },
          { venue: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      const activities = await prisma.activity.findMany({
        where,
        include: {
          faculty: { select: { id: true, name: true, email: true } },
          department: true,
        },
        orderBy: { proposedDate: 'asc' },
      });

      return sendSuccess(res, activities);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to list activities', 500);
    }
  }

  static async getActivityById(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id);
      const activity = await prisma.activity.findUnique({
        where: { id },
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              facultyProfile: true,
            },
          },
          department: true,
        },
      });

      if (!activity) return sendError(res, 'Activity not found', 404);

      let workflowHistory: any[] = [];
      let pendingTask: any = null;

      if (activity.workflowInstanceId) {
        workflowHistory = await WorkflowService.getWorkflowHistory(activity.workflowInstanceId);
        pendingTask = await prisma.approvalTask.findFirst({
          where: { workflowInstanceId: activity.workflowInstanceId, status: 'PENDING' },
        });
      }

      const documents = await prisma.document.findMany({
        where: { entityType: 'ACTIVITY', entityId: activity.id },
      });

      return sendSuccess(res, {
        activity,
        workflowHistory,
        pendingTask,
        documents,
      });
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get activity', 500);
    }
  }

  static async createActivity(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      // Find faculty's department
      const faculty = await prisma.facultyProfile.findUnique({
        where: { userId: req.user.userId },
      });

      let departmentId = req.body.departmentId || faculty?.departmentId;
      if (!departmentId) {
        const defaultDept = await prisma.department.findFirst();
        departmentId = defaultDept?.id;
      }

      if (!departmentId) {
        return sendError(res, 'Department ID is required', 400);
      }

      const {
        title,
        activityType,
        description,
        proposedDate,
        venue,
        expectedParticipants,
        budget,
        organizer,
        remarks,
        submitImmediately,
      } = req.body;

      const activity = await prisma.activity.create({
        data: {
          departmentId,
          facultyId: req.user.userId,
          title,
          activityType,
          description,
          proposedDate: new Date(proposedDate),
          venue,
          expectedParticipants: Number(expectedParticipants) || 0,
          budget: Number(budget) || 0,
          organizer,
          remarks,
          status: WorkflowStatus.DRAFT,
        },
      });

      // Workflow instance
      const wfInstance = await WorkflowService.createWorkflowInstance({
        workflowCode: 'FACULTY_ACTIVITY',
        entityType: WorkflowEntityType.ACTIVITY,
        entityId: activity.id,
        creatorId: req.user.userId,
        initialStatus: WorkflowStatus.DRAFT,
      });

      await prisma.activity.update({
        where: { id: activity.id },
        data: { workflowInstanceId: wfInstance.id },
      });

      if (submitImmediately) {
        await WorkflowService.submitWorkflow({
          workflowInstanceId: wfInstance.id,
          actorId: req.user.userId,
          actorRole: req.user.role,
          comments: 'Initial submission of departmental activity proposal',
          assignedRole: Role.ROLE_HOD,
          ipAddress: req.ip,
        });
      }

      return sendSuccess(res, activity, 'Activity created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create activity', 400);
    }
  }

  static async submitActivity(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const id = getParam(req.params.id);
      const { comments } = req.body;

      const activity = await prisma.activity.findUnique({ where: { id } });
      if (!activity) return sendError(res, 'Activity not found', 404);

      if (activity.facultyId !== req.user.userId && req.user.role !== Role.ROLE_ADMIN) {
        return sendError(res, 'You can only submit your own activities', 403);
      }

      if (!activity.workflowInstanceId) {
        return sendError(res, 'Workflow instance missing', 400);
      }

      const result = await WorkflowService.submitWorkflow({
        workflowInstanceId: activity.workflowInstanceId,
        actorId: req.user.userId,
        actorRole: req.user.role,
        comments: comments || 'Submitted activity for HOD review',
        assignedRole: Role.ROLE_HOD,
        ipAddress: req.ip,
      });

      return sendSuccess(res, result, 'Activity submitted for HOD review successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to submit activity', 400);
    }
  }
}
