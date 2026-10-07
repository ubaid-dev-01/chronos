import mongoose, { Schema, Document } from 'mongoose';
import type { IComment, CommentTargetType } from '@chronos/types';

export interface CommentDocument
  extends Omit<IComment, '_id' | 'orgId' | 'userId' | 'createdBy'>,
    Document {
  orgId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
}

const commentSchema = new Schema<CommentDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: {
      type: String,
      enum: ['day', 'timelog', 'screenshot', 'user'] as CommentTargetType[],
      required: true,
    },
    targetId: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: true }
);

commentSchema.index({ orgId: 1, targetType: 1, targetId: 1 });
commentSchema.index({ orgId: 1, userId: 1, createdAt: -1 });

export const Comment =
  mongoose.models.Comment ||
  mongoose.model<CommentDocument>('Comment', commentSchema);
