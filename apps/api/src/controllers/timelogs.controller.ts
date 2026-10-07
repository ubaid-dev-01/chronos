import { Request, Response } from 'express';
import { TimeLog, Screenshot, Project, Activity, Task, recordStreakActivity } from '@chronos/db';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../middleware/error-handler';
import { uploadScreenshot, deleteScreenshot } from '../services/screenshot.service';
import { emitToOrg, emitActivityFeed, updatePresence } from '../websocket';
import { logAuditEvent } from '../integrations/enterprise/audit-log';
import { isManagerOrAdmin, resolveScopedUserId } from '../middleware/permissions';

/** Sum of tracked time (ms) for a user today, used to keep the Team Pulse
 * "active time today" figure accurate whenever presence is broadcast. */
async function getTodayActiveMs(orgId: string, userId: string, now: number): Promise<number> {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const logs = await TimeLog.find({
    orgId,
    userId,
    startTime: { $gte: dayStart.getTime() },
  })
    .select('startTime endTime')
    .lean();

  return logs.reduce(
    (sum, log) => sum + Math.max((log.endTime ?? now) - log.startTime, 0),
    0
  );
}

/**
 * POST /timelogs/sync Batch sync from desktop agent
 */
export const syncTimeLogs = asyncHandler(async (req: Request, res: Response) => {
  const { batches } = req.body;

  if (!batches?.length) throw new ApiError(400, 'No batches provided');

  const orgId = req.orgId!;
  const userId = req.userId!;
  const permissions = req.user?.permissions ?? {};
  let syncedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];
  const syncedDays = new Set<string>();
  let lastSyncedProject: { name: string; colorHex: string } | null = null;
  let lastPresence: { status: 'active' | 'idle' | 'offline'; taskId?: string; endTime: number } | null = null;

  for (const batch of batches) {
    try {
      const project = await Project.findOne({
        _id: batch.projectId,
        orgId,
        isActive: true,
      });
      if (!project) {
        throw new Error('Invalid project for this organization');
      }

      // Enforce granular UserPermissions rather than trusting the agent payload.
      if (batch.isOffline) {
        if (permissions.canTrackOffline === false) {
          throw new Error('You do not have permission to track offline time');
        }
        if (project.disableOfflineTracking) {
          throw new Error('Offline tracking is disabled for this project');
        }
      }

      if (batch.taskId && permissions.tasksEnabled === false) {
        throw new Error('Task tracking is disabled for your account');
      }

      if (batch.taskId) {
        const task = await Task.findOne({
          _id: batch.taskId,
          orgId,
          assigneeId: userId,
          isComplete: false,
        });
        if (!task) {
          throw new Error('Invalid or unassigned task');
        }
      }

      const timelog = await TimeLog.create({
        orgId,
        userId,
        createdBy: userId,
        projectId: batch.projectId,
        taskId: batch.taskId || undefined,
        startTime: batch.startTime,
        endTime: batch.endTime,
        activityScore: batch.activityScore,
        isOffline: batch.isOffline,
        offlineReason: batch.offlineReason,
        windowTitle: batch.windowTitle,
        processName: batch.processName,
        source: 'agent',
      });

      if (batch.screenshot && permissions.screenshotsEnabled !== false) {
        try {
          const buffer = Buffer.from(batch.screenshot, 'base64');
          const { url, thumbnailUrl } = await uploadScreenshot(
            buffer, orgId, timelog._id.toString()
          );

          await Screenshot.create({
            orgId,
            userId,
            createdBy: userId,
            timelogId: timelog._id,
            s3Url: url,
            thumbnailUrl,
            timestamp: batch.startTime,
            isBlurred: true,
            sha256Hash: batch.sha256Hash,
          });

          emitToOrg(orgId, 'screenshot_new', {
            userId, thumbnailUrl, timestamp: batch.startTime,
          });
        } catch (screenshotErr: unknown) {
          // Keep the timelog even if screenshot upload fails (S3/local I/O).
          const msg =
            screenshotErr instanceof Error
              ? screenshotErr.message
              : 'Screenshot upload failed';
          errors.push(`Screenshot skipped: ${msg}`);
        }
      }

      emitToOrg(orgId, 'timelog_update', {
        userId, projectId: batch.projectId,
        activityScore: batch.activityScore,
      });

      syncedDays.add(new Date(batch.startTime).toISOString().split('T')[0]);
      lastSyncedProject = { name: project.name, colorHex: project.colorHex };

      const status = batch.isOffline
        ? 'offline'
        : batch.activityScore >= 0.2
          ? 'active'
          : 'idle';

      await Activity.create({
        orgId,
        userId,
        status,
        timestamp: batch.endTime ?? batch.startTime,
        windowTitle: batch.windowTitle,
        processName: batch.processName,
      });

      // Batches sync in chronological order, so the last one processed is
      // the most recent chunk of desktop-agent tracking track it for the
      // live Team Pulse presence update emitted below.
      if (!lastPresence || batch.endTime >= lastPresence.endTime) {
        lastPresence = { status, taskId: batch.taskId, endTime: batch.endTime };
      }

      syncedCount++;
    } catch (err: any) {
      failedCount++;
      errors.push(err.message || 'Unknown error');
    }
  }

  if (syncedCount > 0) {
    // Gamification: update the daily streak for each distinct day synced.
    for (const day of syncedDays) {
      try {
        const dayStart = new Date(`${day}T00:00:00.000Z`).getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;
        const dayLogs = await TimeLog.find({
          orgId, userId, startTime: { $gte: dayStart, $lte: dayEnd },
        }).select('startTime endTime').lean();
        const dayMs = dayLogs.reduce(
          (sum, l) => sum + Math.max((l.endTime ?? l.startTime) - l.startTime, 0),
          0
        );
        await recordStreakActivity(orgId, userId, dayStart, Math.round((dayMs / 3600000) * 10) / 10);
      } catch (err) {
        console.warn('Failed to record streak activity:', err);
      }
    }

    if (lastSyncedProject) {
      emitActivityFeed(orgId, {
        userId,
        userName: req.user?.displayName ?? 'Someone',
        type: 'session_start',
        message: `logged time on ${lastSyncedProject.name}`,
        projectName: lastSyncedProject.name,
        colorHex: lastSyncedProject.colorHex,
      });
    }

    if (lastPresence) {
      const activeTime = await getTodayActiveMs(orgId, userId, Date.now());
      updatePresence(orgId, {
        userId,
        userName: req.user?.displayName,
        status: lastPresence.status,
        currentProject: lastSyncedProject?.name ?? null,
        currentTask: lastPresence.taskId,
        activeTime,
      });
    }
  }

  res.json({
    success: failedCount === 0,
    syncedCount,
    failedCount,
    errors: errors.length > 0 ? errors : undefined,
  });
});

/**
 * POST /timelogs/start ClickUp-style manual timer start (web/mobile).
 * Starts a new running (endTime: null) time log for the current user. If a
 * timer is already running for this user, it is stopped first so there is
 * only ever one active session per person, exactly like ClickUp.
 */
export const startTimer = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.orgId!;
  const userId = req.userId!;
  const { projectId, taskId } = req.body;

  const project = await Project.findOne({ _id: projectId, orgId, isActive: true });
  if (!project) throw new ApiError(400, 'Invalid project for this organization');

  let task = null;
  if (taskId) {
    if (req.user?.permissions?.tasksEnabled === false) {
      throw new ApiError(403, 'Task tracking is disabled for your account');
    }
    task = await Task.findOne({ _id: taskId, orgId, isComplete: false });
    if (!task) throw new ApiError(400, 'Invalid or completed task');
  }

  const now = Date.now();

  const running = await TimeLog.findOne({ orgId, userId, endTime: null });
  if (running) {
    running.endTime = now;
    await running.save();
  }

  const timelog = await TimeLog.create({
    orgId,
    userId,
    createdBy: userId,
    projectId,
    taskId: taskId || undefined,
    startTime: now,
    endTime: null,
    activityScore: 1,
    isOffline: false,
    source: 'manual',
  });

  const populated = await TimeLog.findById(timelog._id)
    .populate('projectId', 'name colorHex')
    .populate('taskId', 'title')
    .lean();

  const activeTime = await getTodayActiveMs(orgId, userId, now);
  updatePresence(orgId, {
    userId,
    userName: req.user?.displayName,
    status: 'active',
    currentProject: project.name,
    currentTask: task?.title ?? null,
    activeTime,
  });

  emitActivityFeed(orgId, {
    userId,
    userName: req.user?.displayName ?? 'Someone',
    type: 'session_start',
    message: task ? `started tracking "${task.title}"` : `started tracking on ${project.name}`,
    projectName: project.name,
    colorHex: project.colorHex,
  });

  emitToOrg(orgId, 'timer_started', {
    userId,
    timelogId: String(timelog._id),
    projectId,
    taskId: taskId || null,
    startTime: now,
  });

  res.status(201).json({ success: true, data: populated });
});

/**
 * POST /timelogs/stop Stops the current user's running timer, if any.
 */
export const stopTimer = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.orgId!;
  const userId = req.userId!;

  const running = await TimeLog.findOne({ orgId, userId, endTime: null });
  if (!running) throw new ApiError(404, 'No active timer to stop');

  const now = Date.now();
  running.endTime = now;
  await running.save();

  const populated = await TimeLog.findById(running._id)
    .populate('projectId', 'name colorHex')
    .populate('taskId', 'title')
    .lean();

  const activeTime = await getTodayActiveMs(orgId, userId, now);
  const projectName = (populated as any)?.projectId?.name;
  updatePresence(orgId, {
    userId,
    userName: req.user?.displayName,
    status: 'idle',
    currentProject: projectName ?? null,
    currentTask: null,
    activeTime,
  });

  emitToOrg(orgId, 'timer_stopped', {
    userId,
    timelogId: String(running._id),
    endTime: now,
    durationMs: now - running.startTime,
  });

  res.json({ success: true, data: populated });
});

/**
 * GET /timelogs/active Returns the current user's running timer, if any.
 * Used by the web dashboard to restore the timer bar on page load/refresh.
 */
export const getActiveTimer = asyncHandler(async (req: Request, res: Response) => {
  const running = await TimeLog.findOne({
    orgId: req.orgId,
    userId: req.userId,
    endTime: null,
  })
    .populate('projectId', 'name colorHex')
    .populate('taskId', 'title')
    .lean();

  res.json({ success: true, data: running || null });
});

/**
 * GET /timelogs List time logs with filters (scoped to org)
 */
export const getTimeLogs = asyncHandler(async (req: Request, res: Response) => {
  const { userId, projectId, startDate, endDate, page = '1', limit = '50' } = req.query as any;

  const filter: any = { orgId: req.orgId };
  const scopedUserId = resolveScopedUserId(req, userId);
  if (scopedUserId) filter.userId = scopedUserId;
  if (projectId) filter.projectId = projectId;
  if (startDate || endDate) {
    filter.startTime = {};
    if (startDate) filter.startTime.$gte = new Date(startDate).getTime();
    if (endDate) filter.startTime.$lte = new Date(endDate).getTime();
  }

  const pageNum = parseInt(page, 10);
  const limitNum = Math.min(parseInt(limit, 10), 100);
  const skip = (pageNum - 1) * limitNum;

  const [timelogs, total] = await Promise.all([
    TimeLog.find(filter).sort({ startTime: -1 }).skip(skip).limit(limitNum)
      .populate('projectId', 'name colorHex').lean(),
    TimeLog.countDocuments(filter),
  ]);

  res.json({
    success: true, data: timelogs, total,
    page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum),
  });
});

/**
 * GET /timelogs/:id
 */
export const getTimeLog = asyncHandler(async (req: Request, res: Response) => {
  const timelog = await TimeLog.findOne({
    _id: req.params.id,
    orgId: req.orgId,
  })
    .populate('projectId', 'name colorHex').lean();
  if (!timelog) throw new ApiError(404, 'Time log not found');

  if (String((timelog as any).userId) !== req.userId && !isManagerOrAdmin(req)) {
    throw new ApiError(403, 'Can only view your own time logs');
  }

  const screenshots = await Screenshot.find({
    timelogId: (timelog as any)._id,
    orgId: req.orgId,
  }).lean();
  res.json({ success: true, data: { ...timelog, screenshots } });
});

/**
 * DELETE /timelogs/:id
 */
export const deleteTimeLog = asyncHandler(async (req: Request, res: Response) => {
  const timelog = await TimeLog.findOneAndDelete({
    _id: req.params.id,
    orgId: req.orgId,
  });
  if (!timelog) throw new ApiError(404, 'Time log not found');

  const related = await Screenshot.find({ timelogId: timelog._id, orgId: req.orgId });
  await Promise.all(
    related.map(async (shot) => {
      await deleteScreenshot(shot.s3Url).catch(() => {});
      if (shot.thumbnailUrl) await deleteScreenshot(shot.thumbnailUrl).catch(() => {});
    })
  );
  await Screenshot.deleteMany({ timelogId: timelog._id, orgId: req.orgId });

  await logAuditEvent({
    orgId: req.orgId!,
    userId: req.userId!,
    action: 'timelog.deleted',
    targetType: 'TimeLog',
    target: String(timelog._id),
    details: { ownerUserId: String(timelog.userId), projectId: String(timelog.projectId) },
    ipAddress: req.ip,
    userAgent: req.header('user-agent'),
  });

  res.json({ success: true, message: 'Time log deleted' });
});
