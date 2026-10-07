import { Request, Response } from 'express';
import {
  connectDB,
  registerWithPassword,
  loginWithPassword,
  refreshWithToken,
  revokeRefreshToken,
  User,
} from '@chronos/db';
import { env } from '../config/env';
import { sendPasswordResetOtpEmail } from '../services/email.service';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../middleware/error-handler';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, displayName, workspaceName } = req.body;

  if (!email || !password || !displayName) {
    throw new ApiError(400, 'Email, password, and display name are required');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  try {
    const tokens = await registerWithPassword({
      email,
      password,
      displayName,
      workspaceName,
    });
    res.status(201).json({ success: true, data: tokens });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
      throw new ApiError(409, 'An account with this email already exists');
    }
    throw err;
  }
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  try {
    const tokens = await loginWithPassword(email, password);
    res.json({ success: true, data: tokens });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'ACCOUNT_DEACTIVATED') {
        throw new ApiError(403, 'Account deactivated');
      }
      if (err.message === 'INVALID_CREDENTIALS') {
        throw new ApiError(401, 'Invalid email or password');
      }
    }
    throw err;
  }
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken =
    req.body.refreshToken || req.cookies?.chronos_refresh;
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token required');
  }

  try {
    const tokens = await refreshWithToken(refreshToken);
    res.json({ success: true, data: tokens });
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken =
    req.body.refreshToken || req.cookies?.chronos_refresh;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  res.json({ success: true, message: 'Logged out' });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId).select('-passwordHash').lean();
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

export const sendPasswordResetEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const secret = req.header('x-chronos-internal');
    if (!secret || secret !== env.INTERNAL_EMAIL_SECRET) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { to, otp } = req.body as { to?: string; otp?: string };
    if (!to || !otp) {
      throw new ApiError(400, 'Recipient and OTP are required');
    }
    if (!/^\d{6}$/.test(String(otp))) {
      throw new ApiError(400, 'Invalid OTP format');
    }

    try {
      const result = await sendPasswordResetOtpEmail({
        to: to.toLowerCase().trim(),
        otp: String(otp),
      });

      res.json({
        success: true,
        data: {
          mode: result.mode,
          previewUrl: result.previewUrl,
        },
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to send email';
      throw new ApiError(503, message);
    }
  }
);
