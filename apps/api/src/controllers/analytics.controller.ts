import { User } from '@chronos/db';
import { Request, Response } from 'express';
import { FocusEngine } from '../ai/focus/engine';
import { ApiError } from '../middleware/error-handler';
import { getProjectHealth } from '../services/project-health.service';
import { asyncHandler } from '../utils/async-handler';

const focusEngine = new FocusEngine();

function parseDateRange (startDate?: string, endDate?: string) {
  const now = new Date();
  const end = endDate ? new Date(endDate) : now;
  end.setHours(23, 59, 59, 999);

  const start = startDate
    ? new Date(startDate)
    : new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);

  return { startMs: start.getTime(), endMs: end.getTime() };
}

/**
 * GET /analytics/focus?startDate=&endDate=&userId=&view=team
 * Focus Score & Deep Work Analytics see apps/api/src/ai/focus/engine.ts.
 */
export const getFocusScore = asyncHandler(async (req: Request, res: Response) => {
  const { startMs, endMs } = parseDateRange(
    req.query.startDate as string | undefined,
    req.query.endDate as string | undefined
  );
  const isManager = ['admin', 'manager'].includes(req.user?.role);

  if (req.query.view === 'team') {
    if (!isManager) throw new ApiError(403, 'Only managers can view team focus scores');
    const rows = await focusEngine.analyzeTeam(req.orgId!, startMs, endMs);
    return res.json({ success: true, data: { rows } });
  }

  const targetUserId = (req.query.userId as string) || req.userId!;
  if (targetUserId !== req.userId && !isManager) {
    throw new ApiError(403, 'Can only view your own focus score');
  }

  let displayName: string | undefined;
  if (targetUserId !== req.userId) {
    const target = await User.findOne({ _id: targetUserId, orgId: req.orgId, isActive: true })
      .select('displayName')
      .lean();
    if (!target) throw new ApiError(404, 'User not found');
    displayName = target.displayName;
  }

  const result = await focusEngine.analyzeUser(targetUserId, startMs, endMs, displayName, req.orgId!);
  res.json({ success: true, data: result });
});

/**
 * GET /analytics/project-health?startDate=&endDate=
 * Per-project health score: budget burn, task completion, contributor burnout.
 */
export const getProjectHealthReport = asyncHandler(async (req: Request, res: Response) => {
  const { startMs, endMs } = parseDateRange(
    req.query.startDate as string | undefined,
    req.query.endDate as string | undefined
  );

  const projects = await getProjectHealth(req.orgId!, startMs, endMs);
  res.json({ success: true, data: projects });
});
