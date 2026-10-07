import { Request, Response } from 'express';
import { Organization, User } from '@chronos/db';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../middleware/error-handler';
import { logAuditEvent } from '../integrations/enterprise/audit-log';
import { env } from '../config/env';
import { useLocalStorage } from '../config/s3';

export const getOrg = asyncHandler(async (req: Request, res: Response) => {
  const org = await Organization.findById(req.orgId).lean();
  if (!org) throw new ApiError(404, 'Organization not found');
  res.json({ success: true, data: org });
});

export const updateOrg = asyncHandler(async (req: Request, res: Response) => {
  const { name, timezone } = req.body;
  const updates: Record<string, unknown> = {};
  if (typeof name === 'string') updates.name = name.trim();
  if (typeof timezone === 'string') updates.timezone = timezone;

  const org = await Organization.findByIdAndUpdate(
    req.orgId,
    updates,
    { new: true, runValidators: true }
  );
  if (!org) throw new ApiError(404, 'Organization not found');

  if (typeof timezone === 'string') {
    await User.updateOne({ _id: req.userId }, { timezone });
  }

  await logAuditEvent({
    orgId: req.orgId!,
    userId: req.userId!,
    action: 'org.updated',
    targetType: 'Organization',
    target: String(org._id),
    details: { name, timezone },
    ipAddress: req.ip,
    userAgent: req.header('user-agent'),
  });

  res.json({ success: true, data: org });
});

export const getIntegrations = asyncHandler(async (_req: Request, res: Response) => {
  const stripeConfigured = !!env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.includes('dummy');
  const redisConfigured = !!env.REDIS_URL;
  res.json({
    success: true,
    data: {
      stripe: { configured: stripeConfigured, label: 'Stripe Billing' },
      s3: { configured: !useLocalStorage, label: 'Screenshot storage', detail: useLocalStorage ? 'Local disk' : 'Amazon S3' },
      redis: { configured: redisConfigured, label: 'Redis' },
      email: {
        configured: !!(env.RESEND_API_KEY || env.SMTP_HOST),
        label: 'Email delivery',
      },
    },
  });
});

export const getOrgMembers = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.find({ orgId: req.orgId, isActive: true })
    .select('-passwordHash')
    .sort({ displayName: 1 })
    .lean();
  res.json({ success: true, data: users });
});
