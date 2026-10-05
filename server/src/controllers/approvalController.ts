import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { WorkflowService } from '../services/workflowService.js';
import { Role, TaskStatus, WorkflowEntityType } from '@prisma/client';
import { getParam } from '../utils/params.js';

export class ApprovalController {
  /**
   * List all pending approval tasks for the logged in user / role (e.g. HOD pending queue)
   */
  static async getPendingApprovals(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const tasks = await prisma.approvalTask.findMany({
        where: {
          status: TaskStatus.PENDING,
          OR: [
            { assignedRole: req.user.role },
            { assignedUserId: req.user.userId },
            ...(req.user.role === Role.ROLE_ADMIN ? [{}] : []),
          ],
        },
        include: {
          workflowInstance: {
            include: {
              workflow: true,
              history: {
                orderBy: { timestamp: 'desc' },
                take: 1,
                include: { actor: { select: { name: true, role: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Enrich tasks with entity title & metadata
      const enrichedTasks = await Promise.all(
        tasks.map(async (task) => {
          let entityDetails: any = null;
          const { entityType, entityId } = task.workflowInstance;

          if (entityType === WorkflowEntityType.REQUEST) {
            entityDetails = await prisma.request.findUnique({
              where: { id: entityId },
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
            });
          } else if (entityType === WorkflowEntityType.ACTIVITY) {
            entityDetails = await prisma.activity.findUnique({
              where: { id: entityId },
              include: {
                faculty: { select: { id: true, name: true, email: true } },
                department: true,
              },
            });
          } else if (entityType === WorkflowEntityType.PROJECT) {
            entityDetails = await prisma.project.findUnique({
              where: { id: entityId },
              include: {
                faculty: { select: { id: true, name: true, email: true } },
                program: true,
                batch: true,
              },
            });
          }

          return {
            ...task,
            entityDetails,
          };
        })
      );

      return sendSuccess(res, enrichedTasks);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch pending approvals', 500);
    }
  }

  /**
   * Approve a task (e.g. HOD approves request, activity, or project)
   */
  static async approve(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const taskId = getParam(req.params.taskId);
      const { comments } = req.body;

      const result = await WorkflowService.approveTask({
        taskId,
        actorId: req.user.userId,
        actorRole: req.user.role,
        comments: comments || 'Approved',
        ipAddress: req.ip,
      });

      return sendSuccess(res, result, 'Task approved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to approve task', 400);
    }
  }

  /**
   * Reject a task with mandatory comments/reason
   */
  static async reject(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const taskId = getParam(req.params.taskId);
      const { comments } = req.body;

      if (!comments || comments.trim().length === 0) {
        return sendError(res, 'A reason/comment is required when rejecting a task', 400);
      }

      const result = await WorkflowService.rejectTask({
        taskId,
        actorId: req.user.userId,
        actorRole: req.user.role,
        comments,
        ipAddress: req.ip,
      });

      return sendSuccess(res, result, 'Task rejected successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to reject task', 400);
    }
  }

  /**
   * Get workflow history for a workflow instance
   */
  static async getHistory(req: Request, res: Response) {
    try {
      const instanceId = getParam(req.params.instanceId);
      const history = await WorkflowService.getWorkflowHistory(instanceId);
      return sendSuccess(res, history);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch history', 500);
    }
  }
}
