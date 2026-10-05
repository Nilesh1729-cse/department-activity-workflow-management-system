import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { AllocationStatus, ProjectStatus } from '@prisma/client';
import { getParam } from '../utils/params.js';

export class FacultyController {
  static async listFaculty(req: Request, res: Response) {
    try {
      const { departmentId, search } = req.query;
      const where: any = {};

      if (departmentId) where.departmentId = String(departmentId);
      if (search) {
        where.OR = [
          { employeeId: { contains: String(search), mode: 'insensitive' } },
          { user: { name: { contains: String(search), mode: 'insensitive' } } },
          { specialization: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      const facultyList = await prisma.facultyProfile.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, role: true, isActive: true } },
          department: true,
        },
        orderBy: { employeeId: 'asc' },
      });

      return sendSuccess(res, facultyList);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to list faculty', 500);
    }
  }

  static async getFacultyById(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id);
      const faculty = await prisma.facultyProfile.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              isActive: true,
              projects: {
                where: { status: { in: [ProjectStatus.APPROVED, ProjectStatus.FULL] } },
                include: {
                  allocations: {
                    where: { status: AllocationStatus.FINALIZED },
                    include: {
                      studentProfile: {
                        include: { user: { select: { name: true, email: true } }, program: true },
                      },
                    },
                  },
                },
              },
            },
          },
          department: true,
        },
      });

      if (!faculty) return sendError(res, 'Faculty not found', 404);
      return sendSuccess(res, faculty);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get faculty', 500);
    }
  }

  static async getMyAssignedStudents(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      // Find projects owned by this faculty
      const projects = await prisma.project.findMany({
        where: { facultyId: req.user.userId },
        include: {
          program: true,
          batch: true,
          allocations: {
            where: { status: AllocationStatus.FINALIZED },
            include: {
              studentProfile: {
                include: {
                  user: { select: { id: true, name: true, email: true, phone: true } },
                  program: true,
                  batch: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Flatten list of assigned students
      const assignedStudents = projects.flatMap((p) =>
        p.allocations.map((a) => ({
          allocationId: a.id,
          projectCode: p.projectCode,
          projectTitle: p.title,
          student: a.studentProfile,
          allocatedAt: a.allocatedAt,
          allocationReason: a.allocationReason,
        }))
      );

      return sendSuccess(res, { projects, assignedStudents });
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch assigned students', 500);
    }
  }
}
