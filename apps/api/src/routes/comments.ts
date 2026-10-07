import { Router } from 'express';
import { requirePermission } from '../middleware/permissions';
import { validate } from '../middleware/validate';
import { createCommentSchema } from '../validators/schemas';
import * as commentsCtrl from '../controllers/comments.controller';

export const commentRoutes = Router();

commentRoutes.use(requirePermission('commentsEnabled'));
commentRoutes.get('/', commentsCtrl.getComments);
commentRoutes.post('/', validate(createCommentSchema), commentsCtrl.createComment);
commentRoutes.delete('/:id', commentsCtrl.deleteComment);
