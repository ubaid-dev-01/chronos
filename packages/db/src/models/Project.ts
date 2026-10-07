import mongoose, { Schema, Document } from 'mongoose';
import type { IProject } from '@chronos/types';

export interface ProjectDocument
  extends Omit<IProject, '_id' | 'orgId' | 'createdBy'>,
    Document {
  orgId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
}

const projectSchema = new Schema<ProjectDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    colorHex: { type: String, default: '#6C2BD9', match: /^#[0-9A-Fa-f]{6}$/ },
    budgetHours: { type: Number, min: 0 },
    deadline: { type: Date },
    disableOfflineTracking: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

projectSchema.index({ orgId: 1 });
projectSchema.index({ orgId: 1, isActive: 1 });
projectSchema.index({ orgId: 1, name: 1 }, { unique: true });
projectSchema.index({ orgId: 1, createdBy: 1 });

export const Project =
  mongoose.models.Project ||
  mongoose.model<ProjectDocument>('Project', projectSchema);
