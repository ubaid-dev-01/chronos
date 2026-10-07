import mongoose, { Schema, Document } from 'mongoose';
import type { IPlatformAdmin } from '@chronos/types';

export interface PlatformAdminDocument
  extends Omit<IPlatformAdmin, '_id'>,
    Document {}

const platformAdminSchema = new Schema<PlatformAdminDocument>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, default: 'Super Admin', trim: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

platformAdminSchema.index({ email: 1 }, { unique: true });

export const PlatformAdmin =
  mongoose.models.PlatformAdmin ||
  mongoose.model<PlatformAdminDocument>('PlatformAdmin', platformAdminSchema);
