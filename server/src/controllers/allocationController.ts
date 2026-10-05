import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { AllocationService } from '../services/allocationService.js';
import { Role } from '@prisma/client';

export class AllocationController {
  static async getOverview(req: Request, res: Response) {
    try {
      const { programId, batchId } = req.query;

      if (!programId || !batchId) {
        // Return first active program and batch if not specified
        const defaultProgram = await prisma.program.findFirst({
          include: { batches: { where: { isActive: true }, take: 1 } },
        });

        if (!defaultProgram || defaultProgram.batches.length === 0) {
          return sendSuccess(res, {
            totalStudents: 0,
            allocatedStudents: 0,
            generatedAllocations: 0,
            unallocatedStudents: 0,
            totalCapacity: 0,
            students: [],
            projects: [],
          });
        }

        const overview = await AllocationService.getAllocationOverview(
          defaultProgram.id,
          defaultProgram.batches[0].id
        );
        return sendSuccess(res, {
          ...overview,
          currentProgramId: defaultProgram.id,
          currentBatchId: defaultProgram.batches[0].id,
        });
      }

      const overview = await AllocationService.getAllocationOverview(
        String(programId),
        String(batchId)
      );
      return sendSuccess(res, overview);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch allocation overview', 500);
    }
  }

  static async generate(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { programId, batchId } = req.body;

      const results = await AllocationService.generateAllocation({
        programId,
        batchId,
        actorId: req.user.userId,
        actorRole: req.user.role,
        ipAddress: req.ip,
      });

      return sendSuccess(res, results, 'Project allocation generated successfully for preview');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to generate allocation', 400);
    }
  }

  static async finalize(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { programId, batchId } = req.body;

      const result = await AllocationService.finalizeAllocation({
        programId,
        batchId,
        actorId: req.user.userId,
        actorRole: req.user.role,
        ipAddress: req.ip,
      });

      return sendSuccess(
        res,
        result,
        `Allocation finalized successfully. ${result.finalizedCount} students have been allocated.`
      );
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to finalize allocation', 400);
    }
  }

  static async getMyAllocation(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.userId },
        include: {
          allocation: {
            include: {
              project: {
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
                },
              },
            },
          },
        },
      });

      if (!studentProfile) return sendError(res, 'Student profile not found', 404);

      return sendSuccess(res, {
        allocation: studentProfile.allocation,
        hasAllocation: !!studentProfile.allocation,
      });
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get student allocation', 500);
    }
  }
}
