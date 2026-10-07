import { Request, Response } from 'express';
import { SavedReport, TimetableLock } from '@chronos/db';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../middleware/error-handler';
import * as reportService from '../services/report.service';
import { resolveScopedUserId } from '../middleware/permissions';
import { logAuditEvent } from '../integrations/enterprise/audit-log';

function mondayOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export const getTimesheet = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, userId, projectId } = req.query as Record<string, string>;
  if (!startDate || !endDate) throw new ApiError(400, 'startDate and endDate required');

  const scopedUserId = resolveScopedUserId(req, userId);
  const rows = await reportService.generateTimesheet({
    orgId: req.orgId!,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    userId: scopedUserId,
    projectId,
  });
  res.json({ success: true, data: rows });
});

export const exportReport = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, format = 'csv', userId, projectId } = req.query as Record<string, string>;
  if (!startDate || !endDate) throw new ApiError(400, 'startDate and endDate required');

  const scopedUserId = resolveScopedUserId(req, userId);
  const filter = {
    orgId: req.orgId!,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    userId: scopedUserId,
    projectId,
  };

  if (format === 'excel') {
    const buffer = await reportService.exportExcel(filter);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=chronos-report.xlsx`);
    res.send(buffer);
  } else {
    const csv = await reportService.exportCSV(filter);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=chronos-report.csv`);
    res.send(csv);
  }
});

export const listSavedReports = asyncHandler(async (req: Request, res: Response) => {
  const reports = await SavedReport.find({ orgId: req.orgId, createdBy: req.userId })
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ success: true, data: reports });
});

export const createSavedReport = asyncHandler(async (req: Request, res: Response) => {
  const { name, dateRange, filters, columns } = req.body;
  const report = await SavedReport.create({
    orgId: req.orgId,
    createdBy: req.userId,
    name,
    dateRange,
    filters: filters ?? {},
    columns: columns ?? [],
  });
  res.status(201).json({ success: true, data: report });
});

export const deleteSavedReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await SavedReport.findOneAndDelete({
    _id: req.params.id,
    orgId: req.orgId,
    createdBy: req.userId,
  });
  if (!report) throw new ApiError(404, 'Saved report not found');
  res.json({ success: true, message: 'Saved report deleted' });
});

export const listTimetableLocks = asyncHandler(async (req: Request, res: Response) => {
  const locks = await TimetableLock.find({ orgId: req.orgId })
    .sort({ weekStart: -1 })
    .limit(12)
    .populate('lockedBy', 'displayName')
    .lean();
  res.json({ success: true, data: locks });
});

export const lockTimetable = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.permissions?.canLockTimetable === false && req.user?.role !== 'admin') {
    throw new ApiError(403, 'You do not have permission to lock the timetable');
  }

  const weekStartInput = req.body?.weekStart ? new Date(req.body.weekStart) : new Date();
  const weekStart = mondayOf(weekStartInput);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const lock = await TimetableLock.findOneAndUpdate(
    { orgId: req.orgId, weekStart },
    {
      orgId: req.orgId,
      lockedBy: req.userId,
      weekStart,
      weekEnd,
      status: 'locked',
      lockedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await logAuditEvent({
    orgId: req.orgId!,
    userId: req.userId!,
    action: 'timetable.locked',
    targetType: 'TimetableLock',
    target: String(lock._id),
    details: { weekStart, weekEnd },
    ipAddress: req.ip,
    userAgent: req.header('user-agent'),
  });

  res.status(201).json({ success: true, data: lock });
});

export const unlockTimetable = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.permissions?.canLockTimetable === false && req.user?.role !== 'admin') {
    throw new ApiError(403, 'You do not have permission to unlock the timetable');
  }

  const lock = await TimetableLock.findOneAndUpdate(
    { _id: req.params.id, orgId: req.orgId },
    { status: 'open', lockedAt: null },
    { new: true }
  );
  if (!lock) throw new ApiError(404, 'Timetable lock not found');

  await logAuditEvent({
    orgId: req.orgId!,
    userId: req.userId!,
    action: 'timetable.unlocked',
    targetType: 'TimetableLock',
    target: String(lock._id),
    ipAddress: req.ip,
    userAgent: req.header('user-agent'),
  });

  res.json({ success: true, data: lock });
});
