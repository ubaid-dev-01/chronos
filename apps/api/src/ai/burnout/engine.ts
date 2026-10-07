import { TimeLog, User } from '@chronos/db';
import { BurnoutAnalyzer, ActivityPattern } from './analyzer';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface BurnoutSignal {
  type: string;
  weight: number;
  value: number;
  threshold: number;
  triggered: boolean;
  description: string;
}

export interface BurnoutScore {
  userId: string;
  displayName: string;
  score: number;
  severity: AlertSeverity;
  signals: BurnoutSignal[];
  trend: 'improving' | 'stable' | 'worsening';
  recommendation: string;
}

const SIGNALS: Record<string, { weight: number; threshold: number; description: string }> = {
  EXCESSIVE_HOURS:        { weight: 0.25, threshold: 10,  description: 'Working more than 10 hours/day' },
  CONSECUTIVE_LONG_DAYS:  { weight: 0.20, threshold: 3,   description: 'Consecutive long work days' },
  DECLINING_ACTIVITY:     { weight: 0.20, threshold: 15,  description: 'Declining activity/engagement' },
  WEEKEND_WORK:           { weight: 0.10, threshold: 2,   description: 'Working on weekends' },
  LATE_NIGHT_WORK:        { weight: 0.10, threshold: 2,   description: 'Working late at night' },
  NO_BREAKS:              { weight: 0.10, threshold: 4,   description: 'Long stretches without breaks' },
  ERRATIC_SCHEDULE:       { weight: 0.05, threshold: 3,   description: 'Inconsistent schedule' },
};

export class BurnoutEngine {
  private analyzer = new BurnoutAnalyzer();

  async analyzeOrg(orgId: string): Promise<BurnoutScore[]> {
    const users = await User.find({ orgId, isActive: true }).lean() as any[];
    const scores: BurnoutScore[] = [];
    for (const user of users) {
      scores.push(await this.analyzeUser(user._id.toString(), user.displayName, orgId));
    }
    return scores.sort((a, b) => b.score - a.score);
  }

  async analyzeUser(userId: string, displayName: string, orgId?: string): Promise<BurnoutScore> {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 86400000;
    const fourteenDaysAgo = now - 14 * 86400000;
    const scope = orgId ? { orgId, userId } : { userId };

    const [recentLogs, olderLogs] = await Promise.all([
      TimeLog.find({ ...scope, startTime: { $gte: sevenDaysAgo } }).lean(),
      TimeLog.find({ ...scope, startTime: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }).lean(),
    ]);

    const recent = this.analyzer.analyzePattern(recentLogs as any[]);
    const older = this.analyzer.analyzePattern(olderLogs as any[]);

    const signals: BurnoutSignal[] = [];

    signals.push(this.eval('EXCESSIVE_HOURS', recent.avgDailyHours));
    signals.push(this.eval('CONSECUTIVE_LONG_DAYS', recent.maxConsecutiveLongDays));

    const actDelta = older.avgActivityScore > 0
      ? Math.abs(Math.min(0, ((recent.avgActivityScore - older.avgActivityScore) / older.avgActivityScore) * 100))
      : 0;
    signals.push(this.eval('DECLINING_ACTIVITY', actDelta));
    signals.push(this.eval('WEEKEND_WORK', recent.weekendHours));
    signals.push(this.eval('LATE_NIGHT_WORK', recent.lateNightSessions));
    signals.push(this.eval('NO_BREAKS', recent.maxContinuousHours));
    signals.push(this.eval('ERRATIC_SCHEDULE', recent.scheduleVariance));

    const score = Math.min(100, Math.round(
      signals.reduce((sum, s) => sum + (s.triggered ? s.weight * 100 * Math.min(s.value / s.threshold, 2) : 0), 0)
    ));

    const olderScore = this.historicalScore(older);
    const trend = score > olderScore + 10 ? 'worsening' : score < olderScore - 10 ? 'improving' : 'stable';
    const severity: AlertSeverity = score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 30 ? 'medium' : 'low';

    return { userId, displayName, score, severity, signals, trend, recommendation: this.recommend(signals, score) };
  }

  private eval(type: string, value: number): BurnoutSignal {
    const cfg = SIGNALS[type];
    return {
      type, weight: cfg.weight, value: Math.round(value * 100) / 100,
      threshold: cfg.threshold, triggered: value >= cfg.threshold, description: cfg.description,
    };
  }

  private historicalScore(p: ActivityPattern): number {
    let s = 0;
    if (p.avgDailyHours > 10) s += 25;
    if (p.maxConsecutiveLongDays > 3) s += 20;
    if (p.weekendHours > 2) s += 10;
    return Math.min(100, s);
  }

  private recommend(signals: BurnoutSignal[], score: number): string {
    if (score < 30) return 'Healthy work patterns. Keep it up!';
    const top = signals.filter(s => s.triggered).sort((a, b) => b.weight - a.weight)[0];
    const recs: Record<string, string> = {
      EXCESSIVE_HOURS: 'Consider reducing daily work hours for sustainable pace.',
      CONSECUTIVE_LONG_DAYS: 'Take a shorter day to recover from consecutive long days.',
      DECLINING_ACTIVITY: 'Activity levels dropping may indicate exhaustion.',
      WEEKEND_WORK: 'Avoid weekend work when possible. Rest days are essential.',
      LATE_NIGHT_WORK: 'Late-night work disrupts sleep. Consider shifting to mornings.',
      NO_BREAKS: 'Take regular breaks. Try the Pomodoro technique.',
      ERRATIC_SCHEDULE: 'Maintain a consistent schedule to reduce cognitive load.',
    };
    return recs[top?.type] || 'Multiple burnout signals detected. Review workload.';
  }
}
