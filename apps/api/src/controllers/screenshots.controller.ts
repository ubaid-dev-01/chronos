import { Request, Response } from 'express';
import { Screenshot, TimeLog, User } from '@chronos/db';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../middleware/error-handler';
import { getPresignedUrl, deleteScreenshot as deleteScreenshotBlob } from '../services/screenshot.service';
import { logAuditEvent } from '../integrations/enterprise/audit-log';
import { resolveScopedUserId } from '../middleware/permissions';

export const getScreenshots = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', date, userId, startDate, endDate } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { orgId: req.orgId };

  const scopedUserId = resolveScopedUserId(req, userId);
  if (scopedUserId) filter.userId = scopedUserId;

  if (date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    filter.timestamp = { $gte: dayStart.getTime(), $lte: dayEnd.getTime() };
  } else if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) (filter.timestamp as any).$gte = parseInt(startDate, 10);
    if (endDate) (filter.timestamp as any).$lte = parseInt(endDate, 10);
  }

  const pageNum = parseInt(page, 10);
  const limitNum = Math.min(parseInt(limit, 10), 50);

  const [screenshots, total] = await Promise.all([
    Screenshot.find(filter).sort({ timestamp: -1 })
      .skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Screenshot.countDocuments(filter),
  ]);

  const data = await Promise.all(
    screenshots.map(async (ss) => {
      const thumbSrc = ss.thumbnailUrl ?? ss.s3Url;
      const [thumbnailUrl, s3Url] = await Promise.all([
        getPresignedUrl(thumbSrc),
        getPresignedUrl(ss.s3Url),
      ]);
      return { ...ss, thumbnailUrl, s3Url };
    })
  );

  res.json({
    success: true, data, total,
    page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum),
  });
});

/**
 * GET /screenshots/timeline?date=2026-07-08&userId=optional
 * Hourly screenshot timeline for Activity-style UI
 */
export const getScreenshotTimeline = asyncHandler(async (req: Request, res: Response) => {
  const dateStr = req.query.date as string;
  if (!dateStr) throw new ApiError(400, 'date query param required');

  const targetUserId = (req.query.userId as string) || req.userId;
  const isManager = ['admin', 'manager'].includes(req.user?.role);

  if (targetUserId !== req.userId && !isManager) {
    throw new ApiError(403, 'Can only view your own screenshots');
  }

  if (targetUserId !== req.userId) {
    const target = await User.findOne({ _id: targetUserId, orgId: req.orgId, isActive: true }).lean();
    if (!target) throw new ApiError(404, 'User not found');
  }

  const dayStart = new Date(dateStr);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dateStr);
  dayEnd.setHours(23, 59, 59, 999);

  const screenshots = await Screenshot.find({
    orgId: req.orgId,
    userId: targetUserId,
    timestamp: { $gte: dayStart.getTime(), $lte: dayEnd.getTime() },
  })
    .sort({ timestamp: 1 })
    .populate({
      path: 'timelogId',
      select: 'activityScore startTime endTime projectId',
      populate: { path: 'projectId', select: 'name colorHex' },
    })
    .lean();

  const hourMap = new Map<number, Array<{
    _id: string;
    thumbnailUrl: string;
    s3Url: string;
    timestamp: number;
    minuteOffset: number;
    activityScore: number;
    projectName?: string;
    colorHex?: string;
  }>>();

  for (let h = 0; h < 24; h++) {
    hourMap.set(h, []);
  }

  for (const ss of screenshots as any[]) {
    const d = new Date(ss.timestamp);
    const hour = d.getHours();
    const timelog = ss.timelogId;
    const thumb = await getPresignedUrl(ss.thumbnailUrl ?? ss.s3Url);
    const full = await getPresignedUrl(ss.s3Url);
    const slots = hourMap.get(hour) ?? [];
    slots.push({
      _id: String(ss._id),
      thumbnailUrl: thumb,
      s3Url: full,
      timestamp: ss.timestamp,
      minuteOffset: d.getMinutes(),
      activityScore: timelog?.activityScore ?? 0,
      projectName: timelog?.projectId?.name,
      colorHex: timelog?.projectId?.colorHex,
    });
    hourMap.set(hour, slots);
  }

  const hours = Array.from(hourMap.entries()).map(([hour, slots]) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
    slots,
    count: slots.length,
  }));

  res.json({
    success: true,
    data: {
      date: dateStr,
      userId: targetUserId,
      totalScreenshots: screenshots.length,
      hours,
    },
  });
});

export const getScreenshot = asyncHandler(async (req: Request, res: Response) => {
  const screenshot = await Screenshot.findOne({
    _id: req.params.id,
    orgId: req.orgId,
  }).lean();

  if (!screenshot) throw new ApiError(404, 'Screenshot not found');

  const isManager = ['admin', 'manager'].includes(req.user?.role);
  if (String(screenshot.userId) !== req.userId && !isManager) {
    throw new ApiError(403, 'Can only view your own screenshots');
  }

  const url = await getPresignedUrl(screenshot.s3Url);
  res.json({
    success: true,
    data: { ...screenshot, presignedUrl: url },
  });
});

export const deleteScreenshot = asyncHandler(async (req: Request, res: Response) => {
  const screenshot = await Screenshot.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!screenshot) throw new ApiError(404, 'Screenshot not found');

  const isManager = ['admin', 'manager'].includes(req.user?.role);
  const isOwnScreenshot = String(screenshot.userId) === req.userId;
  const canDeleteOwn = isOwnScreenshot && req.user?.permissions?.canDeleteScreenshots;

  if (!isManager && !canDeleteOwn) {
    throw new ApiError(
      403,
      isOwnScreenshot
        ? 'You do not have permission to delete screenshots'
        : 'Can only delete your own screenshots'
    );
  }

  await deleteScreenshotBlob(screenshot.s3Url).catch(() => {});
  if (screenshot.thumbnailUrl) {
    await deleteScreenshotBlob(screenshot.thumbnailUrl).catch(() => {});
  }
  await screenshot.deleteOne();

  await logAuditEvent({
    orgId: req.orgId!,
    userId: req.userId!,
    action: 'screenshot.deleted',
    targetType: 'Screenshot',
    target: String(screenshot._id),
    details: { ownerUserId: String(screenshot.userId) },
    ipAddress: req.ip,
    userAgent: req.header('user-agent'),
  });

  res.json({ success: true, message: 'Screenshot deleted' });
});