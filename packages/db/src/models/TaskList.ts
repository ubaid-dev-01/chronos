import mongoose, { Schema, Document } from 'mongoose';
import type { ITaskList } from '@chronos/types';

export interface TaskListDocument
  extends Omit<ITaskList, '_id' | 'orgId' | 'createdBy' | 'projectId'>,
    Document {
  orgId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
}

const taskListSchema = new Schema<TaskListDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    trackingEnabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

taskListSchema.index({ orgId: 1, isArchived: 1, order: 1 });
taskListSchema.index({ orgId: 1, projectId: 1 });

export const TaskList =
  mongoose.models.TaskList ||
  mongoose.model<TaskListDocument>('TaskList', taskListSchema);
