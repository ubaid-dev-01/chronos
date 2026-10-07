import mongoose, { Schema, Document } from 'mongoose';
import type { IUserPermissions } from '@chronos/types';

const userPermissionsSchema = new Schema<IUserPermissions>(
  {
    canTrackOffline: { type: Boolean, default: true },
    canDeleteScreenshots: { type: Boolean, default: true },
    showPopupTimer: { type: Boolean, default: true },
    screenshotsEnabled: { type: Boolean, default: true },
    tasksEnabled: { type: Boolean, default: true },
    reportsEnabled: { type: Boolean, default: true },
    activityEnabled: { type: Boolean, default: true },
    insightsEnabled: { type: Boolean, default: true },
    commentsEnabled: { type: Boolean, default: true },
    canManageTeam: { type: Boolean, default: false },
    canLockTimetable: { type: Boolean, default: false },
  },
  { _id: false }
);

export { userPermissionsSchema };
