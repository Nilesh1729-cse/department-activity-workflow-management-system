import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendError, sendSuccess } from '../utils/response.js';
import {
  AllocationStatus,
  ProjectStatus,
  Role,
  TaskStatus,
  WorkflowStatus,
} from '@prisma/client';

export class ReportController {
  /**
   * Get role-aware dashboard summary cards
   */
  static async getDashboardStats(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const role = req.user.role;
      const userId = req.user.userId;

      if (role === Role.ROLE_STUDENT) {
        const studentProfile = await prisma.studentProfile.findUnique({
          where: { userId },
          include: { program: true, batch: true },
        });

        const totalRequests = await prisma.request.count({ where: { studentId: userId } });
        const pendingRequests = await prisma.request.count({
          where: { studentId: userId, status: { in: [WorkflowStatus.SUBMITTED, WorkflowStatus.UNDER_REVIEW] } },
        });
        const approvedRequests = await prisma.request.count({
          where: { studentId: userId, status: WorkflowStatus.APPROVED },
        });

        const allocation = studentProfile
          ? await prisma.projectAllocation.findUnique({
              where: { studentProfileId: studentProfile.id },
              include: {
                project: {
                  include: { faculty: { select: { name: true, email: true } } },
                },
              },
            })
          : null;

        const unreadNotifications = await prisma.notification.count({
          where: { recipientId: userId, isRead: false },
        });

        return sendSuccess(res, {
          role: 'STUDENT',
          studentProfile,
          metrics: {
            totalRequests,
            pendingRequests,
            approvedRequests,
            isAllocated: allocation?.status === AllocationStatus.FINALIZED,
            unreadNotifications,
          },
          allocation,
        });
      }

      if (role === Role.ROLE_FACULTY) {
        const myProjects = await prisma.project.count({ where: { facultyId: userId } });
        const approvedProjects = await prisma.project.count({
          where: { facultyId: userId, status: { in: [ProjectStatus.APPROVED, ProjectStatus.FULL] } },
        });
        const pendingProjects = await prisma.project.count({
          where: { facultyId: userId, status: ProjectStatus.PENDING_APPROVAL },
        });
        const myActivities = await prisma.activity.count({ where: { facultyId: userId } });

        // Assigned students count
        const assignedStudents = await prisma.projectAllocation.count({
          where: {
            project: { facultyId: userId },
            status: AllocationStatus.FINALIZED,
          },
        });

        const unreadNotifications = await prisma.notification.count({
          where: { recipientId: userId, isRead: false },
        });

        return sendSuccess(res, {
          role: 'FACULTY',
          metrics: {
            myProjects,
            approvedProjects,
            pendingProjects,
            myActivities,
            assignedStudents,
            unreadNotifications,
          },
        });
      }

      // HOD or Admin Dashboard Stats
      const totalStudents = await prisma.studentProfile.count();
      const totalFaculty = await prisma.facultyProfile.count();
      const pendingApprovals = await prisma.approvalTask.count({
        where: { status: TaskStatus.PENDING },
      });
      const activeProjects = await prisma.project.count({
        where: { status: { in: [ProjectStatus.APPROVED, ProjectStatus.FULL] } },
      });
      const approvedActivities = await prisma.activity.count({
        where: { status: WorkflowStatus.APPROVED },
      });
      const allocatedStudents = await prisma.projectAllocation.count({
        where: { status: AllocationStatus.FINALIZED },
      });
      const totalUsers = await prisma.user.count();
      const departmentsCount = await prisma.department.count();
      const programsCount = await prisma.program.count();

      return sendSuccess(res, {
        role,
        metrics: {
          totalStudents,
          totalFaculty,
          pendingApprovals,
          activeProjects,
          approvedActivities,
          allocatedStudents,
          unallocatedStudents: Math.max(0, totalStudents - allocatedStudents),
          totalUsers,
          departmentsCount,
          programsCount,
        },
      });
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch dashboard stats', 500);
    }
  }

  /**
   * Analytics datasets for visualization charts
   */
  static async getAnalytics(req: Request, res: Response) {
    try {
      // 1. Student count by program
      const programs = await prisma.program.findMany({
        include: { _count: { select: { studentProfiles: true } } },
      });
      const studentsByProgram = programs.map((p) => ({
        name: p.code,
        fullName: p.name,
        count: p._count.studentProfiles,
      }));

      // 2. Request status distribution
      const requestStatuses = await prisma.request.groupBy({
        by: ['status'],
        _count: { id: true },
      });
      const requestStatusData = requestStatuses.map((r) => ({
        status: r.status,
        count: r._count.id,
      }));

      // 3. Activities by type
      const activityTypes = await prisma.activity.groupBy({
        by: ['activityType'],
        _count: { id: true },
      });
      const activityTypeData = activityTypes.map((a) => ({
        type: a.activityType.replace('_', ' '),
        count: a._count.id,
      }));

      // 4. Projects per faculty mentor
      const facultyWithProjects = await prisma.user.findMany({
        where: { role: Role.ROLE_FACULTY },
        select: {
          name: true,
          _count: { select: { projects: true } },
        },
      });
      const projectsByFaculty = facultyWithProjects.map((f) => ({
        faculty: f.name.replace('Prof. ', '').replace('Dr. ', ''),
        projects: f._count.projects,
      }));

      // 5. Allocation overview
      const totalStudents = await prisma.studentProfile.count();
      const allocated = await prisma.projectAllocation.count({
        where: { status: AllocationStatus.FINALIZED },
      });
      const allocationStatusData = [
        { name: 'Allocated', value: allocated },
        { name: 'Unallocated', value: Math.max(0, totalStudents - allocated) },
      ];

      return sendSuccess(res, {
        studentsByProgram,
        requestStatusData,
        activityTypeData,
        projectsByFaculty,
        allocationStatusData,
      });
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch analytics', 500);
    }
  }
}
