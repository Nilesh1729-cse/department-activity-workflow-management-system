import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { AuditService } from '../services/auditService.js';

export class AcademicController {
  // Departments
  static async listDepartments(req: Request, res: Response) {
    try {
      const departments = await prisma.department.findMany({
        include: {
          programs: {
            include: { batches: true },
          },
          _count: {
            select: { faculty: true, activities: true, projects: true },
          },
        },
        orderBy: { name: 'asc' },
      });
      return sendSuccess(res, departments);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to list departments', 500);
    }
  }

  static async createDepartment(req: Request, res: Response) {
    try {
      const { name, code, description } = req.body;
      const dept = await prisma.department.create({
        data: { name, code: code.toUpperCase(), description },
      });

      await AuditService.log({
        actorId: req.user?.userId,
        actorRole: req.user?.role,
        action: 'CREATE_DEPARTMENT',
        entityType: 'DEPARTMENT',
        entityId: dept.id,
        newValue: { name: dept.name, code: dept.code },
      });

      return sendSuccess(res, dept, 'Department created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create department', 400);
    }
  }

  // Programs
  static async listPrograms(req: Request, res: Response) {
    try {
      const { departmentId, level } = req.query;
      const where: any = {};
      if (departmentId) where.departmentId = String(departmentId);
      if (level) where.level = level;

      const programs = await prisma.program.findMany({
        where,
        include: {
          department: true,
          batches: { orderBy: { startYear: 'desc' } },
          _count: { select: { studentProfiles: true, projects: true } },
        },
        orderBy: { name: 'asc' },
      });
      return sendSuccess(res, programs);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to list programs', 500);
    }
  }

  static async createProgram(req: Request, res: Response) {
    try {
      const { departmentId, name, code, level, durationYears } = req.body;
      const program = await prisma.program.create({
        data: {
          departmentId,
          name,
          code: code.toUpperCase(),
          level,
          durationYears: durationYears || 4,
        },
      });

      await AuditService.log({
        actorId: req.user?.userId,
        actorRole: req.user?.role,
        action: 'CREATE_PROGRAM',
        entityType: 'PROGRAM',
        entityId: program.id,
        newValue: { name: program.name, code: program.code },
      });

      return sendSuccess(res, program, 'Program created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create program', 400);
    }
  }

  // Batches
  static async listBatches(req: Request, res: Response) {
    try {
      const { programId, isActive } = req.query;
      const where: any = {};
      if (programId) where.programId = String(programId);
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const batches = await prisma.batch.findMany({
        where,
        include: {
          program: { include: { department: true } },
          _count: { select: { studentProfiles: true, projects: true } },
        },
        orderBy: { startYear: 'desc' },
      });
      return sendSuccess(res, batches);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to list batches', 500);
    }
  }

  static async createBatch(req: Request, res: Response) {
    try {
      const { programId, name, startYear, endYear, isActive } = req.body;
      const batch = await prisma.batch.create({
        data: {
          programId,
          name,
          startYear,
          endYear,
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      await AuditService.log({
        actorId: req.user?.userId,
        actorRole: req.user?.role,
        action: 'CREATE_BATCH',
        entityType: 'BATCH',
        entityId: batch.id,
        newValue: { name: batch.name, startYear, endYear },
      });

      return sendSuccess(res, batch, 'Batch created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create batch', 400);
    }
  }
}
