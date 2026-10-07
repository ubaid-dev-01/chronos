import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@chronos/types';
import { ApiError } from './error-handler';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  manager: 2,
  member: 1,
};

/**
 * Require minimum role level
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));

    const userRole = req.user.role as UserRole;
    const hasPermission = roles.some(
      (role) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role]
    );

    if (!hasPermission) {
      return next(new ApiError(403, `Requires role: ${roles.join(' or ')}`));
    }
    next();
  };
}

/**
 * Ensure user can only access their own data (or manager+ can access team)
 */
export function requireSelfOrManager(req: Request, _res: Response, next: NextFunction) {
  const targetUserId = req.params.userId || req.params.id;
  if (!targetUserId) return next();

  const isSelf = targetUserId === req.userId;
  const isManagerOrAbove = ROLE_HIERARCHY[req.user?.role as UserRole] >= ROLE_HIERARCHY.manager;

  if (!isSelf && !isManagerOrAbove) {
    return next(new ApiError(403, 'Can only access your own data'));
  }
  next();
}
