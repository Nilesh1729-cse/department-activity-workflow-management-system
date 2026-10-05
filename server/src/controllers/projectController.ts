import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { WorkflowService } from '../services/workflowService.js';
import { ProjectStatus, Role, WorkflowEntityType, WorkflowStatus } from '@prisma/client';
import { getParam } from '../utils/params.js';

export class ProjectController {
  static async listProjects(req: Request, res: Response) {
    try {
      const { programId, batchId, status, difficulty, domain, search, myProjects } = req.query;
      const where: any = {};

      // If user is student, restrict to their program/batch and approved projects only
      if (req.user?.role === Role.ROLE_STUDENT) {
        const studentProfile = await prisma.studentProfile.findUnique({
          where: { userId: req.user.userId },
        });

        if (studentProfile) {
          where.programId = studentProfile.programId;
          where.batchId = studentProfile.batchId;
        }

        where.status = { in: [ProjectStatus.APPROVED, ProjectStatus.FULL] };
      } else {
        // For faculty/HOD/Admin
        if (myProjects === 'true' && req.user?.role === Role.ROLE_FACULTY) {
          where.facultyId = req.user.userId;
        }
        if (status && Object.values(ProjectStatus).includes(status as ProjectStatus)) {
          where.status = status as ProjectStatus;
        }
      }

      if (programId) where.programId = String(programId);
      if (batchId) where.batchId = String(batchId);
      if (difficulty) where.difficulty = difficulty;
      if (domain) where.domain = { contains: String(domain), mode: 'insensitive' };
      if (search) {
        where.OR = [
          { title: { contains: String(search), mode: 'insensitive' } },
          { projectCode: { contains: String(search), mode: 'insensitive' } },
          { description: { contains: String(search), mode: 'insensitive' } },
          { technologies: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      const projects = await prisma.project.findMany({
        where,
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              email: true,
              facultyProfile: { select: { designation: true, specialization: true } },
            },
          },
          program: true,
          batch: true,
          _count: { select: { allocations: true, preferences: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return sendSuccess(res, projects);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to list projects', 500);
    }
  }

  static async getProjectById(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id);
      const project = await prisma.project.findUnique({
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
          program: true,
          batch: true,
          allocations: {
            include: {
              studentProfile: {
                include: {
                  user: { select: { name: true, email: true, phone: true } },
                },
              },
            },
          },
        },
      });

      if (!project) return sendError(res, 'Project not found', 404);

      let workflowHistory: any[] = [];
      let pendingTask: any = null;

      if (project.workflowInstanceId) {
        workflowHistory = await WorkflowService.getWorkflowHistory(project.workflowInstanceId);
        pendingTask = await prisma.approvalTask.findFirst({
          where: { workflowInstanceId: project.workflowInstanceId, status: 'PENDING' },
        });
      }

      return sendSuccess(res, {
        project,
        workflowHistory,
        pendingTask,
      });
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get project', 500);
    }
  }

  static async createProject(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const facultyProfile = await prisma.facultyProfile.findUnique({
        where: { userId: req.user.userId },
      });

      let departmentId = req.body.departmentId || facultyProfile?.departmentId;
      if (!departmentId) {
        const defaultDept = await prisma.department.findFirst();
        departmentId = defaultDept?.id;
      }

      const {
        programId,
        batchId,
        title,
        projectCode,
        description,
        domain,
        technologies,
        difficulty,
        maxStudents,
        submitImmediately,
      } = req.body;

      // Check unique project code
      const existingCode = await prisma.project.findUnique({
        where: { projectCode: projectCode.toUpperCase() },
      });

      if (existingCode) {
        return sendError(res, 'Project code already exists. Please use a unique project code.', 400);
      }

      const project = await prisma.project.create({
        data: {
          facultyId: req.user.userId,
          departmentId: departmentId!,
          programId,
          batchId,
          title,
          projectCode: projectCode.toUpperCase(),
          description,
          domain,
          technologies,
          difficulty,
          maxStudents: Number(maxStudents) || 2,
          allocatedCount: 0,
          status: ProjectStatus.DRAFT,
        },
      });

      // Create workflow instance
      const wfInstance = await WorkflowService.createWorkflowInstance({
        workflowCode: 'PROJECT_PROPOSAL',
        entityType: WorkflowEntityType.PROJECT,
        entityId: project.id,
        creatorId: req.user.userId,
        initialStatus: WorkflowStatus.DRAFT,
      });

      await prisma.project.update({
        where: { id: project.id },
        data: { workflowInstanceId: wfInstance.id },
      });

      if (submitImmediately) {
        await WorkflowService.submitWorkflow({
          workflowInstanceId: wfInstance.id,
          actorId: req.user.userId,
          actorRole: req.user.role,
          comments: 'Initial submission of project proposal by faculty mentor',
          assignedRole: Role.ROLE_HOD,
          ipAddress: req.ip,
        });
      }

      return sendSuccess(res, project, 'Project proposal created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create project', 400);
    }
  }

  static async submitProject(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const id = getParam(req.params.id);
      const { comments } = req.body;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) return sendError(res, 'Project not found', 404);

      if (project.facultyId !== req.user.userId && req.user.role !== Role.ROLE_ADMIN) {
        return sendError(res, 'You can only submit your own project proposals', 403);
      }

      if (!project.workflowInstanceId) {
        return sendError(res, 'Workflow instance missing', 400);
      }

      const result = await WorkflowService.submitWorkflow({
        workflowInstanceId: project.workflowInstanceId,
        actorId: req.user.userId,
        actorRole: req.user.role,
        comments: comments || 'Faculty submitted project proposal for HOD review',
        assignedRole: Role.ROLE_HOD,
        ipAddress: req.ip,
      });

      return sendSuccess(res, result, 'Project proposal submitted for HOD review successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to submit project', 400);
    }
  }
}
