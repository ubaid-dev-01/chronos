/**
 * Seeds a demo project + assigned task for the desktop agent user.
 *
 * Usage (from repo root, with MONGODB_URI set):
 *   pnpm --filter @chronos/db seed:desktop-demo
 *
 * Env:
 *   DESKTOP_DEMO_EMAIL=desktop@chronos.app
 */
import { connectDB, mongoose, User, Project, TaskList, Task } from '../src/index';

async function seedDesktopDemo() {
  const email = (
    process.env.DESKTOP_DEMO_EMAIL || 'desktop@chronos.app'
  )
    .trim()
    .toLowerCase();

  await connectDB();

  const user = await User.findOne({ email }).lean();
  if (!user) {
    console.error(
      `User not found: ${email}. Register first, then re-run this seed.`
    );
    process.exit(1);
  }

  const orgId = user.orgId;
  const userId = user._id;

  let project = await Project.findOne({
    orgId,
    name: 'Desktop Demo',
    isActive: true,
  });

  if (!project) {
    project = await Project.create({
      orgId,
      createdBy: userId,
      name: 'Desktop Demo',
      description: 'Sample project for the Chronos desktop agent',
      colorHex: '#4f46e5',
      isActive: true,
    });
    console.log(`Created project: ${project.name}`);
  } else {
    console.log(`Using existing project: ${project.name}`);
  }

  let list = await TaskList.findOne({
    orgId,
    projectId: project._id,
    isArchived: false,
  });

  if (!list) {
    list = await TaskList.create({
      orgId,
      createdBy: userId,
      projectId: project._id,
      name: 'Agent work',
      trackingEnabled: true,
      order: 0,
      isArchived: false,
    });
    console.log(`Created task list: ${list.name}`);
  }

  let task = await Task.findOne({
    orgId,
    listId: list._id,
    title: 'Track time in Chronos agent',
    isComplete: false,
  });

  if (!task) {
    task = await Task.create({
      orgId,
      listId: list._id,
      createdBy: userId,
      assigneeId: userId,
      title: 'Track time in Chronos agent',
      isComplete: false,
      order: 0,
    });
    console.log(`Created assigned task: ${task.title}`);
  } else if (!task.assigneeId || String(task.assigneeId) !== String(userId)) {
    task.assigneeId = userId as typeof task.assigneeId;
    await task.save();
    console.log(`Assigned task to ${email}`);
  } else {
    console.log(`Task already assigned: ${task.title}`);
  }

  console.log('Desktop demo seed complete.');
  await mongoose.disconnect();
}

seedDesktopDemo().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
