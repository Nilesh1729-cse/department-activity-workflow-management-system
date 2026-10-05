import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { getParam } from '../utils/params.js';

export class StudentController {
  static async listStudents(req: Request, res: Response) {
    try {
      const { programId, batchId, search } = req.query;
      const where: any = {};

      if (programId) where.programId = String(programId);
      if (batchId) where.batchId = String(batchId);
      if (search) {
        where.OR = [
          { rollNumber: { contains: String(search), mode: 'insensitive' } },
          { user: { name: { contains: String(search), mode: 'insensitive' } } },
          { user: { email: { contains: String(search), mode: 'insensitive' } } },
        ];
      }

      const students = await prisma.studentProfile.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
          program: { include: { department: true } },
          batch: true,
          allocation: {
            include: {
              project: {
                include: { faculty: { select: { id: true, name: true, email: true } } },
              },
            },
          },
          _count: { select: { preferences: true } },
        },
        orderBy: [{ batch: { startYear: 'desc' } }, { rollNumber: 'asc' }],
      });

      return sendSuccess(res, students);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to list students', 500);
    }
  }

  static async getStudentById(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id);
      const student = await prisma.studentProfile.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
          program: { include: { department: true } },
          batch: true,
          preferences: {
            orderBy: { rank: 'asc' },
            include: { project: true },
          },
          allocation: {
            include: {
              project: {
                include: { faculty: { select: { id: true, name: true, email: true } } },
              },
            },
          },
        },
      });

      if (!student) return sendError(res, 'Student not found', 404);
      return sendSuccess(res, student);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get student', 500);
    }
  }
}
