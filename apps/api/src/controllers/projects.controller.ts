import { Request, Response } from 'express';
import { Project, TimeLog } from '@chronos/db';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../middleware/error-handler';
import { logAuditEvent } from '../integrations/enterprise/audit-log';

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await Project.find({ orgId: req.orgId, isActive: true })
    .sort({ name: 1 }).lean();
  res.json({ success: true, data: projects });
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, colorHex } = req.body;

  const existing = await Project.findOne({ orgId: req.orgId, name });
  if (existing) throw new ApiError(409, 'Project with this name already exists');

  const project = await Project.create({
    orgId: req.orgId,
    createdBy: req.userId,
    name,
    description,
    colorHex: colorHex || '#6C2BD9',
  });

  await logAuditEvent({
    orgId: req.orgId!,
    userId: req.userId!,
    action: 'project.created',
    targetType: 'Project',
    target: String(project._id),
    details: { name: project.name },
    ipAddress: req.ip,
    userAgent: req.header('user-agent'),
  });

  res.status(201).json({ success: true, data: project });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findOne({ _id: req.params.id, orgId: req.orgId }).lean();
  if (!project) throw new ApiError(404, 'Project not found');
  res.json({ success: true, data: project });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, orgId: req.orgId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!project) throw new ApiError(404, 'Project not found');

  await logAuditEvent({
    orgId: req.orgId!,
    userId: req.userId!,
    action: 'project.updated',
    targetType: 'Project',
    target: String(project._id),
    details: req.body,
    ipAddress: req.ip,
    userAgent: req.header('user-agent'),
  });

  res.json({ success: true, data: project });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, orgId: req.orgId },
    { isActive: false }, { new: true }
  );
  if (!project) throw new ApiError(404, 'Project not found');

  await logAuditEvent({
    orgId: req.orgId!,
    userId: req.userId!,
    action: 'project.deleted',
    targetType: 'Project',
    target: String(project._id),
    details: { name: project.name },
    ipAddress: req.ip,
    userAgent: req.header('user-agent'),
  });

  res.json({ success: true, message: 'Project archived' });
});

export const getProjectStats = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as Record<string, string>;
  const match: any = { orgId: req.orgId, projectId: req.params.id };
  if (startDate) match.startTime = { ...match.startTime, $gte: new Date(startDate).getTime() };
  if (endDate) match.startTime = { ...match.startTime, $lte: new Date(endDate).getTime() };

  const stats = await TimeLog.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$userId',
        totalMs: { $sum: { $subtract: [{ $ifNull: ['$endTime', Date.now()] }, '$startTime'] } },
        avgActivity: { $avg: '$activityScore' },
        sessions: { $sum: 1 },
      },
    },
    { $sort: { totalMs: -1 } },
  ]);
  res.json({ success: true, data: stats });
});
