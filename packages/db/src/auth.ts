import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { User } from './models/User';
import { Organization } from './models/Organization';
import { Invite } from './models/Invite';
import { RefreshToken } from './models/RefreshToken';
import { PasswordReset } from './models/PasswordReset';
import { provisionWorkspace } from './provision';
import { resolveSeatLimit } from '@chronos/types';

const ACCESS_TTL_SEC = 15 * 60;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AccessTokenPayload {
  sub: string;
  orgId: string;
  role: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function getAccessSecret (): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

function hashToken (raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export async function signAccessToken (payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({
    orgId: payload.orgId,
    role: payload.role,
    email: payload.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(getAccessSecret());
}

export async function verifyAccessToken (
  token: string
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getAccessSecret());
  const sub = payload.sub;
  if (!sub || typeof sub !== 'string') {
    throw new Error('Invalid token');
  }
  return {
    sub,
    orgId: String(payload.orgId ?? ''),
    role: String(payload.role ?? 'member'),
    email: String(payload.email ?? ''),
  };
}

async function createRefreshTokenRecord (userId: string): Promise<string> {
  const raw = randomBytes(32).toString('base64url');
  await RefreshToken.create({
    userId,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
  return raw;
}

export async function issueAuthTokens (user: {
  _id: unknown;
  orgId: unknown;
  role: string;
  email: string;
}): Promise<AuthTokens> {
  const userId = String(user._id);
  const accessToken = await signAccessToken({
    sub: userId,
    orgId: String(user.orgId),
    role: user.role,
    email: user.email,
  });
  const refreshToken = await createRefreshTokenRecord(userId);
  return { accessToken, refreshToken, expiresIn: ACCESS_TTL_SEC };
}

export async function registerWithPassword (input: {
  email: string;
  password: string;
  displayName: string;
  workspaceName?: string;
}) {
  const email = input.email.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error('EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const { user } = await provisionWorkspace({
    email,
    displayName: input.displayName.trim(),
    passwordHash,
    workspaceName: input.workspaceName,
  });

  return issueAuthTokens(user);
}

export async function getInvitePreview (token: string) {
  const invite = (await Invite.findOne({
    token,
    acceptedAt: null,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).lean()) as {
    email: string;
    role: string;
    orgId: unknown;
    permissions?: Record<string, boolean>;
    expiresAt: Date;
  } | null;

  if (!invite) throw new Error('INVALID_INVITE');

  const org = (await Organization.findById(invite.orgId).select('name').lean()) as {
    name?: string;
  } | null;
  return {
    email: invite.email,
    role: invite.role,
    orgName: org?.name ?? 'Workspace',
    permissions: { ...defaultPermissions(invite.role), ...(invite.permissions ?? {}) },
    expiresAt: invite.expiresAt,
  };
}

function defaultPermissions (role: string) {
  return {
    canTrackOffline: true,
    canDeleteScreenshots: role !== 'member',
    showPopupTimer: true,
    screenshotsEnabled: true,
    tasksEnabled: true,
    reportsEnabled: true,
    activityEnabled: true,
    insightsEnabled: true,
    commentsEnabled: true,
    canManageTeam: role === 'admin' || role === 'manager',
    canLockTimetable: role === 'admin',
  };
}

export async function registerViaInvite (input: {
  token: string;
  password: string;
  displayName: string;
}) {
  const invite = await Invite.findOne({
    token: input.token,
    acceptedAt: null,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!invite) throw new Error('INVALID_INVITE');

  const email = invite.email.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) throw new Error('EMAIL_EXISTS');

  const org = await Organization.findById(invite.orgId);
  if (!org) throw new Error('INVALID_INVITE');
  if (!org.isActive) throw new Error('ORG_SUSPENDED');

  const memberCount = await User.countDocuments({
    orgId: invite.orgId,
    isActive: true,
  });
  if (memberCount >= resolveSeatLimit(org)) throw new Error('SEAT_LIMIT');

  const passwordHash = await bcrypt.hash(input.password, 12);
  // `invite.permissions` is a Mongoose single-nested subdocument - its
  // schema-defined fields live on getters, not as own enumerable properties,
  // so a plain object spread would silently drop every override. Convert to
  // a plain object first so admin-chosen overrides actually win.
  const invitePermissionOverrides = invite.permissions
    ? (invite.permissions as unknown as { toObject?: () => Record<string, boolean> }).toObject?.() ??
      (invite.permissions as unknown as Record<string, boolean>)
    : {};
  const user = await User.create({
    orgId: invite.orgId,
    email,
    passwordHash,
    role: invite.role,
    displayName: input.displayName.trim(),
    invitedBy: invite.createdBy,
    // Admin-chosen overrides (if any) win over the role-based defaults.
    permissions: { ...defaultPermissions(invite.role), ...invitePermissionOverrides },
  });

  invite.acceptedAt = new Date();
  await invite.save();

  return issueAuthTokens(user);
}

/**
 * Accepts an invite for a user who already has an account (and is currently
 * signed in). Unlike `registerViaInvite`, this never creates a new user - it
 * moves the caller's existing account onto the invite's org/role/permissions.
 * Each account belongs to exactly one org, so "joining" a new workspace via
 * invite means switching that account over to it (mirrors how an employee
 * moving companies would use the same email for their new employer).
 */
export async function joinOrgViaInvite (input: {
  token: string;
  userId: string;
}) {
  const invite = await Invite.findOne({
    token: input.token,
    acceptedAt: null,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!invite) throw new Error('INVALID_INVITE');

  const user = await User.findById(input.userId);
  if (!user) throw new Error('INVALID_SESSION');

  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new Error('EMAIL_MISMATCH');
  }

  const org = await Organization.findById(invite.orgId);
  if (!org) throw new Error('INVALID_INVITE');
  if (!org.isActive) throw new Error('ORG_SUSPENDED');

  const alreadyMember = String(user.orgId) === String(invite.orgId);
  if (!alreadyMember) {
    const memberCount = await User.countDocuments({
      orgId: invite.orgId,
      isActive: true,
    });
    if (memberCount >= resolveSeatLimit(org)) throw new Error('SEAT_LIMIT');
  }

  const invitePermissionOverrides = invite.permissions
    ? (invite.permissions as unknown as { toObject?: () => Record<string, boolean> }).toObject?.() ??
      (invite.permissions as unknown as Record<string, boolean>)
    : {};

  user.orgId = invite.orgId;
  user.role = invite.role;
  user.permissions = { ...defaultPermissions(invite.role), ...invitePermissionOverrides };
  user.invitedBy = invite.createdBy;
  user.isActive = true;
  await user.save();

  invite.acceptedAt = new Date();
  await invite.save();

  return issueAuthTokens(user);
}

export async function loginWithPassword (email: string, password: string) {
  const user = (await User.findOne({ email: email.toLowerCase().trim() })
    .select('+passwordHash')
    .lean()) as any;
  if (!user || !user.passwordHash) {
    throw new Error('INVALID_CREDENTIALS');
  }
  if (!user.isActive) {
    throw new Error('ACCOUNT_DEACTIVATED');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  await User.updateOne({ _id: user._id }, { lastActiveAt: new Date() });
  return issueAuthTokens(user);
}

export async function refreshWithToken (rawRefresh: string) {
  const tokenHash = hashToken(rawRefresh);
  const record = await RefreshToken.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!record) throw new Error('INVALID_REFRESH');

  const user = (await User.findById(record.userId).lean()) as any;
  if (!user || !user.isActive) throw new Error('INVALID_REFRESH');

  record.revokedAt = new Date();
  await record.save();

  return issueAuthTokens(user);
}

export async function revokeRefreshToken (rawRefresh: string) {
  const tokenHash = hashToken(rawRefresh);
  await RefreshToken.updateOne(
    { tokenHash, revokedAt: null },
    { revokedAt: new Date() }
  );
}

const PASSWORD_RESET_TTL_MS = 10 * 60 * 1000;

function generateOtp (): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createPasswordResetOtp (email: string): Promise<{
  otp: string;
}> {
  const normalized = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalized });
  if (!user) {
    throw new Error('EMAIL_NOT_FOUND');
  }
  if (!user.isActive) {
    throw new Error('ACCOUNT_DEACTIVATED');
  }

  await PasswordReset.updateMany(
    { userId: user._id, usedAt: null },
    { usedAt: new Date() }
  );

  const otp = generateOtp();
  await PasswordReset.create({
    userId: user._id,
    tokenHash: hashToken(otp),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  });

  return { otp };
}

export async function verifyPasswordResetOtp (
  email: string,
  otp: string
): Promise<void> {
  const normalized = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalized, isActive: true });
  if (!user) throw new Error('INVALID_RESET_OTP');

  const record = await PasswordReset.findOne({
    userId: user._id,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!record || record.tokenHash !== hashToken(otp.trim())) {
    throw new Error('INVALID_RESET_OTP');
  }
}

export async function resetPasswordWithOtp (
  email: string,
  otp: string,
  newPassword: string
): Promise<void> {
  const normalized = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalized, isActive: true });
  if (!user) throw new Error('INVALID_RESET_OTP');

  const record = await PasswordReset.findOne({
    userId: user._id,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!record || record.tokenHash !== hashToken(otp.trim())) {
    throw new Error('INVALID_RESET_OTP');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await User.updateOne({ _id: user._id }, { passwordHash });
  record.usedAt = new Date();
  await record.save();

  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { revokedAt: new Date() }
  );
}
