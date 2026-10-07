import { Activity, TimeLog, User, Project, Task } from '@chronos/db';
import { Request, Response } from 'express';
import { ApiError } from '../middleware/error-handler';
import { asyncHandler } from '../utils/async-handler';
import { updatePresence, emitActivityFeed } from '../websocket';

function msToHhMm (ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

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

function resolveTargetUser (req: Request, userId?: string) {
  const targetUserId = userId || req.userId!;
  const isManager = ['admin', 'manager'].includes(req.user?.role);

  if (targetUserId !== req.userId && !isManager) {
    throw new ApiError(403, 'Can only view your own activity');
  }

  return targetUserId;
}

/**
 * GET /activity/usage?startDate=&endDate=&userId=
 * App/window usage aggregated from time logs (+ activity events when present).
 */
export const getActivityUsage = asyncHandler(async (req: Request, res: Response) => {
  const targetUserId = resolveTargetUser(req, req.query.userId as string | undefined);
  const { startMs, endMs } = parseDateRange(
    req.query.startDate as string | undefined,
    req.query.endDate as string | undefined
  );

  if (targetUserId !== req.userId) {
    const target = await User.findOne({ _id: targetUserId, orgId: req.orgId, isActive: true }).lean();
    if (!target) throw new ApiError(404, 'User not found');
  }

  const timelogs = await TimeLog.find({
    orgId: req.orgId,
    userId: targetUserId,
    startTime: { $gte: startMs, $lte: endMs },
  }).lean();

  const appMap = new Map<string, { processName: string; totalMs: number; windows: Map<string, number> }>();

  for (const log of timelogs as any[]) {
    const duration = (log.endTime ?? Date.now()) - log.startTime;
    const processName = log.processName?.trim() || 'Unknown app';
    const windowTitle = log.windowTitle?.trim() || 'Untitled window';

    if (!appMap.has(processName)) {
      appMap.set(processName, { processName, totalMs: 0, windows: new Map() });
    }
    const app = appMap.get(processName)!;
    app.totalMs += duration;
    app.windows.set(windowTitle, (app.windows.get(windowTitle) ?? 0) + duration);
  }

  const totalMs = Array.from(appMap.values()).reduce((s, a) => s + a.totalMs, 0);

  const apps = Array.from(appMap.values())
    .sort((a, b) => b.totalMs - a.totalMs)
    .map(app => ({
      processName: app.processName,
      totalMs: app.totalMs,
      totalHours: msToHhMm(app.totalMs),
      percent: totalMs > 0 ? Math.round((app.totalMs / totalMs) * 100) : 0,
      windows: Array.from(app.windows.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([title, ms]) => ({
          windowTitle: title,
          totalMs: ms,
          totalHours: msToHhMm(ms),
        })),
    }));

  const activityEvents = await Activity.find({
    orgId: req.orgId,
    userId: targetUserId,
    timestamp: { $gte: startMs, $lte: endMs },
  })
    .sort({ timestamp: -1 })
    .limit(100)
    .lean();

  const timeline = (activityEvents as any[]).map(e => ({
    _id: String(e._id),
    status: e.status,
    timestamp: e.timestamp,
    processName: e.processName,
    windowTitle: e.windowTitle,
  }));

  res.json({
    success: true,
    data: {
      startDate: new Date(startMs).toISOString().split('T')[0],
      endDate: new Date(endMs).toISOString().split('T')[0],
      userId: targetUserId,
      totalMs,
      totalHours: msToHhMm(totalMs),
      apps,
      timeline,
    },
  });
});

/**
 * POST /activity/sync batch activity events from desktop agent
 */
export const syncActivityEvents = asyncHandler(async (req: Request, res: Response) => {
  const { events } = req.body;
  if (!events?.length) throw new ApiError(400, 'No events provided');

  const orgId = req.orgId!;
  const userId = req.userId!;

  const docs = events.map((e: {
    status: string;
    timestamp: number;
    windowTitle?: string;
    processName?: string;
  }) => ({
    orgId,
    userId,
    status: e.status,
    timestamp: e.timestamp,
    windowTitle: e.windowTitle,
    processName: e.processName,
  }));

  await Activity.insertMany(docs, { ordered: false });

  res.json({ success: true, syncedCount: docs.length });
});

/**
 * POST /activity/presence
 * Low-latency presence ping the desktop agent fires immediately on
 * start/stop/idle transitions, so Team Pulse reflects the change within a
 * second instead of waiting for the next 60s batch `/timelogs/sync`.
 */
export const updateLivePresence = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.orgId!;
  const userId = req.userId!;
  const { status, projectId, taskId } = req.body as {
    status: 'active' | 'idle' | 'offline';
    projectId?: string;
    taskId?: string;
  };

  let projectName: string | null = null;
  let taskTitle: string | null = null;

  if (projectId) {
    const project = await Project.findOne({ _id: projectId, orgId }).select('name').lean() as any;
    projectName = project?.name ?? null;
  }
  if (taskId) {
    const task = await Task.findOne({ _id: taskId, orgId }).select('title').lean() as any;
    taskTitle = task?.title ?? null;
  }

  const now = Date.now();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const todayLogs = await TimeLog.find({
    orgId, userId, startTime: { $gte: dayStart.getTime() },
  }).select('startTime endTime').lean();
  const activeTime = todayLogs.reduce(
    (sum, l) => sum + Math.max((l.endTime ?? now) - l.startTime, 0),
    0
  );

  updatePresence(orgId, {
    userId,
    userName: req.user?.displayName,
    status,
    currentProject: projectName,
    currentTask: taskTitle,
    activeTime,
  });

  if (status === 'active' && projectName) {
    emitActivityFeed(orgId, {
      userId,
      userName: req.user?.displayName ?? 'Someone',
      type: 'session_start',
      message: taskTitle
        ? `started tracking "${taskTitle}" from the desktop agent`
        : `started tracking on ${projectName} from the desktop agent`,
      projectName,
    });
  }

  res.json({ success: true });
});
