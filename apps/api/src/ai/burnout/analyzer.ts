export interface ActivityPattern {
  avgDailyHours: number;
  maxDailyHours: number;
  maxConsecutiveLongDays: number;
  avgActivityScore: number;
  weekendHours: number;
  lateNightSessions: number;
  maxContinuousHours: number;
  scheduleVariance: number;
  totalDaysWorked: number;
}

export class BurnoutAnalyzer {
  analyzePattern(logs: any[]): ActivityPattern {
    if (logs.length === 0) return this.empty();

    const dayMap = new Map<string, any[]>();
    for (const log of logs) {
      const day = new Date(log.startTime).toISOString().split('T')[0];
      if (!dayMap.has(day)) dayMap.set(day, []);
      dayMap.get(day)!.push(log);
    }

    const dailyHours: number[] = [];
    let weekendHours = 0;
    let lateNightSessions = 0;
    const startTimes: number[] = [];

    for (const [dateStr, dayLogs] of dayMap) {
      const dayOfWeek = new Date(dateStr).getDay();
      let totalMs = 0;

      for (const log of dayLogs) {
        const duration = (log.endTime || Date.now()) - log.startTime;
        totalMs += duration;

        const startHour = new Date(log.startTime).getHours();
        if (startHour >= 22 || startHour < 5) lateNightSessions++;
        startTimes.push(startHour);
      }

      const hours = totalMs / 3600000;
      dailyHours.push(hours);
      if (dayOfWeek === 0 || dayOfWeek === 6) weekendHours += hours;
    }

    // Consecutive long days (>8h)
    let maxConsecutive = 0;
    let current = 0;
    for (const h of dailyHours) {
      if (h > 8) { current++; maxConsecutive = Math.max(maxConsecutive, current); }
      else current = 0;
    }

    // Max continuous work (gaps < 30min counted as continuous)
    let maxContinuous = 0;
    let contHours = 0;
    const sorted = [...logs].sort((a, b) => a.startTime - b.startTime);
    for (let i = 0; i < sorted.length; i++) {
      contHours += ((sorted[i].endTime || Date.now()) - sorted[i].startTime) / 3600000;
      if (i < sorted.length - 1) {
        const gap = (sorted[i + 1].startTime - (sorted[i].endTime || Date.now())) / 60000;
        if (gap > 30) { maxContinuous = Math.max(maxContinuous, contHours); contHours = 0; }
      }
    }
    maxContinuous = Math.max(maxContinuous, contHours);

    // Schedule variance
    const avgStart = startTimes.reduce((a, b) => a + b, 0) / (startTimes.length || 1);
    const variance = startTimes.reduce((s, t) => s + Math.pow(t - avgStart, 2), 0) / (startTimes.length || 1);

    const avgActivity = logs.reduce((s, l) => s + (l.activityScore || 0), 0) / logs.length;

    return {
      avgDailyHours: dailyHours.reduce((a, b) => a + b, 0) / (dailyHours.length || 1),
      maxDailyHours: dailyHours.length ? Math.max(...dailyHours) : 0,
      maxConsecutiveLongDays: maxConsecutive,
      avgActivityScore: avgActivity,
      weekendHours,
      lateNightSessions,
      maxContinuousHours: maxContinuous,
      scheduleVariance: Math.sqrt(variance),
      totalDaysWorked: dayMap.size,
    };
  }

  private empty(): ActivityPattern {
    return {
      avgDailyHours: 0, maxDailyHours: 0, maxConsecutiveLongDays: 0,
      avgActivityScore: 0, weekendHours: 0, lateNightSessions: 0,
      maxContinuousHours: 0, scheduleVariance: 0, totalDaysWorked: 0,
    };
  }
}
