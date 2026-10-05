import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { WorkflowService } from '../services/workflowService.js';
import { Role, WorkflowEntityType, WorkflowStatus } from '@prisma/client';
import { getParam } from '../utils/params.js';

export class RequestController {
  static async listRequests(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const { status, type, search } = req.query;
      const where: any = {};

      // Role check: Students only see their own requests; HOD and Admin see department requests
      if (req.user.role === Role.ROLE_STUDENT) {
        where.studentId = req.user.userId;
      }

      if (status && Object.values(WorkflowStatus).includes(status as WorkflowStatus)) {
        where.status = status as WorkflowStatus;
      }
      if (type) {
        where.requestType = type;
      }
      if (search) {
        where.OR = [
          { title: { contains: String(search), mode: 'insensitive' } },
          { description: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      const requests = await prisma.request.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              studentProfile: { include: { program: true, batch: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return sendSuccess(res, requests);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to list requests', 500);
    }
  }

  static async getRequestById(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const id = getParam(req.params.id);

      const request = await prisma.request.findUnique({
        where: { id },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              studentProfile: { include: { program: true, batch: true } },
            },
          },
        },
      });

      if (!request) return sendError(res, 'Request not found', 404);

      // Access restriction for students
      if (req.user.role === Role.ROLE_STUDENT && request.studentId !== req.user.userId) {
        return sendError(res, 'Access denied', 403);
      }

      // Fetch workflow history and documents
      let workflowHistory: any[] = [];
      let pendingTask: any = null;

      if (request.workflowInstanceId) {
        workflowHistory = await WorkflowService.getWorkflowHistory(request.workflowInstanceId);
        pendingTask = await prisma.approvalTask.findFirst({
          where: { workflowInstanceId: request.workflowInstanceId, status: 'PENDING' },
        });
      }

      const documents = await prisma.document.findMany({
        where: { entityType: 'REQUEST', entityId: request.id },
      });

      return sendSuccess(res, {
        request,
        workflowHistory,
        pendingTask,
        documents,
      });
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get request', 500);
    }
  }

  static async createRequest(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { requestType, title, description, submitImmediately } = req.body;

      // 1. Create request record in DRAFT
      const newRequest = await prisma.request.create({
        data: {
          studentId: req.user.userId,
          requestType,
          title,
          description,
          status: WorkflowStatus.DRAFT,
          currentApprover: Role.ROLE_HOD,
        },
      });

      // 2. Initialize workflow instance
      const wfInstance = await WorkflowService.createWorkflowInstance({
        workflowCode: 'STUDENT_REQUEST',
        entityType: WorkflowEntityType.REQUEST,
        entityId: newRequest.id,
        creatorId: req.user.userId,
        initialStatus: WorkflowStatus.DRAFT,
      });

      await prisma.request.update({
        where: { id: newRequest.id },
        data: { workflowInstanceId: wfInstance.id },
      });

      // 3. If submitted immediately or requested
      if (submitImmediately) {
        await WorkflowService.submitWorkflow({
          workflowInstanceId: wfInstance.id,
          actorId: req.user.userId,
          actorRole: req.user.role,
          comments: 'Initial submission by student',
          assignedRole: Role.ROLE_HOD,
          ipAddress: req.ip,
        });
      }

      return sendSuccess(res, newRequest, 'Request created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create request', 400);
    }
  }

  static async submitRequest(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const id = getParam(req.params.id);
      const { comments } = req.body;

      const request = await prisma.request.findUnique({ where: { id } });
      if (!request) return sendError(res, 'Request not found', 404);

      if (request.studentId !== req.user.userId && req.user.role !== Role.ROLE_ADMIN) {
        return sendError(res, 'You can only submit your own requests', 403);
      }

      if (!request.workflowInstanceId) {
        return sendError(res, 'Workflow instance missing for this request', 400);
      }

      const result = await WorkflowService.submitWorkflow({
        workflowInstanceId: request.workflowInstanceId,
        actorId: req.user.userId,
        actorRole: req.user.role,
        comments: comments || 'Student submitted request for approval',
        assignedRole: Role.ROLE_HOD,
        ipAddress: req.ip,
      });

      return sendSuccess(res, result, 'Request submitted to HOD successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to submit request', 400);
    }
  }
}
