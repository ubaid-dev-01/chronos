import { TimeLog, User } from '@chronos/db';
import { Request, Response } from 'express';
import { ApiError } from '../middleware/error-handler';
import { asyncHandler } from '../utils/async-handler';

function msToHhMm (ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * GET /summary/calendar?year=2026&month=7&userId=optional
 */
export const getCalendarSummary = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const year = parseInt(String(req.query.year ?? now.getFullYear()), 10);
  const month = parseInt(String(req.query.month ?? now.getMonth() + 1), 10);

  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    throw new ApiError(400, 'Invalid year or month');
  }

  const targetUserId = (req.query.userId as string) || req.userId;
  const isManager = ['admin', 'manager'].includes(req.user?.role);

  if (targetUserId !== req.userId && !isManager) {
    throw new ApiError(403, 'Can only view your own summary');
  }

  if (targetUserId !== req.userId) {
    const target = await User.findOne({ _id: targetUserId, orgId: req.orgId }).lean();
    if (!target) throw new ApiError(404, 'User not found');
  }

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const timelogs = await TimeLog.find({
    orgId: req.orgId,
    userId: targetUserId,
    startTime: {
      $gte: monthStart.getTime(),
      $lte: monthEnd.getTime(),
    },
  })
    .populate('projectId', 'name colorHex')
    .sort({ startTime: 1 })
    .lean();

  const dayMap = new Map<
    string,
    { date: string; totalMs: number; entries: Array<{
      projectId: string;
      projectName: string;
      colorHex: string;
      ms: number;
    }> }
  >();

  for (const log of timelogs as any[]) {
    const date = new Date(log.startTime).toISOString().split('T')[0];
    const duration = (log.endTime ?? Date.now()) - log.startTime;
    const projectId = String(log.projectId?._id ?? log.projectId);
    const projectName = log.projectId?.name ?? 'Unassigned';
    const colorHex = log.projectId?.colorHex ?? '#52525b';

    if (!dayMap.has(date)) {
      dayMap.set(date, { date, totalMs: 0, entries: [] });
    }
    const day = dayMap.get(date)!;
    day.totalMs += duration;

    const existing = day.entries.find(e => e.projectId === projectId);
    if (existing) {
      existing.ms += duration;
    } else {
      day.entries.push({ projectId, projectName, colorHex, ms: duration });
    }
  }

  const days = Array.from(dayMap.values()).map(d => ({
    ...d,
    totalHours: msToHhMm(d.totalMs),
    entries: d.entries.map(e => ({
      ...e,
      hours: msToHhMm(e.ms),
    })),
  }));

  // Weekly totals (Sun–Sat weeks overlapping month)
  const weekMap = new Map<string, number>();
  for (const day of days) {
    const d = new Date(day.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    weekMap.set(key, (weekMap.get(key) ?? 0) + day.totalMs);
  }

  const weekTotals = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, totalMs]) => ({
      weekStart,
      totalMs,
      totalHours: msToHhMm(totalMs),
    }));

  const monthTotalMs = days.reduce((sum, d) => sum + d.totalMs, 0);

  res.json({
    success: true,
    data: {
      year,
      month,
      userId: targetUserId,
      monthTotalMs,
      monthTotalHours: msToHhMm(monthTotalMs),
      days,
      weekTotals,
    },
  });
});

/**
 * GET /summary/day?date=2026-07-15&userId=optional drill-down for one day
 */
export const getDaySummary = asyncHandler(async (req: Request, res: Response) => {
  const dateStr = req.query.date as string;
  if (!dateStr) throw new ApiError(400, 'date query param required');

  const targetUserId = (req.query.userId as string) || req.userId;
  const isManager = ['admin', 'manager'].includes(req.user?.role);

  if (targetUserId !== req.userId && !isManager) {
    throw new ApiError(403, 'Can only view your own summary');
  }

  const dayStart = new Date(dateStr);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dateStr);
  dayEnd.setHours(23, 59, 59, 999);

  const timelogs = await TimeLog.find({
    orgId: req.orgId,
    userId: targetUserId,
    startTime: { $gte: dayStart.getTime(), $lte: dayEnd.getTime() },
  })
    .populate('projectId', 'name colorHex')
    .populate('userId', 'displayName email')
    .sort({ startTime: 1 })
    .lean();

  const byProject = new Map<string, { projectName: string; colorHex: string; users: Map<string, { name: string; ms: number }> }>();

  for (const log of timelogs as any[]) {
    const pid = String(log.projectId?._id ?? 'none');
    const pname = log.projectId?.name ?? 'Not selected';
    const color = log.projectId?.colorHex ?? '#52525b';
    const uid = String(log.userId?._id ?? log.userId);
    const uname = log.userId?.displayName ?? 'Unknown';
    const ms = (log.endTime ?? Date.now()) - log.startTime;

    if (!byProject.has(pid)) {
      byProject.set(pid, { projectName: pname, colorHex: color, users: new Map() });
    }
    const proj = byProject.get(pid)!;
    proj.users.set(uid, {
      name: uname,
      ms: (proj.users.get(uid)?.ms ?? 0) + ms,
    });
  }

  const breakdown = Array.from(byProject.entries()).map(([projectId, p]) => ({
    projectId,
    projectName: p.projectName,
    colorHex: p.colorHex,
    users: Array.from(p.users.entries()).map(([userId, u]) => ({
      userId,
      displayName: u.name,
      hours: msToHhMm(u.ms),
      totalMs: u.ms,
    })),
  }));

  // Chronological day flow (time-to-time blocks) for the timeline UI
  const timeline = (timelogs as any[]).map((log) => {
    const end = log.endTime ?? Date.now();
    return {
      _id: String(log._id),
      startTime: log.startTime,
      endTime: log.endTime ?? null,
      durationMs: end - log.startTime,
      hours: msToHhMm(end - log.startTime),
      activityScore: log.activityScore ?? 0,
      isOffline: !!log.isOffline,
      source: log.source ?? 'agent',
      processName: log.processName,
      windowTitle: log.windowTitle,
      projectId: String(log.projectId?._id ?? log.projectId ?? ''),
      projectName: log.projectId?.name ?? 'Not selected',
      colorHex: log.projectId?.colorHex ?? '#52525b',
    };
  });

  res.json({
    success: true,
    data: { date: dateStr, breakdown, timeline, totalMs: timeline.reduce((s, t) => s + t.durationMs, 0) },
  });
});
