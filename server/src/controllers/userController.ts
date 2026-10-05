import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { hashPassword } from '../utils/password.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { Role } from '@prisma/client';
import { AuditService } from '../services/auditService.js';
import { getParam } from '../utils/params.js';

export class UserController {
  static async listUsers(req: Request, res: Response) {
    try {
      const { role, search, isActive } = req.query;

      const where: any = {};
      if (role && Object.values(Role).includes(role as Role)) {
        where.role = role as Role;
      }
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }
      if (search) {
        where.OR = [
          { name: { contains: String(search), mode: 'insensitive' } },
          { email: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          studentProfile: {
            include: { program: true, batch: true },
          },
          facultyProfile: {
            include: { department: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return sendSuccess(res, users);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to list users', 500);
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id);
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          studentProfile: {
            include: { program: true, batch: true },
          },
          facultyProfile: {
            include: { department: true },
          },
        },
      });

      if (!user) return sendError(res, 'User not found', 404);
      return sendSuccess(res, user);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve user', 500);
    }
  }

  static async createUser(req: Request, res: Response) {
    try {
      const {
        email,
        password,
        name,
        phone,
        role,
        rollNumber,
        programId,
        batchId,
        currentSemester,
        cgpa,
        employeeId,
        departmentId,
        designation,
        specialization,
        cabinNumber,
      } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (existingUser) {
        return sendError(res, 'A user with this email address already exists', 400);
      }

      const passwordHash = await hashPassword(password);

      const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: email.toLowerCase().trim(),
            passwordHash,
            name,
            phone,
            role,
          },
        });

        if (role === Role.ROLE_STUDENT) {
          if (!rollNumber || !programId || !batchId) {
            throw new Error('rollNumber, programId, and batchId are required for student accounts');
          }
          await tx.studentProfile.create({
            data: {
              userId: user.id,
              rollNumber,
              programId,
              batchId,
              currentSemester: currentSemester || 1,
              cgpa: cgpa || null,
            },
          });
        } else if (role === Role.ROLE_FACULTY || role === Role.ROLE_HOD) {
          if (!employeeId || !departmentId || !designation) {
            throw new Error('employeeId, departmentId, and designation are required for faculty accounts');
          }
          await tx.facultyProfile.create({
            data: {
              userId: user.id,
              employeeId,
              departmentId,
              designation,
              specialization,
              cabinNumber,
            },
          });
        }

        return user;
      });

      await AuditService.log({
        actorId: req.user?.userId,
        actorRole: req.user?.role,
        action: 'CREATE_USER',
        entityType: 'USER',
        entityId: newUser.id,
        newValue: { email: newUser.email, role: newUser.role, name: newUser.name },
      });

      return sendSuccess(res, { id: newUser.id, email: newUser.email }, 'User created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create user', 400);
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id);
      const { name, phone, isActive, password } = req.body;

      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) return sendError(res, 'User not found', 404);

      const updateData: any = {};
      if (name) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (password) updateData.passwordHash = await hashPassword(password);

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });

      await AuditService.log({
        actorId: req.user?.userId,
        actorRole: req.user?.role,
        action: 'UPDATE_USER',
        entityType: 'USER',
        entityId: id,
        oldValue: { name: existing.name, isActive: existing.isActive },
        newValue: { name: updated.name, isActive: updated.isActive },
      });

      return sendSuccess(res, updated, 'User updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update user', 500);
    }
  }

  static async toggleActiveStatus(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id);
      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) return sendError(res, 'User not found', 404);

      const updated = await prisma.user.update({
        where: { id },
        data: { isActive: !existing.isActive },
        select: { id: true, email: true, isActive: true },
      });

      await AuditService.log({
        actorId: req.user?.userId,
        actorRole: req.user?.role,
        action: updated.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        entityType: 'USER',
        entityId: id,
      });

      return sendSuccess(res, updated, `User account ${updated.isActive ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to toggle status', 500);
    }
  }
}
