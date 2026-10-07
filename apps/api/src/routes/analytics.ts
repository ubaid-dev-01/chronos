import { Router } from 'express';
import { requirePermission } from '../middleware/permissions';
import * as analyticsCtrl from '../controllers/analytics.controller';

export const analyticsRoutes = Router();

analyticsRoutes.use(requirePermission('insightsEnabled'));
analyticsRoutes.get('/focus', analyticsCtrl.getFocusScore);
analyticsRoutes.get('/project-health', analyticsCtrl.getProjectHealthReport);
