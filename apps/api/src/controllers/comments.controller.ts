import { Request, Response } from 'express';
import { Comment, User, TimeLog, Screenshot } from '@chronos/db';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../middleware/error-handler';
import { isManagerOrAdmin } from '../middleware/permissions';

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const { targetType, targetId, userId, limit = '50' } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = { orgId: req.orgId };

  if (targetType) filter.targetType = targetType;
  if (targetId) filter.targetId = targetId;

  const isManager = isManagerOrAdmin(req);
  if (userId) {
    if (userId !== req.userId && !isManager) {
      throw new ApiError(403, 'Can only view your own comments');
    }
    filter.userId = userId;
  } else if (!isManager && !targetType && !targetId) {
    filter.$or = [{ createdBy: req.userId }, { userId: req.userId }];
  }

  const limitNum = Math.min(parseInt(limit, 10) || 50, 100);

  const comments = await Comment.find(filter)
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .populate('userId', 'displayName email')
    .populate('createdBy', 'displayName')
    .lean();

  const data = (comments as any[]).map(c => ({
    _id: String(c._id),
    userId: String(c.userId?._id ?? c.userId),
    userName: c.userId?.displayName ?? 'Unknown',
    createdBy: String(c.createdBy?._id ?? c.createdBy),
    createdByName: c.createdBy?.displayName,
    targetType: c.targetType,
    targetId: c.targetId,
    text: c.text,
    createdAt: c.createdAt,
  }));

  res.json({ success: true, data });
});

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const { targetType, targetId, text, userId } = req.body;

  const isManager = isManagerOrAdmin(req);
  const subjectUserId = userId && isManager ? userId : req.userId;

  if (userId && userId !== req.userId && !isManager) {
    throw new ApiError(403, 'Cannot comment on behalf of another user');
  }

  if (targetType === 'day' && !/^\d{4}-\d{2}-\d{2}$/.test(String(targetId))) {
    throw new ApiError(400, 'Day comments require a YYYY-MM-DD targetId');
  }
  if (targetType === 'timelog') {
    const log = await TimeLog.findOne({ _id: targetId, orgId: req.orgId }).lean();
    if (!log) throw new ApiError(400, 'Time log not found');
  }
  if (targetType === 'screenshot') {
    const shot = await Screenshot.findOne({ _id: targetId, orgId: req.orgId }).lean();
    if (!shot) throw new ApiError(400, 'Screenshot not found');
  }
  if (targetType === 'user') {
    const subject = await User.findOne({ _id: targetId, orgId: req.orgId, isActive: true }).lean();
    if (!subject) throw new ApiError(400, 'User not found');
  }

  const comment = await Comment.create({
    orgId: req.orgId,
    userId: subjectUserId,
    createdBy: req.userId,
    targetType,
    targetId,
    text,
  });

  const populated = await Comment.findById(comment._id)
    .populate('userId', 'displayName email')
    .populate('createdBy', 'displayName')
    .lean();

  res.status(201).json({ success: true, data: populated });
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await Comment.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!comment) throw new ApiError(404, 'Comment not found');

  const isOwner = String(comment.createdBy) === req.userId;
  const isManager = ['admin', 'manager'].includes(req.user?.role);

  if (!isOwner && !isManager) {
    throw new ApiError(403, 'Cannot delete this comment');
  }

  await Comment.findByIdAndDelete(comment._id);
  res.json({ success: true, message: 'Comment deleted' });
});
