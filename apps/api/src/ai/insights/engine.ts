import { TimeLog } from '@chronos/db';

export interface DailyInsight {
  type: 'deep_work' | 'productivity_peak' | 'context_switching' | 'focus_score';
  title: string;
  description: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  icon: string;
}

export class InsightsEngine {
  async generateUserInsights(userId: string, orgId?: string): Promise<DailyInsight[]> {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekAgo = now - 7 * 86400000;
    const scope = orgId ? { orgId, userId } : { userId };

    const [todayLogs, weekLogs] = await Promise.all([
      TimeLog.find({ ...scope, startTime: { $gte: todayStart } }).lean() as Promise<any[]>,
      TimeLog.find({ ...scope, startTime: { $gte: weekAgo } }).lean() as Promise<any[]>,
    ]);

    const insights: DailyInsight[] = [];

    // 1. Deep Work
    const deepWork = this.detectDeepWork(todayLogs);
    const avgDeepWork = this.avgDeepWork(weekLogs);
    insights.push({
      type: 'deep_work', title: 'Deep Work', icon: 'brain',
      description: `${deepWork.hours.toFixed(1)}h of uninterrupted focus today`,
      value: deepWork.hours, unit: 'hours',
      trend: deepWork.hours > avgDeepWork ? 'up' : deepWork.hours < avgDeepWork ? 'down' : 'stable',
    });

    // 2. Productivity Peak
    const peak = this.findPeak(weekLogs);
    insights.push({
      type: 'productivity_peak', title: 'Peak Hours', icon: 'zap',
      description: `Most productive: ${peak.startHour}:00 - ${peak.endHour}:00`,
      value: peak.avgActivity * 100, unit: '%', trend: 'stable',
    });

    // 3. Context Switching
    const switches = this.countSwitches(todayLogs);
    const avgSwitches = this.avgSwitches(weekLogs);
    insights.push({
      type: 'context_switching', title: 'Context Switches', icon: 'shuffle',
      description: `${switches} project switches today (avg: ${avgSwitches.toFixed(0)}/day)`,
      value: switches, unit: 'switches',
      trend: switches > avgSwitches * 1.2 ? 'up' : switches < avgSwitches * 0.8 ? 'down' : 'stable',
    });

    // 4. Focus Score
    const focusScore = this.calcFocusScore(todayLogs);
    insights.push({
      type: 'focus_score', title: 'Focus Score', icon: 'target',
      description: focusScore >= 80 ? 'Excellent focus today!' :
                   focusScore >= 60 ? 'Good focus. Reduce interruptions for more.' :
                   'High distraction level. Block notifications.',
      value: focusScore, unit: 'score', trend: 'stable',
    });

    return insights;
  }

  private detectDeepWork(logs: any[]): { hours: number; sessions: number } {
    let totalMs = 0; let sessions = 0;
    for (const log of logs) {
      const d = (log.endTime || Date.now()) - log.startTime;
      if (d >= 45 * 60000 && (log.activityScore || 0) >= 0.7) { totalMs += d; sessions++; }
    }
    return { hours: totalMs / 3600000, sessions };
  }

  private avgDeepWork(logs: any[]): number {
    const days = new Set(logs.map((l: any) => new Date(l.startTime).toDateString())).size || 1;
    return this.detectDeepWork(logs).hours / days;
  }

  private findPeak(logs: any[]): { startHour: number; endHour: number; avgActivity: number } {
    const hourly = new Map<number, { total: number; count: number }>();
    for (const log of logs) {
      const h = new Date(log.startTime).getHours();
      const c = hourly.get(h) || { total: 0, count: 0 };
      c.total += log.activityScore || 0; c.count++;
      hourly.set(h, c);
    }

    let best = { startHour: 9, endHour: 11, avgActivity: 0 };
    for (let h = 6; h <= 20; h++) {
      const h1 = hourly.get(h); const h2 = hourly.get(h + 1);
      if (h1 && h2) {
        const avg = (h1.total / h1.count + h2.total / h2.count) / 2;
        if (avg > best.avgActivity) best = { startHour: h, endHour: h + 2, avgActivity: avg };
      }
    }
    return best;
  }

  private countSwitches(logs: any[]): number {
    const sorted = [...logs].sort((a, b) => a.startTime - b.startTime);
    let switches = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].projectId?.toString() !== sorted[i - 1].projectId?.toString()) switches++;
    }
    return switches;
  }

  private avgSwitches(logs: any[]): number {
    const days = new Set(logs.map((l: any) => new Date(l.startTime).toDateString())).size || 1;
    return this.countSwitches(logs) / days;
  }

  private calcFocusScore(logs: any[]): number {
    if (logs.length === 0) return 0;
    const avgAct = logs.reduce((s: number, l: any) => s + (l.activityScore || 0), 0) / logs.length;
    const deep = this.detectDeepWork(logs);
    const totalH = logs.reduce((s: number, l: any) => s + ((l.endTime || Date.now()) - l.startTime), 0) / 3600000;
    const switches = this.countSwitches(logs);

    const actComp = avgAct * 40;
    const deepComp = totalH > 0 ? Math.min(30, (deep.hours / totalH) * 30) : 0;
    const switchPenalty = Math.max(0, 30 - switches * 3);
    return Math.round(actComp + deepComp + switchPenalty);
  }
}
