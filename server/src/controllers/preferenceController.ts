import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { AllocationStatus, ProjectStatus } from '@prisma/client';
import { AuditService } from '../services/auditService.js';

export class PreferenceController {
  /**
   * Get list of approved projects available for the student to select
   */
  static async getAvailableProjects(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.userId },
        include: { program: true, batch: true },
      });

      if (!studentProfile) {
        return sendError(res, 'Student profile not found', 404);
      }

      // Check if student already has a finalized allocation
      const existingAllocation = await prisma.projectAllocation.findUnique({
        where: { studentProfileId: studentProfile.id },
      });

      const isFinalized = existingAllocation?.status === AllocationStatus.FINALIZED;

      const projects = await prisma.project.findMany({
        where: {
          programId: studentProfile.programId,
          batchId: studentProfile.batchId,
          status: { in: [ProjectStatus.APPROVED, ProjectStatus.FULL] },
        },
        include: {
          faculty: {
            select: {
              name: true,
              email: true,
              facultyProfile: { select: { designation: true, specialization: true } },
            },
          },
        },
        orderBy: { projectCode: 'asc' },
      });

      // Get current student preferences
      const preferences = await prisma.projectPreference.findMany({
        where: { studentProfileId: studentProfile.id },
        orderBy: { rank: 'asc' },
        include: { project: true },
      });

      return sendSuccess(res, {
        student: {
          rollNumber: studentProfile.rollNumber,
          program: studentProfile.program.name,
          batch: studentProfile.batch.name,
        },
        projects,
        preferences,
        isFinalized,
      });
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch available projects', 500);
    }
  }

  /**
   * Submit or update ranked project preferences
   */
  static async submitPreferences(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.userId },
      });

      if (!studentProfile) {
        return sendError(res, 'Student profile not found', 404);
      }

      // Check if student allocation is already finalized
      const existingAllocation = await prisma.projectAllocation.findUnique({
        where: { studentProfileId: studentProfile.id },
      });

      if (existingAllocation?.status === AllocationStatus.FINALIZED) {
        return sendError(res, 'Cannot change preferences after project allocation has been finalized', 400);
      }

      const { preferences } = req.body; // array of { projectId, rank }

      // Validate all selected projects belong to student's program and batch
      const projectIds = preferences.map((p: any) => p.projectId);
      const validProjects = await prisma.project.findMany({
        where: {
          id: { in: projectIds },
          programId: studentProfile.programId,
          batchId: studentProfile.batchId,
          status: { in: [ProjectStatus.APPROVED, ProjectStatus.FULL] },
        },
      });

      if (validProjects.length !== projectIds.length) {
        return sendError(res, 'One or more selected projects are invalid or belong to another program/batch', 400);
      }

      // Atomic replace of preferences
      await prisma.$transaction(async (tx) => {
        await tx.projectPreference.deleteMany({
          where: { studentProfileId: studentProfile.id },
        });

        await tx.projectPreference.createMany({
          data: preferences.map((p: any) => ({
            studentProfileId: studentProfile.id,
            projectId: p.projectId,
            rank: p.rank,
          })),
        });
      });

      await AuditService.log({
        actorId: req.user.userId,
        actorRole: req.user.role,
        action: 'SUBMIT_PREFERENCES',
        entityType: 'PROJECT_PREFERENCE',
        entityId: studentProfile.id,
        newValue: { preferencesCount: preferences.length },
        ipAddress: req.ip,
      });

      const updatedPrefs = await prisma.projectPreference.findMany({
        where: { studentProfileId: studentProfile.id },
        orderBy: { rank: 'asc' },
        include: { project: true },
      });

      return sendSuccess(res, updatedPrefs, 'Project preferences saved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to submit preferences', 400);
    }
  }

  /**
   * Get student's current preferences
   */
  static async getMyPreferences(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.userId },
      });

      if (!studentProfile) return sendError(res, 'Student profile not found', 404);

      const preferences = await prisma.projectPreference.findMany({
        where: { studentProfileId: studentProfile.id },
        orderBy: { rank: 'asc' },
        include: {
          project: {
            include: { faculty: { select: { id: true, name: true, email: true } } },
          },
        },
      });

      return sendSuccess(res, preferences);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch preferences', 500);
    }
  }
}
