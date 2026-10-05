import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { sendError } from '../utils/response.js';

export const requireRole = (allowedRole: Role) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (req.user.role !== allowedRole) {
      sendError(
        res,
        `Access denied. Requires ${allowedRole} role.`,
        403
      );
      return;
    }

    next();
  };
};

export const requireAnyRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Access denied. Allowed roles: ${allowedRoles.join(', ')}`,
        403
      );
      return;
    }

    next();
  };
};
