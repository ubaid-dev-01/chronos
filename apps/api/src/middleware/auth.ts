import { Request, Response, NextFunction } from 'express';
import { User, Organization, verifyAccessToken } from '@chronos/db';
import { ApiError } from './error-handler';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
      orgId?: string;
    }
  }
}

/**
 * Verify Bearer access JWT and attach user to request.
 */
export async function authenticate (req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ApiError(401, 'Missing token');
    }

    const payload = await verifyAccessToken(token);

    const user = await User.findById(payload.sub).lean() as any;
    if (!user) {
      throw new ApiError(401, 'User not found');
    }
    if (!user.isActive) {
      throw new ApiError(403, 'Account deactivated');
    }

    const org = await Organization.findById(user.orgId).lean() as any;
    if (!org) {
      throw new ApiError(404, 'Organization not found');
    }
    if (!org.isActive) {
      throw new ApiError(403, 'Organization suspended');
    }

    req.userId = user._id.toString();
    req.user = user;
    req.orgId = user.orgId.toString();

    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(new ApiError(401, 'Authentication failed'));
  }
}
