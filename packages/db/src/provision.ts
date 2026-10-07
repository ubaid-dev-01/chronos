import { Organization } from './models/Organization';
import { User } from './models/User';

/** Provision workspace on first signup org + admin user + ownerId FK */
export async function provisionWorkspace (input: {
  email: string;
  displayName: string;
  passwordHash: string;
  workspaceName?: string;
}) {
  const slug =
    input.email
      .split('@')[0]
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase() +
    '-' +
    Date.now();

  const org = await Organization.create({
    name: input.workspaceName ?? `${input.displayName}'s Workspace`,
    slug,
    planTier: 'free',
    seatLimit: 1,
  });

  const user = await User.create({
    orgId: org._id,
    email: input.email,
    passwordHash: input.passwordHash,
    role: 'admin',
    displayName: input.displayName,
    onlineHourlyRate: 0,
    offlineHourlyRate: 0,
    permissions: {
      canTrackOffline: true,
      canDeleteScreenshots: true,
      showPopupTimer: true,
      screenshotsEnabled: true,
      tasksEnabled: true,
      reportsEnabled: true,
      activityEnabled: true,
      insightsEnabled: true,
      commentsEnabled: true,
      canManageTeam: true,
      canLockTimetable: true,
    },
  });

  org.ownerId = user._id;
  await org.save();

  return { org, user };
}
