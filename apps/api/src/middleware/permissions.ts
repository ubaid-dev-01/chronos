import { Request, Response, NextFunction } from 'express';
import type { IUserPermissions } from '@chronos/types';
import { ApiError } from './error-handler';

export function isManagerOrAdmin (req: Request): boolean {
  return req.user?.role === 'admin' || req.user?.role === 'manager';
}

/**
 * Members must have the flag enabled. Admins/managers always pass so they can
 * operate the product even when reviewing a restricted teammate.
 */
export function requirePermission (flag: keyof IUserPermissions) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));
    if (isManagerOrAdmin(req)) return next();
    if (req.user.permissions?.[flag] === false) {
      return next(new ApiError(403, `You do not have permission to access ${flag}`));
    }
    next();
  };
}

/**
 * Members can only query their own userId. Managers/admins may target any
 * teammate. When no userId is supplied, members are scoped to self; managers
 * may see the whole org (caller decides whether to apply the returned id).
 */
export function resolveScopedUserId (
  req: Request,
  requestedUserId: string | undefined,
  options: { defaultSelfForMembers?: boolean } = {}
): string | undefined {
  const { defaultSelfForMembers = true } = options;
  if (requestedUserId) {
    if (requestedUserId !== req.userId && !isManagerOrAdmin(req)) {
      throw new ApiError(403, 'Can only access your own data');
    }
    return requestedUserId;
  }
  if (!isManagerOrAdmin(req) && defaultSelfForMembers) {
    return req.userId;
  }
  return undefined;
}
