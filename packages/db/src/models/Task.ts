import mongoose, { Schema, Document } from 'mongoose';
import type { ITask } from '@chronos/types';

export interface TaskDocument
  extends Omit<ITask, '_id' | 'orgId' | 'listId' | 'createdBy' | 'assigneeId'>,
    Document {
  orgId: mongoose.Types.ObjectId;
  listId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  assigneeId?: mongoose.Types.ObjectId;
}

const taskSchema = new Schema<TaskDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    listId: { type: Schema.Types.ObjectId, ref: 'TaskList', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true, trim: true, maxlength: 500 },
    isComplete: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

taskSchema.index({ orgId: 1, listId: 1, order: 1 });
taskSchema.index({ orgId: 1, assigneeId: 1 });

export const Task =
  mongoose.models.Task || mongoose.model<TaskDocument>('Task', taskSchema);
