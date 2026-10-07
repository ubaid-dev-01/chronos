import { Project, TimeLog, User } from '@chronos/db';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';

/**
 * Public REST API (`/v1/public/*`) authenticated via org-scoped API keys
 * (see `middleware/api-key-auth.ts`), not user JWTs. All queries are always
 * scoped to `req.orgId`, which is resolved from the verified API key, so a
 * key can never read data belonging to another organization.
 *
 * GET /v1/public/timelogs?startDate&endDate&userId&projectId&page&limit
 *   Requires scope: timelogs:read
 */
export const getPublicTimeLogs = asyncHandler(async (req: Request, res: Response) => {
  const { userId, projectId, startDate, endDate, page = '1', limit = '50' } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = { orgId: req.orgId };
  if (userId) filter.userId = userId;
  if (projectId) filter.projectId = projectId;
  if (startDate || endDate) {
    filter.startTime = {
      ...(startDate ? { $gte: new Date(startDate).getTime() } : {}),
      ...(endDate ? { $lte: new Date(endDate).getTime() } : {}),
    };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(parseInt(limit, 10) || 50, 100);

  const [timelogs, total] = await Promise.all([
    TimeLog.find(filter)
      .sort({ startTime: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('userId projectId taskId startTime endTime activityScore isOffline windowTitle processName')
      .populate('projectId', 'name colorHex')
      .lean(),
    TimeLog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: timelogs,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

/**
 * GET /v1/public/projects
 *   Requires scope: projects:read
 */
export const getPublicProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await Project.find({ orgId: req.orgId })
    .select('name description colorHex budgetHours deadline isActive createdAt')
    .sort({ name: 1 })
    .lean();

  res.json({ success: true, data: projects });
});

/**
 * GET /v1/public/users
 *   Requires scope: users:read
 *   Never exposes passwordHash or other sensitive fields.
 */
export const getPublicUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.find({ orgId: req.orgId, isActive: true })
    .select('displayName email role timezone createdAt')
    .sort({ displayName: 1 })
    .lean();

  res.json({ success: true, data: users });
});
