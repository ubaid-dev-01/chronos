import mongoose, { Schema, Document } from 'mongoose';

export type StreakBadge =
  | 'first_day'
  | 'three_day_streak'
  | 'week_warrior'
  | 'fortnight_focus'
  | 'month_master'
  | 'century_club'
  | 'most_focused_day';

export const STREAK_BADGES: StreakBadge[] = [
  'first_day',
  'three_day_streak',
  'week_warrior',
  'fortnight_focus',
  'month_master',
  'century_club',
  'most_focused_day',
];

export interface StreakDocument extends Document {
  orgId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActiveDate: string | null; // YYYY-MM-DD (UTC), the last day time was tracked
  bestDayHours: number;
  bestDayDate: string | null;
  badges: StreakBadge[];
  createdAt: Date;
  updatedAt: Date;
}

const streakSchema = new Schema<StreakDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    totalActiveDays: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: String, default: null },
    bestDayHours: { type: Number, default: 0, min: 0 },
    bestDayDate: { type: String, default: null },
    badges: { type: [String], enum: STREAK_BADGES, default: [] },
  },
  { timestamps: true }
);

streakSchema.index({ orgId: 1, currentStreak: -1 });

export const Streak =
  mongoose.models.Streak || mongoose.model<StreakDocument>('Streak', streakSchema);
