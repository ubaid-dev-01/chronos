import mongoose, { Schema, Document } from 'mongoose';
import type { ISavedReport } from '@chronos/types';

export interface SavedReportDocument
  extends Omit<ISavedReport, '_id' | 'orgId' | 'createdBy'>,
    Document {
  orgId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
}

const savedReportSchema = new Schema<SavedReportDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    dateRange: {
      start: { type: String, required: true },
      end: { type: String, required: true },
    },
    filters: { type: Schema.Types.Mixed, default: {} },
    columns: { type: [String], default: [] },
  },
  { timestamps: true }
);

savedReportSchema.index({ orgId: 1, createdBy: 1 });

export const SavedReport =
  mongoose.models.SavedReport ||
  mongoose.model<SavedReportDocument>('SavedReport', savedReportSchema);
