import { Streak, StreakBadge } from './models/Streak';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function dateStringFromMs (ms: number): string {
  return new Date(ms).toISOString().split('T')[0];
}

function daysBetween (a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / MS_PER_DAY);
}

function badgesForStreak (currentStreak: number, existing: StreakBadge[]): StreakBadge[] {
  const next = new Set(existing);
  if (currentStreak >= 1) next.add('first_day');
  if (currentStreak >= 3) next.add('three_day_streak');
  if (currentStreak >= 7) next.add('week_warrior');
  if (currentStreak >= 14) next.add('fortnight_focus');
  if (currentStreak >= 30) next.add('month_master');
  if (currentStreak >= 100) next.add('century_club');
  return Array.from(next);
}

/**
 * Record that a user tracked time on `activityMs` (a TimeLog startTime).
 * Called after every successful sync to keep the daily streak current.
 * Idempotent for multiple syncs on the same UTC day.
 */
export async function recordStreakActivity (
  orgId: string,
  userId: string,
  activityMs: number,
  dayHours: number
): Promise<InstanceType<typeof Streak>> {
  const today = dateStringFromMs(activityMs);

  let streak = await Streak.findOne({ userId });
  if (!streak) {
    streak = await Streak.create({
      orgId,
      userId,
      currentStreak: 1,
      longestStreak: 1,
      totalActiveDays: 1,
      lastActiveDate: today,
      bestDayHours: dayHours,
      bestDayDate: today,
      badges: badgesForStreak(1, []),
    });
    return streak;
  }

  if (streak.lastActiveDate === today) {
    // Already recorded today just track the "most focused day" badge/best day.
    if (dayHours > streak.bestDayHours) {
      streak.bestDayHours = dayHours;
      streak.bestDayDate = today;
      if (!streak.badges.includes('most_focused_day')) {
        streak.badges = [...streak.badges, 'most_focused_day'];
      }
    }
    await streak.save();
    return streak;
  }

  const gap = streak.lastActiveDate ? daysBetween(streak.lastActiveDate, today) : null;
  streak.currentStreak = gap === 1 ? streak.currentStreak + 1 : 1;
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.totalActiveDays += 1;
  streak.lastActiveDate = today;

  if (dayHours > streak.bestDayHours) {
    streak.bestDayHours = dayHours;
    streak.bestDayDate = today;
  }

  streak.badges = badgesForStreak(streak.currentStreak, streak.badges as StreakBadge[]);
  if (streak.bestDayDate === today && !streak.badges.includes('most_focused_day')) {
    streak.badges = [...streak.badges, 'most_focused_day'];
  }

  await streak.save();
  return streak;
}

/**
 * Streaks decay if a user hasn't tracked time in >1 day. Call lazily when
 * reading a streak so stored state reflects "yesterday or today" reality
 * without needing a cron job.
 */
export function isStreakActive (lastActiveDate: string | null): boolean {
  if (!lastActiveDate) return false;
  const today = dateStringFromMs(Date.now());
  const gap = daysBetween(lastActiveDate, today);
  return gap <= 1;
}
