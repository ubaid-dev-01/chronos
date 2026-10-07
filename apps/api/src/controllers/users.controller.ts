import { Request, Response } from 'express';
import { Invite, Organization, User } from '@chronos/db';
import { ADMIN_ONLY_PERMISSIONS, resolveSeatLimit } from '@chronos/types';
import type { IUserPermissions } from '@chronos/types';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../middleware/error-handler';
import { sendInviteEmail } from '../services/email.service';
import { env } from '../config/env';
import { randomBytes } from 'crypto';
import { logAuditEvent } from '../integrations/enterprise/audit-log';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.find({ orgId: req.orgId, isActive: true })
    .select('-passwordHash')
    .sort({ displayName: 1 })
    .lean();
  res.json({ success: true, data: users });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId).select('-passwordHash').lean();
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { displayName, timezone } = req.body as { displayName?: string; timezone?: string };
  const updates: Record<string, unknown> = {};
  if (typeof displayName === 'string') updates.displayName = displayName.trim();
  if (typeof timezone === 'string') updates.timezone = timezone;
  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'No changes provided');
  }

  const user = await User.findByIdAndUpdate(req.userId, updates, {
    new: true,
    runValidators: true,
  }).select('-passwordHash');
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOne({ _id: req.params.id, orgId: req.orgId })
    .select('-passwordHash').lean();
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { role, hourlyRate, timezone, displayName, permissions: requestedPermissions } = req.body;
  const target = await User.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!target) throw new ApiError(404, 'User not found');

  if (role === 'admin' && req.user?.role !== 'admin') {
    throw new ApiError(403, 'Only admins can promote users to admin');
  }
  if (target.role === 'admin' && req.user?.role !== 'admin') {
    throw new ApiError(403, 'Only admins can edit admin users');
  }
  if (String(target._id) === req.userId && role && role !== target.role) {
    throw new ApiError(400, 'Cannot change your own role');
  }

  const updates: Record<string, unknown> = {};
  if (role !== undefined) updates.role = role;
  if (hourlyRate !== undefined) updates.hourlyRate = hourlyRate;
  if (timezone !== undefined) updates.timezone = timezone;
  if (displayName !== undefined) updates.displayName = displayName;

  if (requestedPermissions !== undefined) {
    const sanitized = sanitizeInvitePermissions(
      requestedPermissions,
      req.user?.role === 'admin'
    );
    if (sanitized) {
      updates.permissions = {
        ...(target.permissions?.toObject?.() ?? target.permissions ?? {}),
        ...sanitized,
      };
    }
  }

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, orgId: req.orgId },
    updates,
    { new: true, runValidators: true }
  ).select('-passwordHash');
  if (!user) throw new ApiError(404, 'User not found');

  await logAuditEvent({
    orgId: req.orgId!,
    userId: req.userId!,
    action: 'user.updated',
    targetType: 'User',
    target: String(user._id),
    details: { role, hourlyRate, timezone, displayName, permissions: requestedPermissions },
    ipAddress: req.ip,
    userAgent: req.header('user-agent'),
  });

  res.json({ success: true, data: user });
});

/**
 * Only admins may grant elevated permissions (team management / timetable
 * locking) on an invite; managers inviting members/managers can still set
 * the non-elevated flags (screenshotsEnabled, tasksEnabled, etc.).
 */
function sanitizeInvitePermissions (
  raw: unknown,
  inviterIsAdmin: boolean
): Partial<IUserPermissions> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const sanitized: Partial<IUserPermissions> = { ...(raw as Partial<IUserPermissions>) };
  if (!inviterIsAdmin) {
    for (const key of ADMIN_ONLY_PERMISSIONS) {
      delete sanitized[key];
    }
  }
  return sanitized;
}

export const inviteUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, role, permissions: requestedPermissions } = req.body;
  const inviteRole = role || 'member';

  if (req.user?.role !== 'admin' && inviteRole === 'admin') {
    throw new ApiError(403, 'Only admins can invite other admins');
  }

  const sanitizedPermissions = sanitizeInvitePermissions(
    requestedPermissions,
    req.user?.role === 'admin'
  );

  const org = await Organization.findById(req.orgId) as any;
  if (!org) throw new ApiError(404, 'Organization not found');

  const memberCount = await User.countDocuments({ orgId: req.orgId, isActive: true });
  const seatLimit = resolveSeatLimit(org);
  if (memberCount >= seatLimit) {
    throw new ApiError(403, `Seat limit reached (${seatLimit}). Upgrade your plan.`);
  }

  const existing = await Invite.findOne({
    email, orgId: req.orgId, acceptedAt: null, revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (existing) throw new ApiError(409, 'Invite already pending');

  const invite = await Invite.create({
    orgId: req.orgId,
    createdBy: req.userId,
    email,
    role: inviteRole,
    permissions: sanitizedPermissions,
    token: randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const inviter = await User.findById(req.userId).select('displayName').lean();
  const inviteUrl = `${env.APP_URL.replace(/\/$/, '')}/invite/${invite.token}`;

  const emailResult = await sendInviteEmail({
    to: email,
    orgName: org.name,
    role: inviteRole,
    inviteUrl,
    inviterName: inviter?.displayName,
    permissions: sanitizedPermissions,
  });

  await logAuditEvent({
    orgId: req.orgId!,
    userId: req.userId!,
    action: 'user.invited',
    targetType: 'Invite',
    target: String(invite._id),
    details: { email, role: inviteRole, permissions: sanitizedPermissions },
    ipAddress: req.ip,
    userAgent: req.header('user-agent'),
  });

  res.status(201).json({
    success: true,
    data: {
      ...invite.toObject(),
      inviteUrl,
      emailSent: emailResult.sent,
      emailMode: emailResult.mode,
    },
  });
});

export const listInvites = asyncHandler(async (req: Request, res: Response) => {
  const invites = await Invite.find({
    orgId: req.orgId,
    acceptedAt: null,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .select('-token')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: invites });
});

export const revokeInvite = asyncHandler(async (req: Request, res: Response) => {
  const invite = await Invite.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!invite) throw new ApiError(404, 'Invite not found');

  if (invite.role === 'admin' && req.user?.role !== 'admin') {
    throw new ApiError(403, 'Only admins can revoke admin invites');
  }
  if (invite.acceptedAt) {
    throw new ApiError(400, 'Invite has already been accepted');
  }
  if (invite.revokedAt) {
    throw new ApiError(400, 'Invite has already been revoked');
  }

  invite.revokedAt = new Date();
  await invite.save();

  await logAuditEvent({
    orgId: req.orgId!,
    userId: req.userId!,
    action: 'user.invite_revoked',
    targetType: 'Invite',
    target: String(invite._id),
    details: { email: invite.email, role: invite.role },
    ipAddress: req.ip,
    userAgent: req.header('user-agent'),
  });

  res.json({ success: true, message: 'Invite revoked' });
});

export const removeUser = asyncHandler(async (req: Request, res: Response) => {
  if (req.params.id === req.userId) {
    throw new ApiError(400, 'Cannot remove yourself');
  }
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, orgId: req.orgId },
    { isActive: false },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'User not found');

  await logAuditEvent({
    orgId: req.orgId!,
    userId: req.userId!,
    action: 'user.deleted',
    targetType: 'User',
    target: String(user._id),
    details: { displayName: user.displayName, email: user.email },
    ipAddress: req.ip,
    userAgent: req.header('user-agent'),
  });

  res.json({ success: true, message: 'User removed' });
});
