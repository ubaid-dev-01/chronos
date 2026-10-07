import mongoose, { Schema, Document } from 'mongoose';
import type { ITimetableLock } from '@chronos/types';

export interface TimetableLockDocument
  extends Omit<ITimetableLock, '_id' | 'orgId' | 'lockedBy'>,
    Document {
  orgId: mongoose.Types.ObjectId;
  lockedBy: mongoose.Types.ObjectId;
}

const timetableLockSchema = new Schema<TimetableLockDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    lockedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    status: {
      type: String,
      enum: ['open', 'locked'],
      default: 'open',
    },
    lockedAt: { type: Date },
  },
  { timestamps: true }
);

timetableLockSchema.index({ orgId: 1, weekStart: 1 }, { unique: true });

export const TimetableLock =
  mongoose.models.TimetableLock ||
  mongoose.model<TimetableLockDocument>('TimetableLock', timetableLockSchema);
