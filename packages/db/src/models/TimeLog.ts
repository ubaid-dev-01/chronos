import mongoose, { Schema, Document } from 'mongoose';
import type { ITimeLog } from '@chronos/types';

export interface TimeLogDocument
  extends Omit<ITimeLog, '_id' | 'orgId' | 'userId' | 'projectId' | 'taskId' | 'createdBy'>,
    Document {
  orgId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
}

const timelogSchema = new Schema<TimeLogDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, default: null },
    activityScore: { type: Number, min: 0, max: 1, default: 0 },
    isOffline: { type: Boolean, default: false },
    offlineReason: { type: String, trim: true },
    windowTitle: { type: String, trim: true },
    processName: { type: String, trim: true },
    source: { type: String, enum: ['agent', 'manual'], default: 'agent' },
  },
  { timestamps: true }
);

timelogSchema.index({ orgId: 1, startTime: -1 });
timelogSchema.index({ orgId: 1, userId: 1, startTime: -1 });
timelogSchema.index({ userId: 1, startTime: -1 });
timelogSchema.index({ projectId: 1, startTime: -1 });
timelogSchema.index({ taskId: 1, startTime: -1 }, { sparse: true });
timelogSchema.index({ endTime: 1 }, { sparse: true });
// One running (endTime: null) timer per user this is the query the
// start/stop timer endpoints rely on to find/guard the active session.
timelogSchema.index({ orgId: 1, userId: 1, endTime: 1 });

export const TimeLog =
  mongoose.models.TimeLog ||
  mongoose.model<TimeLogDocument>('TimeLog', timelogSchema);
