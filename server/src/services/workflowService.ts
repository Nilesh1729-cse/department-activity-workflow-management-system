import { prisma } from '../config/prisma.js';
import {
  WorkflowStatus,
  WorkflowEntityType,
  TaskStatus,
  Role,
  ProjectStatus,
  NotificationType,
} from '@prisma/client';
import { NotificationService } from './notificationService.js';
import { AuditService } from './auditService.js';

export interface WorkflowTransitionParams {
  workflowInstanceId: string;
  actorId: string;
  actorRole: Role;
  action: string;
  targetStatus: WorkflowStatus;
  comments?: string;
  ipAddress?: string;
}

export class WorkflowService {
  /**
   * Initialize a new workflow instance for an entity (Request, Activity, Project)
   */
  static async createWorkflowInstance(params: {
    workflowCode: string;
    entityType: WorkflowEntityType;
    entityId: string;
    creatorId: string;
    initialStatus?: WorkflowStatus;
  }) {
    const workflow = await prisma.workflow.findUnique({
      where: { code: params.workflowCode },
    });

    if (!workflow) {
      throw new Error(`Workflow definition not found for code: ${params.workflowCode}`);
    }

    return await prisma.workflowInstance.create({
      data: {
        workflowId: workflow.id,
        entityType: params.entityType,
        entityId: params.entityId,
        currentStatus: params.initialStatus || workflow.initialStatus,
        createdById: params.creatorId,
      },
    });
  }

  /**
   * Submit an entity to workflow (DRAFT -> SUBMITTED)
   */
  static async submitWorkflow(params: {
    workflowInstanceId: string;
    actorId: string;
    actorRole: Role;
    comments?: string;
    assignedRole?: Role;
    ipAddress?: string;
  }) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: params.workflowInstanceId },
      include: { workflow: { include: { steps: true } } },
    });

    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    if (instance.currentStatus !== WorkflowStatus.DRAFT) {
      throw new Error(`Cannot submit workflow in status: ${instance.currentStatus}`);
    }

    const previousStatus = instance.currentStatus;
    const newStatus = WorkflowStatus.SUBMITTED;
    const targetAssignedRole = params.assignedRole || Role.ROLE_HOD;

    // Execute transition in database transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Update workflow instance status
      const updatedInstance = await tx.workflowInstance.update({
        where: { id: instance.id },
        data: { currentStatus: newStatus },
      });

      // 2. Sync domain entity status
      await this.syncEntityStatus(tx, instance.entityType, instance.entityId, newStatus);

      // 3. Create approval task for approver
      const task = await tx.approvalTask.create({
        data: {
          workflowInstanceId: instance.id,
          assignedRole: targetAssignedRole,
          status: TaskStatus.PENDING,
        },
      });

      // 4. Log workflow history
      await tx.workflowHistory.create({
        data: {
          workflowInstanceId: instance.id,
          actorId: params.actorId,
          actorRole: params.actorRole,
          action: 'SUBMIT',
          previousStatus,
          newStatus,
          comments: params.comments || 'Submitted for review and approval',
        },
      });

      // 5. Notify assigned approvers (e.g. HOD)
      await NotificationService.notifyRole({
        role: targetAssignedRole,
        title: `New ${instance.entityType} Awaiting Approval`,
        message: `A new ${instance.entityType.toLowerCase()} submission requires your review.`,
        type: NotificationType.ACTION_REQUIRED,
        link: '/approvals',
      });

      // 6. Audit log
      await AuditService.log({
        actorId: params.actorId,
        actorRole: params.actorRole,
        action: `SUBMIT_${instance.entityType}`,
        entityType: instance.entityType,
        entityId: instance.entityId,
        newValue: { status: newStatus },
        ipAddress: params.ipAddress,
      });

      return { instance: updatedInstance, task };
    });
  }

  /**
   * Approve an active task in workflow
   */
  static async approveTask(params: {
    taskId: string;
    actorId: string;
    actorRole: Role;
    comments?: string;
    ipAddress?: string;
  }) {
    const task = await prisma.approvalTask.findUnique({
      where: { id: params.taskId },
      include: {
        workflowInstance: {
          include: { workflow: true },
        },
      },
    });

    if (!task) {
      throw new Error('Approval task not found');
    }

    if (task.status !== TaskStatus.PENDING) {
      throw new Error(`Task is already completed with status: ${task.status}`);
    }

    // Role check
    if (params.actorRole !== task.assignedRole && params.actorRole !== Role.ROLE_ADMIN) {
      throw new Error(
        `Unauthorized. Action requires ${task.assignedRole} role.`
      );
    }

    const previousStatus = task.workflowInstance.currentStatus;
    const newStatus = WorkflowStatus.APPROVED;

    return await prisma.$transaction(async (tx) => {
      // 1. Mark task approved
      const updatedTask = await tx.approvalTask.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.APPROVED,
          actionTaken: 'APPROVE',
          comments: params.comments || 'Approved',
          actedAt: new Date(),
          assignedUserId: params.actorId,
        },
      });

      // 2. Update workflow instance status
      const updatedInstance = await tx.workflowInstance.update({
        where: { id: task.workflowInstanceId },
        data: { currentStatus: newStatus },
      });

      // 3. Sync domain entity status
      await this.syncEntityStatus(
        tx,
        task.workflowInstance.entityType,
        task.workflowInstance.entityId,
        newStatus
      );

      // 4. Log workflow history
      await tx.workflowHistory.create({
        data: {
          workflowInstanceId: task.workflowInstanceId,
          actorId: params.actorId,
          actorRole: params.actorRole,
          action: 'APPROVE',
          previousStatus,
          newStatus,
          comments: params.comments || 'Approved by authority',
        },
      });

      // 5. Notify creator
      await NotificationService.notifyUser({
        recipientId: task.workflowInstance.createdById,
        title: `Your ${task.workflowInstance.entityType} Request Was Approved`,
        message: `Your ${task.workflowInstance.entityType.toLowerCase()} submission has been formally approved.`,
        type: NotificationType.SUCCESS,
        link: this.getEntityUrl(task.workflowInstance.entityType, task.workflowInstance.entityId),
      });

      // 6. Audit log
      await AuditService.log({
        actorId: params.actorId,
        actorRole: params.actorRole,
        action: `APPROVE_${task.workflowInstance.entityType}`,
        entityType: task.workflowInstance.entityType,
        entityId: task.workflowInstance.entityId,
        newValue: { status: newStatus, comments: params.comments },
        ipAddress: params.ipAddress,
      });

      return { task: updatedTask, instance: updatedInstance };
    });
  }

  /**
   * Reject an active task in workflow
   */
  static async rejectTask(params: {
    taskId: string;
    actorId: string;
    actorRole: Role;
    comments: string;
    ipAddress?: string;
  }) {
    if (!params.comments || params.comments.trim().length === 0) {
      throw new Error('A reason/comment is required when rejecting a request');
    }

    const task = await prisma.approvalTask.findUnique({
      where: { id: params.taskId },
      include: {
        workflowInstance: {
          include: { workflow: true },
        },
      },
    });

    if (!task) {
      throw new Error('Approval task not found');
    }

    if (task.status !== TaskStatus.PENDING) {
      throw new Error(`Task is already completed with status: ${task.status}`);
    }

    if (params.actorRole !== task.assignedRole && params.actorRole !== Role.ROLE_ADMIN) {
      throw new Error(
        `Unauthorized. Action requires ${task.assignedRole} role.`
      );
    }

    const previousStatus = task.workflowInstance.currentStatus;
    const newStatus = WorkflowStatus.REJECTED;

    return await prisma.$transaction(async (tx) => {
      // 1. Mark task rejected
      const updatedTask = await tx.approvalTask.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.REJECTED,
          actionTaken: 'REJECT',
          comments: params.comments,
          actedAt: new Date(),
          assignedUserId: params.actorId,
        },
      });

      // 2. Update workflow instance status
      const updatedInstance = await tx.workflowInstance.update({
        where: { id: task.workflowInstanceId },
        data: { currentStatus: newStatus },
      });

      // 3. Sync domain entity status
      await this.syncEntityStatus(
        tx,
        task.workflowInstance.entityType,
        task.workflowInstance.entityId,
        newStatus
      );

      // 4. Log workflow history
      await tx.workflowHistory.create({
        data: {
          workflowInstanceId: task.workflowInstanceId,
          actorId: params.actorId,
          actorRole: params.actorRole,
          action: 'REJECT',
          previousStatus,
          newStatus,
          comments: params.comments,
        },
      });

      // 5. Notify creator
      await NotificationService.notifyUser({
        recipientId: task.workflowInstance.createdById,
        title: `Your ${task.workflowInstance.entityType} Request Was Rejected`,
        message: `Reason: ${params.comments}`,
        type: NotificationType.WARNING,
        link: this.getEntityUrl(task.workflowInstance.entityType, task.workflowInstance.entityId),
      });

      // 6. Audit log
      await AuditService.log({
        actorId: params.actorId,
        actorRole: params.actorRole,
        action: `REJECT_${task.workflowInstance.entityType}`,
        entityType: task.workflowInstance.entityType,
        entityId: task.workflowInstance.entityId,
        newValue: { status: newStatus, comments: params.comments },
        ipAddress: params.ipAddress,
      });

      return { task: updatedTask, instance: updatedInstance };
    });
  }

  /**
   * Helper to synchronize status in underlying domain tables
   */
  private static async syncEntityStatus(
    tx: any,
    entityType: WorkflowEntityType,
    entityId: string,
    status: WorkflowStatus
  ) {
    if (entityType === WorkflowEntityType.REQUEST) {
      await tx.request.update({
        where: { id: entityId },
        data: { status },
      });
    } else if (entityType === WorkflowEntityType.ACTIVITY) {
      await tx.activity.update({
        where: { id: entityId },
        data: { status },
      });
    } else if (entityType === WorkflowEntityType.PROJECT) {
      const projStatus =
        status === WorkflowStatus.APPROVED
          ? ProjectStatus.APPROVED
          : status === WorkflowStatus.REJECTED
          ? ProjectStatus.REJECTED
          : status === WorkflowStatus.SUBMITTED
          ? ProjectStatus.PENDING_APPROVAL
          : ProjectStatus.DRAFT;

      await tx.project.update({
        where: { id: entityId },
        data: { status: projStatus },
      });
    }
  }

  private static getEntityUrl(entityType: WorkflowEntityType, entityId: string): string {
    switch (entityType) {
      case WorkflowEntityType.REQUEST:
        return `/requests/${entityId}`;
      case WorkflowEntityType.ACTIVITY:
        return `/activities/${entityId}`;
      case WorkflowEntityType.PROJECT:
        return `/projects/${entityId}`;
      default:
        return '/';
    }
  }

  /**
   * Get full history timeline for a workflow instance
   */
  static async getWorkflowHistory(workflowInstanceId: string) {
    return await prisma.workflowHistory.findMany({
      where: { workflowInstanceId },
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * Get pending tasks for a given role / user
   */
  static async getPendingTasks(user: { role: Role; userId: string }) {
    return await prisma.approvalTask.findMany({
      where: {
        status: TaskStatus.PENDING,
        OR: [
          { assignedRole: user.role },
          { assignedUserId: user.userId },
          ...(user.role === Role.ROLE_ADMIN ? [{}] : []),
        ],
      },
      include: {
        workflowInstance: {
          include: {
            workflow: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
