// ========================
// ORGANIZATION TYPES
// ========================
export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface IOrganization {
  _id: string;
  name: string;
  slug: string;
  /** FK → User who registered / owns this workspace (org admin) */
  ownerId?: string;
  stripeCustomerId?: string;
  planTier: PlanTier;
  seatLimit: number;
  timezone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// USER TYPES
// ========================
export type UserRole = 'admin' | 'manager' | 'member';

export interface IUserPermissions {
  canTrackOffline: boolean;
  canDeleteScreenshots: boolean;
  showPopupTimer: boolean;
  screenshotsEnabled: boolean;
  tasksEnabled: boolean;
  /** Menu: Reports page */
  reportsEnabled: boolean;
  /** Menu: Activity page */
  activityEnabled: boolean;
  /** Menu: Focus / Pulse / Health / Achievements */
  insightsEnabled: boolean;
  /** Menu: Comments page */
  commentsEnabled: boolean;
  canManageTeam: boolean;
  canLockTimetable: boolean;
}

// ========================
// PLATFORM ADMIN (SUPERADMIN)
// ========================
export interface IPlatformAdmin {
  _id: string;
  email: string;
  passwordHash?: string;
  displayName: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformStats {
  organizations: { total: number; active: number };
  users: { total: number; active: number };
  plans: Record<PlanTier, number>;
}

export interface IUser {
  _id: string;
  orgId: string;
  email: string;
  role: UserRole;
  displayName: string;
  hourlyRate: number;
  onlineHourlyRate: number;
  offlineHourlyRate: number;
  weeklyHourLimit: number;
  permissions: IUserPermissions;
  timezone: string;
  isActive: boolean;
  lastActiveAt?: Date;
  /** FK → admin who invited this user */
  invitedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// PROJECT TYPES
// ========================
export interface IProject {
  _id: string;
  orgId: string;
  createdBy: string;
  name: string;
  description?: string;
  colorHex: string;
  budgetHours?: number;
  deadline?: Date;
  disableOfflineTracking: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// TIMELOG TYPES
// ========================
export interface ITimeLog {
  _id: string;
  orgId: string;
  userId: string;
  projectId: string;
  /** Optional link to assigned task when tracked from agent */
  taskId?: string;
  createdBy: string;
  startTime: number;
  /** Null/undefined while the timer is still running */
  endTime?: number | null;
  activityScore: number;
  isOffline: boolean;
  offlineReason?: string;
  windowTitle?: string;
  processName?: string;
  /** Where this entry originated: the desktop agent (chunked, activity-scored)
   *  or a manual web/mobile "Start/Stop" timer press. */
  source: 'agent' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// SCREENSHOT TYPES
// ========================
export interface IScreenshot {
  _id: string;
  orgId: string;
  userId: string;
  timelogId: string;
  createdBy: string;
  s3Url: string;
  thumbnailUrl?: string;
  timestamp: number;
  isBlurred: boolean;
  sha256Hash?: string;
  createdAt: Date;
}

// ========================
// INVITE TYPES
// ========================
export interface IInvite {
  _id: string;
  orgId: string;
  createdBy: string;
  email: string;
  token: string;
  role: UserRole;
  /** Optional granular permission overrides admin picked when creating the invite */
  permissions?: Partial<IUserPermissions>;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
  /** Set when an admin/manager cancels the invite before it's accepted */
  revokedAt?: Date;
}

/** Permission keys that only an admin (never a manager) may grant on invite */
export const ADMIN_ONLY_PERMISSIONS: (keyof IUserPermissions)[] = [
  'canManageTeam',
  'canLockTimetable',
];

// ========================
// ACTIVITY / PRESENCE TYPES
// ========================
export type ActivityStatus = 'active' | 'idle' | 'offline';

export interface IActivity {
  _id: string;
  orgId: string;
  userId: string;
  status: ActivityStatus;
  timestamp: number;
  windowTitle?: string;
  processName?: string;
}

// ========================
// TASK MODULE TYPES
// ========================
export interface ITaskList {
  _id: string;
  orgId: string;
  createdBy: string;
  projectId?: string;
  name: string;
  description?: string;
  trackingEnabled: boolean;
  order: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  _id: string;
  orgId: string;
  listId: string;
  createdBy: string;
  assigneeId?: string;
  title: string;
  isComplete: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// COMMENT TYPES
// ========================
export type CommentTargetType = 'day' | 'timelog' | 'screenshot' | 'user';

export interface IComment {
  _id: string;
  orgId: string;
  userId: string;
  createdBy: string;
  targetType: CommentTargetType;
  targetId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// REPORT TYPES
// ========================
export interface ISavedReport {
  _id: string;
  orgId: string;
  createdBy: string;
  name: string;
  dateRange: { start: string; end: string };
  filters: Record<string, unknown>;
  columns: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// TIMETABLE LOCK TYPES
// ========================
export interface ITimetableLock {
  _id: string;
  orgId: string;
  lockedBy: string;
  weekStart: Date;
  weekEnd: Date;
  status: 'open' | 'locked';
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// API RESPONSE TYPES
// ========================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========================
// SYNC TYPES (Agent -> Server)
// ========================
export interface SyncBatch {
  startTime: number;
  endTime: number;
  projectId: string;
  taskId?: string;
  activityScore: number;
  isOffline: boolean;
  offlineReason?: string;
  windowTitle?: string;
  processName?: string;
  screenshot?: string;
}

export interface SyncRequest {
  batches: SyncBatch[];
  agentVersion: string;
  platform: 'windows' | 'macos' | 'linux' | 'ios' | 'android';
}

export interface SyncResponse {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors?: string[];
}

// ========================
// BILLING TYPES
// ========================
export interface IPlan {
  id: string;
  name: string;
  tier: PlanTier;
  price: number;
  seatLimit: number;
  features: string[];
}

export const PLANS: IPlan[] = [
  {
    id: 'plan_free',
    name: 'Free',
    tier: 'free',
    price: 0,
    seatLimit: 1,
    features: ['1 user', 'Basic time tracking', '7-day history'],
  },
  {
    id: 'plan_starter',
    name: 'Starter',
    tier: 'starter',
    price: 500,
    seatLimit: 2,
    features: ['2 users', 'Screenshots', '30-day history', 'CSV export'],
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    tier: 'pro',
    price: 1200,
    seatLimit: 5,
    features: ['5 users', 'Real-time presence', 'AI insights', 'Payroll export'],
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    price: 8900,
    seatLimit: 60,
    features: ['60 users', 'All features', 'SSO/SAML', 'Priority support', 'Custom branding'],
  },
];

/** Effective seats for invites honors plan tier when DB seatLimit is stale */
export function resolveSeatLimit(org: {
  planTier: PlanTier;
  seatLimit: number;
}): number {
  const planDefault = PLANS.find((p) => p.tier === org.planTier)?.seatLimit ?? 1;
  return Math.max(org.seatLimit, planDefault);
}

// ========================
// WEBSOCKET EVENT TYPES
// ========================
export enum WSEvent {
  JOIN_ORG = 'join_org',
  LEAVE_ORG = 'leave_org',
  STATUS_UPDATE = 'status_update',
  HEARTBEAT = 'heartbeat',
  PRESENCE_UPDATE = 'presence_update',
  TEAM_STATUS = 'team_status',
  SCREENSHOT_NEW = 'screenshot_new',
  TIMELOG_UPDATE = 'timelog_update',
  NOTIFICATION = 'notification',
  BURNOUT_ALERT = 'burnout_alert',
  ACTIVITY_FEED = 'activity_feed',
}

/** A single entry in the Team Pulse live activity feed */
export interface ActivityFeedEvent {
  id: string;
  orgId: string;
  userId: string;
  userName: string;
  type: 'session_start' | 'project_switch' | 'task_completed' | 'comment' | 'break' | 'streak';
  message: string;
  projectName?: string;
  colorHex?: string;
  timestamp: number;
}

export interface WSPresencePayload {
  userId: string;
  userName?: string;
  status: ActivityStatus;
  currentProject?: string | null;
  currentTask?: string | null;
  activeTime: number;
  lastScreenshot?: string;
}
