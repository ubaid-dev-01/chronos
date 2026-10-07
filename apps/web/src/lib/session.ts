import {
    RefreshToken,
    User,
    connectDB,
    verifyAccessToken,
    type AccessTokenPayload,
} from '@chronos/db';
import type { IUser, UserRole } from '@chronos/types';
import { createHash } from 'crypto';
import { cookies } from 'next/headers';

const ACCESS_COOKIE = 'chronos_access';
const REFRESH_COOKIE = 'chronos_refresh';
const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export async function setAuthCookies (
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';

  cookieStore.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: ACCESS_MAX_AGE,
    path: '/',
  });

  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: REFRESH_MAX_AGE,
    path: '/',
  });
}

export async function clearAuthCookies (): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export async function getRefreshTokenFromCookies (): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE)?.value ?? null;
}

export async function getAccessPayloadFromCookies (): Promise<AccessTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_COOKIE)?.value;
    if (!token) return null;
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

function hashRefreshToken (raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/** Read-only: validate refresh cookie without rotating tokens or mutating cookies. */
async function getUserIdFromRefreshCookie (): Promise<string | null> {
  const refresh = await getRefreshTokenFromCookies();
  if (!refresh) return null;

  await connectDB();
  const record = await RefreshToken.findOne({
    tokenHash: hashRefreshToken(refresh),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  return record ? String(record.userId) : null;
}

interface LeanUser {
  _id: unknown;
  orgId: unknown;
  email: string;
  role: UserRole;
  displayName: string;
  hourlyRate?: number;
  onlineHourlyRate?: number;
  offlineHourlyRate?: number;
  weeklyHourLimit?: number;
  permissions?: IUser['permissions'];
  timezone?: string;
  isActive: boolean;
  lastActiveAt?: Date;
  invitedBy?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

function toIUser (user: LeanUser): IUser {
  return {
    _id: String(user._id),
    orgId: String(user.orgId),
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    hourlyRate: user.hourlyRate ?? 0,
    onlineHourlyRate: user.onlineHourlyRate ?? user.hourlyRate ?? 0,
    offlineHourlyRate: user.offlineHourlyRate ?? user.hourlyRate ?? 0,
    weeklyHourLimit: user.weeklyHourLimit ?? 40,
    permissions: user.permissions ?? {
      canTrackOffline: true,
      canDeleteScreenshots: true,
      showPopupTimer: true,
      screenshotsEnabled: true,
      tasksEnabled: true,
      reportsEnabled: true,
      activityEnabled: true,
      insightsEnabled: true,
      commentsEnabled: true,
      canManageTeam: user.role === 'admin' || user.role === 'manager',
      canLockTimetable: user.role === 'admin',
    },
    timezone: user.timezone ?? 'UTC',
    isActive: user.isActive,
    lastActiveAt: user.lastActiveAt,
    invitedBy: user.invitedBy ? String(user.invitedBy) : undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getCurrentUser (): Promise<IUser | null> {
  let userId: string | null = null;

  const payload = await getAccessPayloadFromCookies();
  if (payload) {
    userId = payload.sub;
  } else {
    userId = await getUserIdFromRefreshCookie();
  }

  if (!userId) return null;

  await connectDB();
  const user = await User.findById(userId).lean();
  if (!user) return null;
  return toIUser(user as unknown as LeanUser);
}

export async function requireAuth (): Promise<IUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requireActiveUser (): Promise<IUser> {
  const user = await requireAuth();
  if (!user.isActive) throw new Error('Account deactivated');
  return user;
}

export async function requireRole (roles: string[]): Promise<IUser> {
  const user = await requireActiveUser();
  if (!roles.includes(user.role)) throw new Error('Forbidden');
  return user;
}

export async function getAccessTokenForClient (): Promise<string | null> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(ACCESS_COOKIE)?.value;
  if (existing) {
    try {
      await verifyAccessToken(existing);
      return existing;
    } catch {
      /* expired client should call /api/auth/refresh */
    }
  }
  return null;
}
