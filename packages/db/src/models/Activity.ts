import mongoose, { Schema, Document } from 'mongoose';
import type { IActivity, ActivityStatus } from '@chronos/types';

export interface ActivityDocument
  extends Omit<IActivity, '_id' | 'orgId' | 'userId'>,
    Document {
  orgId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}

const activitySchema = new Schema<ActivityDocument>({
  orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['active', 'idle', 'offline'] as ActivityStatus[],
    required: true,
  },
  timestamp: { type: Number, required: true },
  windowTitle: { type: String, trim: true },
  processName: { type: String, trim: true },
});

activitySchema.index({ orgId: 1, timestamp: -1 });
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

export const Activity =
  mongoose.models.Activity ||
  mongoose.model<ActivityDocument>('Activity', activitySchema);
