/** Shared permission options for invite + edit member modals. Keep in sync with IUserPermissions. */

export interface PermissionOption {
  key: string
  label: string
  description: string
  adminOnly?: boolean
  group: 'tracking' | 'menus' | 'admin'
}

export const PERMISSION_OPTIONS: PermissionOption[] = [
  {
    key: 'tasksEnabled',
    label: 'Tasks menu',
    description: 'Can open Tasks and track time against assigned tasks',
    group: 'menus'
  },
  {
    key: 'screenshotsEnabled',
    label: 'Screenshots menu + capture',
    description: 'Desktop agent captures screenshots; Screenshots page is visible',
    group: 'menus'
  },
  {
    key: 'activityEnabled',
    label: 'Activity menu',
    description: 'Can view application and window usage',
    group: 'menus'
  },
  {
    key: 'reportsEnabled',
    label: 'Reports menu',
    description: 'Can open timesheet and report views',
    group: 'menus'
  },
  {
    key: 'commentsEnabled',
    label: 'Comments menu',
    description: 'Can view and leave day/timelog comments',
    group: 'menus'
  },
  {
    key: 'insightsEnabled',
    label: 'Insights menus',
    description: 'Focus, Pulse, Health, and Achievements pages',
    group: 'menus'
  },
  {
    key: 'canTrackOffline',
    label: 'Offline tracking',
    description: 'Can log time while offline / without an internet connection',
    group: 'tracking'
  },
  {
    key: 'canDeleteScreenshots',
    label: 'Delete own screenshots',
    description: 'Can delete their own captured screenshots',
    group: 'tracking'
  },
  {
    key: 'showPopupTimer',
    label: 'Floating timer popup',
    description: 'Shows the always-on-top timer widget in the desktop agent',
    group: 'tracking'
  },
  {
    key: 'canManageTeam',
    label: 'Manage team',
    description: 'Can invite/remove members and edit member roles',
    adminOnly: true,
    group: 'admin'
  },
  {
    key: 'canLockTimetable',
    label: 'Lock timetables',
    description: 'Can lock weekly timetables so past entries can’t be edited',
    adminOnly: true,
    group: 'admin'
  }
]

export function defaultPermissionsForRole (role: string): Record<string, boolean> {
  return {
    canTrackOffline: true,
    canDeleteScreenshots: role !== 'member',
    showPopupTimer: true,
    screenshotsEnabled: true,
    tasksEnabled: true,
    reportsEnabled: true,
    activityEnabled: true,
    insightsEnabled: true,
    commentsEnabled: true,
    canManageTeam: role === 'admin' || role === 'manager',
    canLockTimetable: role === 'admin'
  }
}
