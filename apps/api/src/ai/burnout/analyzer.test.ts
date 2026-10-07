import { describe, it, expect } from 'vitest';
import { BurnoutAnalyzer } from './analyzer';

function log(startTime: number, endTime: number, activityScore = 0.6) {
  return { startTime, endTime, activityScore };
}

const DAY = 86400000;
const HOUR = 3600000;

describe('BurnoutAnalyzer.analyzePattern', () => {
  const analyzer = new BurnoutAnalyzer();

  it('returns a zeroed pattern for no logs', () => {
    const pattern = analyzer.analyzePattern([]);
    expect(pattern.avgDailyHours).toBe(0);
    expect(pattern.totalDaysWorked).toBe(0);
    expect(pattern.maxConsecutiveLongDays).toBe(0);
  });

  it('computes average daily hours across multiple days', () => {
    const day0 = Date.parse('2026-06-01T09:00:00Z');
    const day1 = Date.parse('2026-06-02T09:00:00Z');

    const logs = [
      log(day0, day0 + 4 * HOUR),
      log(day1, day1 + 6 * HOUR),
    ];

    const pattern = analyzer.analyzePattern(logs);
    expect(pattern.totalDaysWorked).toBe(2);
    expect(pattern.avgDailyHours).toBeCloseTo(5, 1);
    expect(pattern.maxDailyHours).toBeCloseTo(6, 1);
  });

  it('flags consecutive long (>8h) days', () => {
    const base = Date.parse('2026-06-01T08:00:00Z');
    const logs = [0, 1, 2].map((i) =>
      log(base + i * DAY, base + i * DAY + 10 * HOUR)
    );

    const pattern = analyzer.analyzePattern(logs);
    expect(pattern.maxConsecutiveLongDays).toBe(3);
  });

  it('detects weekend and late-night work', () => {
    // 2026-06-06 is a Saturday
    const saturday = Date.parse('2026-06-06T23:30:00Z');
    const logs = [log(saturday, saturday + 2 * HOUR)];

    const pattern = analyzer.analyzePattern(logs);
    expect(pattern.weekendHours).toBeGreaterThan(0);
    expect(pattern.lateNightSessions).toBeGreaterThan(0);
  });
});
