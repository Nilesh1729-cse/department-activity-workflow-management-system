import { prisma } from '../config/prisma.js';
import { AllocationStatus, NotificationType, ProjectStatus, Role } from '@prisma/client';
import { NotificationService } from './notificationService.js';
import { AuditService } from './auditService.js';

export interface AllocationResultItem {
  studentProfileId: string;
  studentName: string;
  rollNumber: string;
  cgpa: number | null;
  projectId: string | null;
  projectCode: string | null;
  projectTitle: string | null;
  preferenceRank: number | null;
  status: AllocationStatus;
  allocationReason: string;
}

export class AllocationService {
  /**
   * Run the deterministic preference-based project allocation algorithm
   */
  static async generateAllocation(params: {
    programId: string;
    batchId: string;
    actorId: string;
    actorRole: Role;
    ipAddress?: string;
  }): Promise<AllocationResultItem[]> {
    // 1. Fetch all student profiles in the specified program & batch
    const students = await prisma.studentProfile.findMany({
      where: {
        programId: params.programId,
        batchId: params.batchId,
        user: { isActive: true },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        preferences: {
          orderBy: { rank: 'asc' },
          include: { project: true },
        },
        allocation: true,
      },
      // Deterministic ordering: CGPA descending, then rollNumber ascending
      orderBy: [{ cgpa: 'desc' }, { rollNumber: 'asc' }],
    });

    if (students.length === 0) {
      throw new Error('No active students found in the specified program and batch.');
    }

    // 2. Fetch approved projects available for this program & batch
    const projects = await prisma.project.findMany({
      where: {
        programId: params.programId,
        batchId: params.batchId,
        status: ProjectStatus.APPROVED,
      },
      include: {
        faculty: { select: { id: true, name: true } },
      },
    });

    if (projects.length === 0) {
      throw new Error('No approved projects available for this program and batch.');
    }

    // Track simulated capacity per project
    const projectCapacityMap = new Map<string, { max: number; current: number; project: any }>();
    for (const proj of projects) {
      projectCapacityMap.set(proj.id, {
        max: proj.maxStudents,
        current: 0,
        project: proj,
      });
    }

    const results: AllocationResultItem[] = [];

    // 3. Deterministic Greedy Allocation Loop
    for (const student of students) {
      let allocated = false;

      // Check if student submitted preferences
      if (student.preferences && student.preferences.length > 0) {
        for (const pref of student.preferences) {
          const capInfo = projectCapacityMap.get(pref.projectId);
          if (capInfo && capInfo.current < capInfo.max) {
            // Assign to this preferred project
            capInfo.current += 1;
            allocated = true;

            results.push({
              studentProfileId: student.id,
              studentName: student.user.name,
              rollNumber: student.rollNumber,
              cgpa: student.cgpa,
              projectId: capInfo.project.id,
              projectCode: capInfo.project.projectCode,
              projectTitle: capInfo.project.title,
              preferenceRank: pref.rank,
              status: AllocationStatus.GENERATED,
              allocationReason: `Assigned Preference #${pref.rank} based on academic merit (CGPA: ${student.cgpa ?? 'N/A'})`,
            });
            break;
          }
        }
      }

      if (!allocated) {
        results.push({
          studentProfileId: student.id,
          studentName: student.user.name,
          rollNumber: student.rollNumber,
          cgpa: student.cgpa,
          projectId: null,
          projectCode: null,
          projectTitle: null,
          preferenceRank: null,
          status: AllocationStatus.DRAFT,
          allocationReason: student.preferences.length === 0
            ? 'No preferences submitted by student'
            : 'All selected preferred projects reached capacity',
        });
      }
    }

    // 4. Upsert allocations in GENERATED status (draft preview for HOD review)
    await prisma.$transaction(async (tx) => {
      for (const item of results) {
        if (item.projectId) {
          await tx.projectAllocation.upsert({
            where: { studentProfileId: item.studentProfileId },
            update: {
              projectId: item.projectId,
              status: AllocationStatus.GENERATED,
              allocatedById: params.actorId,
              allocationReason: item.allocationReason,
            },
            create: {
              studentProfileId: item.studentProfileId,
              projectId: item.projectId,
              status: AllocationStatus.GENERATED,
              allocatedById: params.actorId,
              allocationReason: item.allocationReason,
            },
          });
        }
      }
    });

    await AuditService.log({
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: 'GENERATE_ALLOCATION',
      entityType: 'PROJECT_ALLOCATION',
      newValue: {
        programId: params.programId,
        batchId: params.batchId,
        totalStudents: students.length,
        allocatedCount: results.filter((r) => r.projectId !== null).length,
      },
      ipAddress: params.ipAddress,
    });

    return results;
  }

  /**
   * Finalize project allocation (HOD / Admin confirms and activates assignments)
   */
  static async finalizeAllocation(params: {
    programId: string;
    batchId: string;
    actorId: string;
    actorRole: Role;
    ipAddress?: string;
  }) {
    // Role check: Only HOD or Admin can finalize allocations
    if (params.actorRole !== Role.ROLE_HOD && params.actorRole !== Role.ROLE_ADMIN) {
      throw new Error('Only the Head of Department or Administrator can finalize allocations.');
    }

    // Find all generated allocations for this program and batch
    const allocations = await prisma.projectAllocation.findMany({
      where: {
        studentProfile: {
          programId: params.programId,
          batchId: params.batchId,
        },
        status: { in: [AllocationStatus.GENERATED, AllocationStatus.HOD_REVIEW, AllocationStatus.DRAFT] },
      },
      include: {
        project: { include: { faculty: true } },
        studentProfile: { include: { user: true } },
      },
    });

    if (allocations.length === 0) {
      throw new Error('No pending or generated allocations found to finalize for this batch.');
    }

    // Finalize within database transaction
    await prisma.$transaction(async (tx) => {
      // 1. Mark all allocations as FINALIZED
      for (const alloc of allocations) {
        await tx.projectAllocation.update({
          where: { id: alloc.id },
          data: {
            status: AllocationStatus.FINALIZED,
            allocatedById: params.actorId,
            allocatedAt: new Date(),
          },
        });
      }

      // 2. Recalculate allocated count on projects
      const projectIds = Array.from(new Set(allocations.map((a) => a.projectId)));
      for (const pid of projectIds) {
        const count = await tx.projectAllocation.count({
          where: { projectId: pid, status: AllocationStatus.FINALIZED },
        });

        const proj = await tx.project.findUnique({ where: { id: pid } });
        const isFull = proj && count >= proj.maxStudents;

        await tx.project.update({
          where: { id: pid },
          data: {
            allocatedCount: count,
            ...(isFull && { status: ProjectStatus.FULL }),
          },
        });
      }
    });

    // 3. Dispatch notifications to all allocated students and faculty mentors
    for (const alloc of allocations) {
      // Student notification
      await NotificationService.notifyUser({
        recipientId: alloc.studentProfile.userId,
        title: 'Project Allocation Finalized',
        message: `You have been officially allocated to ${alloc.project.projectCode}: ${alloc.project.title}. Faculty Mentor: ${alloc.project.faculty.name}.`,
        type: NotificationType.SUCCESS,
        link: '/projects/my-allocation',
      });

      // Faculty mentor notification
      await NotificationService.notifyUser({
        recipientId: alloc.project.facultyId,
        title: 'New Student Allocated to Your Project',
        message: `${alloc.studentProfile.user.name} (${alloc.studentProfile.rollNumber}) has been assigned to ${alloc.project.projectCode}.`,
        type: NotificationType.INFO,
        link: '/faculty/my-students',
      });
    }

    await AuditService.log({
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: 'FINALIZE_ALLOCATION',
      entityType: 'PROJECT_ALLOCATION',
      newValue: {
        programId: params.programId,
        batchId: params.batchId,
        finalizedCount: allocations.length,
      },
      ipAddress: params.ipAddress,
    });

    return { finalizedCount: allocations.length };
  }

  /**
   * Get detailed allocation overview for a program and batch
   */
  static async getAllocationOverview(programId: string, batchId: string) {
    const students = await prisma.studentProfile.findMany({
      where: { programId, batchId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        preferences: {
          orderBy: { rank: 'asc' },
          include: { project: { select: { id: true, projectCode: true, title: true } } },
        },
        allocation: {
          include: {
            project: {
              include: { faculty: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
      orderBy: [{ cgpa: 'desc' }, { rollNumber: 'asc' }],
    });

    const projects = await prisma.project.findMany({
      where: { programId, batchId, status: { in: [ProjectStatus.APPROVED, ProjectStatus.FULL] } },
      include: {
        faculty: { select: { id: true, name: true, email: true } },
        allocations: {
          include: {
            studentProfile: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
    });

    const totalStudents = students.length;
    const allocatedStudents = students.filter((s) => s.allocation?.status === AllocationStatus.FINALIZED).length;
    const generatedAllocations = students.filter((s) => s.allocation?.status === AllocationStatus.GENERATED).length;
    const totalCapacity = projects.reduce((acc, p) => acc + p.maxStudents, 0);

    return {
      totalStudents,
      allocatedStudents,
      generatedAllocations,
      unallocatedStudents: totalStudents - allocatedStudents,
      totalCapacity,
      students,
      projects,
    };
  }
}
