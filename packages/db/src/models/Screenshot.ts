import mongoose, { Schema, Document } from 'mongoose';
import type { IScreenshot } from '@chronos/types';

export interface ScreenshotDocument
  extends Omit<
      IScreenshot,
      '_id' | 'orgId' | 'userId' | 'timelogId' | 'createdBy'
    >,
    Document {
  orgId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  timelogId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
}

const screenshotSchema = new Schema<ScreenshotDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timelogId: { type: Schema.Types.ObjectId, ref: 'TimeLog', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    s3Url: { type: String, required: true },
    thumbnailUrl: { type: String },
    timestamp: { type: Number, required: true },
    isBlurred: { type: Boolean, default: true },
    sha256Hash: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

screenshotSchema.index({ orgId: 1, timestamp: -1 });
screenshotSchema.index({ orgId: 1, userId: 1, timestamp: -1 });
screenshotSchema.index({ timelogId: 1 });
screenshotSchema.index({ timestamp: -1 });

export const Screenshot =
  mongoose.models.Screenshot ||
  mongoose.model<ScreenshotDocument>('Screenshot', screenshotSchema);
