import { z } from 'zod';

export const syncBatchSchema = z.object({
  batches: z.array(z.object({
    startTime: z.number().positive(),
    endTime: z.number().positive(),
    projectId: z.string().min(1),
    taskId: z.string().optional(),
    activityScore: z.number().min(0).max(1),
    isOffline: z.boolean().default(false),
    offlineReason: z.string().optional(),
    windowTitle: z.string().optional(),
    processName: z.string().optional(),
    screenshot: z.string().optional(),
    sha256Hash: z.string().optional(),
  })).min(1).max(100),
  agentVersion: z.string().min(1),
  platform: z.enum(['windows', 'macos', 'linux', 'ios', 'android']),
});

export const syncActivitySchema = z.object({
  events: z.array(z.object({
    status: z.enum(['active', 'idle', 'offline']),
    timestamp: z.number().positive(),
    windowTitle: z.string().optional(),
    processName: z.string().optional(),
  })).min(1).max(200),
  agentVersion: z.string().optional(),
  platform: z.enum(['windows', 'macos', 'linux']).optional(),
});

export const presencePingSchema = z.object({
  status: z.enum(['active', 'idle', 'offline']),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
});

export const startTimerSchema = z.object({
  projectId: z.string().min(1, 'Select a project to start tracking'),
  taskId: z.string().optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isActive: z.boolean().optional(),
});

const invitePermissionsSchema = z
  .object({
    canTrackOffline: z.boolean().optional(),
    canDeleteScreenshots: z.boolean().optional(),
    showPopupTimer: z.boolean().optional(),
    screenshotsEnabled: z.boolean().optional(),
    tasksEnabled: z.boolean().optional(),
    reportsEnabled: z.boolean().optional(),
    activityEnabled: z.boolean().optional(),
    insightsEnabled: z.boolean().optional(),
    commentsEnabled: z.boolean().optional(),
    canManageTeam: z.boolean().optional(),
    canLockTimetable: z.boolean().optional(),
  })
  .partial();

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'member']).default('member'),
  permissions: invitePermissionsSchema.optional(),
});

export const updateUserSchema = z.object({
  role: z.enum(['admin', 'manager', 'member']).optional(),
  hourlyRate: z.number().min(0).optional(),
  timezone: z.string().optional(),
  displayName: z.string().min(1).max(100).optional(),
  permissions: invitePermissionsSchema.optional(),
});

export const createTaskListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  trackingEnabled: z.boolean().optional(),
  projectId: z.string().min(1, 'Project is required for time tracking'),
});

export const updateTaskListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  trackingEnabled: z.boolean().optional(),
  projectId: z.string().nullable().optional(),
  order: z.number().int().min(0).optional(),
  isArchived: z.boolean().optional(),
});

export const createTaskItemSchema = z.object({
  title: z.string().min(1).max(200),
  assigneeId: z.string().optional(),
});

export const updateTaskItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  isComplete: z.boolean().optional(),
  assigneeId: z.string().nullable().optional(),
  order: z.number().int().min(0).optional(),
});

export const createCommentSchema = z.object({
  targetType: z.enum(['day', 'timelog', 'screenshot', 'user']),
  targetId: z.string().min(1),
  text: z.string().min(1).max(2000),
  userId: z.string().optional(),
});

export const updateOrgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().min(1).max(64).optional(),
});

export const checkoutSchema = z.object({
  planTier: z.enum(['starter', 'pro', 'enterprise']),
});

export const categorizeSchema = z.object({
  windowTitle: z.string().max(500).optional(),
  processName: z.string().max(200).optional(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.enum(['timelogs:read', 'projects:read', 'users:read'])).optional(),
});

export const savedReportSchema = z.object({
  name: z.string().min(1).max(200),
  dateRange: z.object({
    start: z.string().min(1),
    end: z.string().min(1),
  }),
  filters: z.record(z.unknown()).optional(),
  columns: z.array(z.string()).optional(),
});

export const updateMeSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  timezone: z.string().min(1).max(64).optional(),
});
