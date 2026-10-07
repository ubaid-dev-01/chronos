import { Router } from 'express';
import { requireRole, requireSelfOrManager } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { inviteUserSchema, updateUserSchema, updateMeSchema } from '../validators/schemas';
import * as usersCtrl from '../controllers/users.controller';

export const userRoutes = Router();

userRoutes.get('/', usersCtrl.getUsers);
userRoutes.get('/me', usersCtrl.getMe);
userRoutes.put('/me', validate(updateMeSchema), usersCtrl.updateMe);
userRoutes.get('/invites', requireRole('manager'), usersCtrl.listInvites);
userRoutes.post('/invite', requireRole('manager'), validate(inviteUserSchema), usersCtrl.inviteUser);
userRoutes.delete('/invites/:id', requireRole('manager'), usersCtrl.revokeInvite);
userRoutes.get('/:id', requireSelfOrManager, usersCtrl.getUser);
userRoutes.put('/:id', requireRole('manager'), validate(updateUserSchema), usersCtrl.updateUser);
userRoutes.delete('/:id', requireRole('admin'), usersCtrl.removeUser);
