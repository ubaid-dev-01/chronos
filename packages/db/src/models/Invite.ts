import mongoose, { Schema, Document } from 'mongoose';
import type { IInvite, UserRole } from '@chronos/types';

export interface InviteDocument
  extends Omit<IInvite, '_id' | 'orgId' | 'createdBy'>,
    Document {
  orgId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
}

const inviteSchema = new Schema<InviteDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    token: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'manager', 'member'] as UserRole[],
      default: 'member',
    },
    // Partial overrides only - unset keys fall back to role-based defaults
    // at acceptance time (see registerViaInvite in ./auth.ts).
    permissions: {
      type: {
        canTrackOffline: { type: Boolean },
        canDeleteScreenshots: { type: Boolean },
        showPopupTimer: { type: Boolean },
        screenshotsEnabled: { type: Boolean },
        tasksEnabled: { type: Boolean },
        reportsEnabled: { type: Boolean },
        activityEnabled: { type: Boolean },
        insightsEnabled: { type: Boolean },
        commentsEnabled: { type: Boolean },
        canManageTeam: { type: Boolean },
        canLockTimetable: { type: Boolean },
      },
      required: false,
      default: undefined,
      _id: false,
    },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

inviteSchema.index({ token: 1 }, { unique: true });
inviteSchema.index({ email: 1, orgId: 1 });
inviteSchema.index({ orgId: 1, createdBy: 1 });
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Invite =
  mongoose.models.Invite ||
  mongoose.model<InviteDocument>('Invite', inviteSchema);
