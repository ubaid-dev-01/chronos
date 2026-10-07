import mongoose, { Schema, Document } from 'mongoose';
import type { IOrganization, PlanTier } from '@chronos/types';

export interface OrganizationDocument extends Omit<IOrganization, '_id' | 'ownerId'>, Document {
  ownerId?: mongoose.Types.ObjectId;
}

const organizationSchema = new Schema<OrganizationDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    stripeCustomerId: { type: String },
    planTier: {
      type: String,
      enum: ['free', 'starter', 'pro', 'enterprise'] as PlanTier[],
      default: 'free',
    },
    seatLimit: { type: Number, default: 1, min: 1 },
    timezone: { type: String, default: 'UTC', trim: true, maxlength: 64 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ stripeCustomerId: 1 }, { sparse: true });

export const Organization =
  mongoose.models.Organization ||
  mongoose.model<OrganizationDocument>('Organization', organizationSchema);
