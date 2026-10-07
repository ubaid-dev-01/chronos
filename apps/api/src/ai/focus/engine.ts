import { TimeLog, User } from '@chronos/db';

export interface FocusBlock {
  startTime: number;
  endTime: number;
  durationMs: number;
  processName: string;
  windowTitle?: string;
  avgActivityScore: number;
  isDeepWork: boolean;
}

export interface FocusDaySummary {
  date: string;
  focusScore: number;
  deepWorkHours: number;
  totalHours: number;
}

export interface FocusScoreResult {
  userId: string;
  displayName?: string;
  startDate: string;
  endDate: string;
  focusScore: number;
  totalTrackedMs: number;
  deepWorkMs: number;
  fragmentedMs: number;
  idleMs: number;
  appSwitches: number;
  appSwitchesPerHour: number;
  longestDeepWorkMs: number;
  blocks: FocusBlock[];
  dailyScores: FocusDaySummary[];
}

export interface TeamFocusRow {
  userId: string;
  displayName: string;
  focusScore: number;
  deepWorkHours: number;
  totalHours: number;
}

interface LeanTimeLog {
  startTime: number;
  endTime?: number;
  activityScore?: number;
  processName?: string;
  windowTitle?: string;
}

// Tuning constants for the heuristic focus-score formula.
const DEEP_WORK_MIN_MS = 25 * 60 * 1000; // a block must run >=25min to count as "deep work"
const DEEP_WORK_MIN_ACTIVITY = 0.4; // and average activity score >=40%
const SESSION_GAP_MS = 5 * 60 * 1000; // a gap this long breaks contiguous tracking
const IDLE_ACTIVITY_THRESHOLD = 0.2; // logs below this activity score count as idle time
const MAX_SWITCHES_PER_HOUR_PENALTY = 10; // switch frequency at/above this is "maximally fragmented"

/**
 * Focus Score & Deep Work Analytics.
 *
 * Heuristic (not ML) engine that turns raw TimeLog entries into a 0-100
 * "focus score" from three signals:
 *  - deep work ratio (long, high-activity, single-app blocks vs total time)
 *  - idle ratio (low-activity tracked time)
 *  - app-switch frequency (context-switching cost)
 */
export class FocusEngine {
  async analyzeUser (
    userId: string,
    startMs: number,
    endMs: number,
    displayName?: string,
    orgId?: string
  ): Promise<FocusScoreResult> {
    const logs = (await TimeLog.find({
      ...(orgId ? { orgId } : {}),
      userId,
      startTime: { $gte: startMs, $lte: endMs },
    })
      .sort({ startTime: 1 })
      .lean()) as unknown as LeanTimeLog[];

    const blocks = this.buildBlocks(logs);
    const result = this.scoreBlocks(blocks, logs);
    const dailyScores = this.buildDailyScores(logs);

    return {
      userId,
      displayName,
      startDate: new Date(startMs).toISOString().split('T')[0],
      endDate: new Date(endMs).toISOString().split('T')[0],
      blocks,
      dailyScores,
      ...result,
    };
  }

  async analyzeTeam (orgId: string, startMs: number, endMs: number): Promise<TeamFocusRow[]> {
    const users = (await User.find({ orgId, isActive: true })
      .select('displayName')
      .lean()) as unknown as Array<{ _id: unknown; displayName: string }>;

    const rows: TeamFocusRow[] = [];
    for (const user of users) {
      const userId = String(user._id);
      const logs = (await TimeLog.find({
        orgId,
        userId,
        startTime: { $gte: startMs, $lte: endMs },
      }).lean()) as unknown as LeanTimeLog[];

      if (logs.length === 0) continue;

      const blocks = this.buildBlocks(logs);
      const { focusScore, deepWorkMs, totalTrackedMs } = this.scoreBlocks(blocks, logs);

      rows.push({
        userId,
        displayName: user.displayName,
        focusScore,
        deepWorkHours: Math.round((deepWorkMs / 3600000) * 10) / 10,
        totalHours: Math.round((totalTrackedMs / 3600000) * 10) / 10,
      });
    }

    return rows.sort((a, b) => b.focusScore - a.focusScore);
  }

  /** Merge contiguous same-app time log entries into blocks. */
  private buildBlocks (logs: LeanTimeLog[]): FocusBlock[] {
    const blocks: FocusBlock[] = [];

    for (const log of logs) {
      const end = log.endTime ?? log.startTime;
      const processName = log.processName?.trim() || 'Unknown app';
      const last = blocks[blocks.length - 1];

      const contiguous =
        last &&
        last.processName === processName &&
        log.startTime - last.endTime <= SESSION_GAP_MS;

      if (contiguous) {
        const prevWeight = last.durationMs;
        const addWeight = Math.max(end - log.startTime, 0);
        const totalWeight = prevWeight + addWeight || 1;
        last.avgActivityScore =
          (last.avgActivityScore * prevWeight + (log.activityScore ?? 0) * addWeight) / totalWeight;
        last.endTime = end;
        last.durationMs = last.endTime - last.startTime;
      } else {
        blocks.push({
          startTime: log.startTime,
          endTime: end,
          durationMs: Math.max(end - log.startTime, 0),
          processName,
          windowTitle: log.windowTitle,
          avgActivityScore: log.activityScore ?? 0,
          isDeepWork: false,
        });
      }
    }

    for (const block of blocks) {
      block.isDeepWork =
        block.durationMs >= DEEP_WORK_MIN_MS && block.avgActivityScore >= DEEP_WORK_MIN_ACTIVITY;
    }

    return blocks;
  }

  private scoreBlocks (blocks: FocusBlock[], logs: LeanTimeLog[]) {
    const totalTrackedMs = logs.reduce((sum, l) => sum + Math.max((l.endTime ?? l.startTime) - l.startTime, 0), 0);
    const deepWorkMs = blocks.filter(b => b.isDeepWork).reduce((sum, b) => sum + b.durationMs, 0);
    const idleMs = logs
      .filter(l => (l.activityScore ?? 0) < IDLE_ACTIVITY_THRESHOLD)
      .reduce((sum, l) => sum + Math.max((l.endTime ?? l.startTime) - l.startTime, 0), 0);
    const fragmentedMs = Math.max(totalTrackedMs - deepWorkMs, 0);
    const appSwitches = Math.max(blocks.length - 1, 0);
    const trackedHours = totalTrackedMs / 3600000;
    const appSwitchesPerHour = trackedHours > 0 ? appSwitches / trackedHours : 0;
    const longestDeepWorkMs = blocks.reduce((max, b) => (b.isDeepWork ? Math.max(max, b.durationMs) : max), 0);

    const deepWorkRatio = totalTrackedMs > 0 ? deepWorkMs / totalTrackedMs : 0;
    const idleRatio = totalTrackedMs > 0 ? idleMs / totalTrackedMs : 0;
    const switchPenalty = Math.min(appSwitchesPerHour / MAX_SWITCHES_PER_HOUR_PENALTY, 1);

    const focusScore = totalTrackedMs > 0
      ? Math.round(
          100 *
            (deepWorkRatio * 0.55 + (1 - idleRatio) * 0.25 + (1 - switchPenalty) * 0.2)
        )
      : 0;

    return {
      focusScore: Math.max(0, Math.min(100, focusScore)),
      totalTrackedMs,
      deepWorkMs,
      fragmentedMs,
      idleMs,
      appSwitches,
      appSwitchesPerHour: Math.round(appSwitchesPerHour * 10) / 10,
      longestDeepWorkMs,
    };
  }

  private buildDailyScores (logs: LeanTimeLog[]): FocusDaySummary[] {
    const byDay = new Map<string, LeanTimeLog[]>();
    for (const log of logs) {
      const date = new Date(log.startTime).toISOString().split('T')[0];
      if (!byDay.has(date)) byDay.set(date, []);
      byDay.get(date)!.push(log);
    }

    const days: FocusDaySummary[] = [];
    for (const [date, dayLogs] of byDay) {
      const blocks = this.buildBlocks(dayLogs);
      const { focusScore, deepWorkMs, totalTrackedMs } = this.scoreBlocks(blocks, dayLogs);
      days.push({
        date,
        focusScore,
        deepWorkHours: Math.round((deepWorkMs / 3600000) * 10) / 10,
        totalHours: Math.round((totalTrackedMs / 3600000) * 10) / 10,
      });
    }

    return days.sort((a, b) => a.date.localeCompare(b.date));
  }
}
