import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { prisma } from '../config/prisma.js';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authentication token missing or invalid', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      sendError(res, 'Authentication token missing', 401);
      return;
    }

    const decoded = verifyToken(token);

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      sendError(res, 'User account is deactivated or no longer exists', 401);
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      sendError(res, 'Authentication token has expired', 401);
      return;
    }
    sendError(res, 'Invalid authentication token', 401);
  }
};
