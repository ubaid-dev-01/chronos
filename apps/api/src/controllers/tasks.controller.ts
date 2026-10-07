import { Request, Response } from 'express';
import { TaskList, Task, User, Project } from '@chronos/db';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../middleware/error-handler';
import { emitActivityFeed } from '../websocket';

export const getTaskLists = asyncHandler(async (req: Request, res: Response) => {
  const includeArchived = req.query.includeArchived === 'true';

  const filter: Record<string, unknown> = { orgId: req.orgId };
  if (!includeArchived) filter.isArchived = false;

  const lists = await TaskList.find(filter)
    .sort({ order: 1, createdAt: -1 })
    .populate('projectId', 'name colorHex')
    .lean();

  const listIds = lists.map(l => l._id);
  const taskCounts = await Task.aggregate([
    { $match: { orgId: req.orgId, listId: { $in: listIds } } },
    {
      $group: {
        _id: '$listId',
        total: { $sum: 1 },
        completed: { $sum: { $cond: ['$isComplete', 1, 0] } },
      },
    },
  ]);

  const countMap = new Map(
    taskCounts.map((c: { _id: unknown; total: number; completed: number }) => [
      String(c._id),
      { total: c.total, completed: c.completed },
    ])
  );

  const data = lists.map((list: any) => ({
    _id: String(list._id),
    name: list.name,
    description: list.description,
    trackingEnabled: list.trackingEnabled,
    order: list.order,
    isArchived: list.isArchived,
    projectId: list.projectId ? String(list.projectId._id ?? list.projectId) : undefined,
    projectName: list.projectId?.name,
    taskCount: countMap.get(String(list._id))?.total ?? 0,
    completedCount: countMap.get(String(list._id))?.completed ?? 0,
    createdAt: list.createdAt,
  }));

  res.json({ success: true, data });
});

export const createTaskList = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, trackingEnabled, projectId } = req.body;

  const project = await Project.findOne({
    _id: projectId,
    orgId: req.orgId,
    isActive: true,
  });
  if (!project) throw new ApiError(400, 'Select a valid project for this task list');

  const count = await TaskList.countDocuments({ orgId: req.orgId, isArchived: false });
  const list = await TaskList.create({
    orgId: req.orgId,
    createdBy: req.userId,
    name,
    description,
    trackingEnabled: trackingEnabled ?? true,
    projectId,
    order: count,
  });

  res.status(201).json({ success: true, data: list });
});

export const updateTaskList = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.body;
  if (projectId) {
    const project = await Project.findOne({
      _id: projectId,
      orgId: req.orgId,
      isActive: true,
    });
    if (!project) throw new ApiError(400, 'Invalid project');
  }

  const list = await TaskList.findOneAndUpdate(
    { _id: req.params.id, orgId: req.orgId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!list) throw new ApiError(404, 'Task list not found');
  res.json({ success: true, data: list });
});

export const deleteTaskList = asyncHandler(async (req: Request, res: Response) => {
  const list = await TaskList.findOneAndUpdate(
    { _id: req.params.id, orgId: req.orgId },
    { isArchived: true },
    { new: true }
  );
  if (!list) throw new ApiError(404, 'Task list not found');
  res.json({ success: true, message: 'Task list archived' });
});

export const getTaskItems = asyncHandler(async (req: Request, res: Response) => {
  const list = await TaskList.findOne({ _id: req.params.listId, orgId: req.orgId });
  if (!list) throw new ApiError(404, 'Task list not found');

  const items = await Task.find({ orgId: req.orgId, listId: list._id })
    .sort({ order: 1, createdAt: 1 })
    .populate('assigneeId', 'displayName email')
    .lean();

  const data = (items as any[]).map(item => ({
    _id: String(item._id),
    listId: String(item.listId),
    title: item.title,
    isComplete: item.isComplete,
    order: item.order,
    assigneeId: item.assigneeId ? String(item.assigneeId._id ?? item.assigneeId) : undefined,
    assigneeName: item.assigneeId?.displayName,
    createdAt: item.createdAt,
  }));

  res.json({ success: true, data });
});

export const createTaskItem = asyncHandler(async (req: Request, res: Response) => {
  const list = await TaskList.findOne({ _id: req.params.listId, orgId: req.orgId });
  if (!list) throw new ApiError(404, 'Task list not found');

  const { title, assigneeId } = req.body;
  const count = await Task.countDocuments({ listId: list._id });

  if (assigneeId) {
    const assignee = await User.findOne({ _id: assigneeId, orgId: req.orgId, isActive: true });
    if (!assignee) throw new ApiError(400, 'Invalid assignee');
  }

  const task = await Task.create({
    orgId: req.orgId,
    listId: list._id,
    createdBy: req.userId,
    title,
    assigneeId: assigneeId || undefined,
    order: count,
  });

  const populated = await Task.findById(task._id)
    .populate('assigneeId', 'displayName email')
    .lean();

  res.status(201).json({ success: true, data: populated });
});

export const updateTaskItem = asyncHandler(async (req: Request, res: Response) => {
  const { title, isComplete, assigneeId, order } = req.body;
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (isComplete !== undefined) updates.isComplete = isComplete;
  if (order !== undefined) updates.order = order;
  if (assigneeId !== undefined) {
    if (assigneeId) {
      const assignee = await User.findOne({ _id: assigneeId, orgId: req.orgId, isActive: true });
      if (!assignee) throw new ApiError(400, 'Invalid assignee');
    }
    updates.assigneeId = assigneeId || null;
  }

  const previous = await Task.findOne({ _id: req.params.id, orgId: req.orgId }).select('isComplete');

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, orgId: req.orgId },
    updates,
    { new: true }
  ).populate('assigneeId', 'displayName email');

  if (!task) throw new ApiError(404, 'Task not found');

  if (isComplete === true && previous && !previous.isComplete) {
    emitActivityFeed(req.orgId!, {
      userId: req.userId!,
      userName: req.user?.displayName ?? 'Someone',
      type: 'task_completed',
      message: `completed "${task.title}"`,
    });
  }

  res.json({ success: true, data: task });
});

export const deleteTaskItem = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, orgId: req.orgId });
  if (!task) throw new ApiError(404, 'Task not found');
  res.json({ success: true, message: 'Task deleted' });
});

/** Tasks assigned to the current user (for desktop/mobile agent) */
export const getMyTasks = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const items = await Task.find({
    orgId: req.orgId,
    assigneeId: userId,
    isComplete: false,
  })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  const listIds = [...new Set(items.map((t) => String(t.listId)))];
  const lists = await TaskList.find({
    _id: { $in: listIds },
    orgId: req.orgId,
    isArchived: false,
    trackingEnabled: true,
  })
    .populate('projectId', 'name colorHex')
    .lean();

  const listMap = new Map(
    (lists as any[]).map((list) => [String(list._id), list])
  );

  const data = (items as any[])
    .map((item) => {
      const list = listMap.get(String(item.listId));
      if (!list) return null;
      const project = list.projectId;
      return {
        _id: String(item._id),
        title: item.title,
        listId: String(item.listId),
        listName: list.name,
        projectId: project ? String(project._id ?? project) : undefined,
        projectName: project?.name,
        projectColor: project?.colorHex,
      };
    })
    .filter(Boolean);

  res.json({ success: true, data });
});
