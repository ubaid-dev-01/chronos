import { Request, Response } from 'express';
import { getInvitePreview, registerViaInvite } from '@chronos/db';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../middleware/error-handler';

export const getInvite = asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = await getInvitePreview(req.params.token);
    res.json({ success: true, data });
  } catch {
    throw new ApiError(404, 'Invitation not found or expired');
  }
});

export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
  const { displayName, password } = req.body;

  if (!displayName || !password) {
    throw new ApiError(400, 'Name and password are required');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  try {
    const tokens = await registerViaInvite({
      token: req.params.token,
      displayName,
      password,
    });
    res.status(201).json({ success: true, data: tokens });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'INVALID_INVITE') {
        throw new ApiError(404, 'Invitation not found or expired');
      }
      if (err.message === 'EMAIL_EXISTS') {
        throw new ApiError(409, 'An account with this email already exists. Sign in instead.');
      }
      if (err.message === 'ORG_SUSPENDED') {
        throw new ApiError(403, 'This workspace is suspended');
      }
      if (err.message === 'SEAT_LIMIT') {
        throw new ApiError(403, 'Workspace seat limit reached');
      }
    }
    throw err;
  }
});
