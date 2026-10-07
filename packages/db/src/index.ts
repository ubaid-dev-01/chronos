export { connectDB, mongoose } from './connection';

export { Organization } from './models/Organization';
export { User } from './models/User';
export { Project } from './models/Project';
export { TimeLog } from './models/TimeLog';
export { Screenshot } from './models/Screenshot';
export { Invite } from './models/Invite';
export { Activity } from './models/Activity';
export { PlatformAdmin } from './models/PlatformAdmin';
export { TaskList } from './models/TaskList';
export { Task } from './models/Task';
export { Comment } from './models/Comment';
export { SavedReport } from './models/SavedReport';
export { TimetableLock } from './models/TimetableLock';
export { RefreshToken } from './models/RefreshToken';
export { PasswordReset } from './models/PasswordReset';
export { ApiKey, API_KEY_SCOPES } from './models/ApiKey';
export { Streak, STREAK_BADGES } from './models/Streak';

export {
  signAccessToken,
  verifyAccessToken,
  issueAuthTokens,
  registerWithPassword,
  loginWithPassword,
  refreshWithToken,
  revokeRefreshToken,
  createPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPasswordWithOtp,
} from './auth';
export type { AccessTokenPayload, AuthTokens } from './auth';
export { getInvitePreview, registerViaInvite, joinOrgViaInvite } from './auth';

export type { OrganizationDocument } from './models/Organization';
export type { UserDocument } from './models/User';
export type { ProjectDocument } from './models/Project';
export type { TimeLogDocument } from './models/TimeLog';
export type { ScreenshotDocument } from './models/Screenshot';
export type { InviteDocument } from './models/Invite';
export type { ActivityDocument } from './models/Activity';
export type { PlatformAdminDocument } from './models/PlatformAdmin';
export type { TaskListDocument } from './models/TaskList';
export type { TaskDocument } from './models/Task';
export type { CommentDocument } from './models/Comment';
export type { SavedReportDocument } from './models/SavedReport';
export type { TimetableLockDocument } from './models/TimetableLock';
export type { RefreshTokenDocument } from './models/RefreshToken';
export type { PasswordResetDocument } from './models/PasswordReset';
export type { ApiKeyDocument, ApiKeyScope } from './models/ApiKey';
export type { StreakDocument, StreakBadge } from './models/Streak';

export { provisionWorkspace } from './provision';
export { createApiKey, verifyApiKey } from './api-keys';
export type { VerifiedApiKey } from './api-keys';
export { recordStreakActivity, isStreakActive } from './streaks';
