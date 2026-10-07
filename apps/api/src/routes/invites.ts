import { Router } from 'express';
import * as invitesCtrl from '../controllers/invites.controller';
import { authLimiter } from '../middleware/rate-limit';

export const inviteRoutes = Router();

inviteRoutes.get('/:token', invitesCtrl.getInvite);
// Account creation via invite same brute-force protection as register/login
inviteRoutes.post('/:token/accept', authLimiter, invitesCtrl.acceptInvite);
