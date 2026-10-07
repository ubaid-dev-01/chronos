import { Router } from 'express';
import { requirePermission } from '../middleware/permissions';
import * as pulseCtrl from '../controllers/pulse.controller';

export const pulseRoutes = Router();

pulseRoutes.use(requirePermission('insightsEnabled'));
pulseRoutes.get('/feed', pulseCtrl.getActivityFeed);
