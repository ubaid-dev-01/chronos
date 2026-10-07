import { Streak, User, isStreakActive } from '@chronos/db';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';

interface LeanStreak {
  userId: unknown;
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActiveDate: string | null;
  bestDayHours: number;
  bestDayDate: string | null;
  badges: string[];
}

/** GET /achievements/me the current user's streak + badges. */
export const getMyAchievements = asyncHandler(async (req: Request, res: Response) => {
  const streak = (await Streak.findOne({ userId: req.userId }).lean()) as unknown as LeanStreak | null;

  if (!streak) {
    return res.json({
      success: true,
      data: {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        lastActiveDate: null,
        bestDayHours: 0,
        bestDayDate: null,
        badges: [],
        streakActive: false,
      },
    });
  }

  res.json({
    success: true,
    data: {
      ...streak,
      currentStreak: isStreakActive(streak.lastActiveDate) ? streak.currentStreak : 0,
      streakActive: isStreakActive(streak.lastActiveDate),
    },
  });
});

/** GET /achievements/leaderboard org-wide streak leaderboard. */
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const streaks = (await Streak.find({ orgId: req.orgId })
    .sort({ currentStreak: -1, longestStreak: -1 })
    .limit(50)
    .lean()) as unknown as LeanStreak[];

  const userIds = streaks.map(s => s.userId);
  const users = await User.find({ _id: { $in: userIds } }).select('displayName').lean();
  const userMap = new Map(users.map(u => [String(u._id), u]));

  const leaderboard = streaks.map(s => {
    const active = isStreakActive(s.lastActiveDate);
    const user = userMap.get(String(s.userId));
    return {
      userId: String(s.userId),
      displayName: user?.displayName ?? 'Unknown',
      currentStreak: active ? s.currentStreak : 0,
      longestStreak: s.longestStreak,
      totalActiveDays: s.totalActiveDays,
      bestDayHours: s.bestDayHours,
      badges: s.badges,
      streakActive: active,
    };
  }).sort((a, b) => b.currentStreak - a.currentStreak || b.longestStreak - a.longestStreak);

  res.json({ success: true, data: leaderboard });
});
