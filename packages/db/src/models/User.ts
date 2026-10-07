import mongoose, { Schema, Document } from 'mongoose';
import type { IUser, UserRole } from '@chronos/types';
import { userPermissionsSchema } from '../schema/user-permissions';

export interface UserDocument
  extends Omit<
      IUser,
      '_id' | 'orgId' | 'invitedBy' | 'permissions'
    >,
    Document {
  orgId: mongoose.Types.ObjectId;
  invitedBy?: mongoose.Types.ObjectId;
  permissions: IUser['permissions'];
  passwordHash?: string;
}

const userSchema = new Schema<UserDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    passwordHash: { type: String, select: false },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ['admin', 'manager', 'member'] as UserRole[],
      default: 'member',
    },
    displayName: { type: String, required: true, trim: true, maxlength: 100 },
    hourlyRate: { type: Number, default: 0, min: 0 },
    onlineHourlyRate: { type: Number, default: 0, min: 0 },
    offlineHourlyRate: { type: Number, default: 0, min: 0 },
    weeklyHourLimit: { type: Number, default: 40, min: 0 },
    permissions: { type: userPermissionsSchema, default: () => ({}) },
    timezone: { type: String, default: 'UTC' },
    isActive: { type: Boolean, default: true },
    lastActiveAt: { type: Date },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

userSchema.index({ orgId: 1 });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ orgId: 1, isActive: 1 });
userSchema.index({ orgId: 1, role: 1 });

export const User =
  mongoose.models.User || mongoose.model<UserDocument>('User', userSchema);
