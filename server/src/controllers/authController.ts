import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { AuditService } from '../services/auditService.js';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: {
          studentProfile: {
            include: { program: true, batch: true },
          },
          facultyProfile: {
            include: { department: true },
          },
        },
      });

      if (!user) {
        return sendError(res, 'Invalid email or password', 401);
      }

      if (!user.isActive) {
        return sendError(res, 'This account has been deactivated. Please contact administrator.', 403);
      }

      const isPasswordValid = await comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return sendError(res, 'Invalid email or password', 401);
      }

      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      // Audit log login action
      await AuditService.log({
        actorId: user.id,
        actorRole: user.role,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        ipAddress: req.ip,
        userAgent: Array.isArray(req.headers['user-agent'])
          ? req.headers['user-agent'][0]
          : req.headers['user-agent'],
      });

      return sendSuccess(
        res,
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            studentProfile: user.studentProfile,
            facultyProfile: user.facultyProfile,
          },
        },
        'Login successful'
      );
    } catch (error: any) {
      return sendError(res, error.message || 'Login failed', 500);
    }
  }

  static async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          studentProfile: {
            include: {
              program: { include: { department: true } },
              batch: true,
              allocation: {
                include: {
                  project: {
                    include: { faculty: { select: { id: true, name: true, email: true } } },
                  },
                },
              },
            },
          },
          facultyProfile: {
            include: { department: true },
          },
        },
      });

      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      return sendSuccess(res, user, 'Current user profile retrieved');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch current user', 500);
    }
  }

  static async logout(req: Request, res: Response) {
    if (req.user) {
      await AuditService.log({
        actorId: req.user.userId,
        actorRole: req.user.role,
        action: 'USER_LOGOUT',
        entityType: 'USER',
        entityId: req.user.userId,
      });
    }
    return sendSuccess(res, null, 'Logged out successfully');
  }
}
