import { Router } from 'express';
import { requirePermission } from '../middleware/permissions';
import { syncLimiter } from '../middleware/rate-limit';
import { validate } from '../middleware/validate';
import { syncActivitySchema, presencePingSchema } from '../validators/schemas';
import * as activityCtrl from '../controllers/activity.controller';

export const activityRoutes = Router();

activityRoutes.get('/usage', requirePermission('activityEnabled'), activityCtrl.getActivityUsage);
activityRoutes.post('/sync', syncLimiter, validate(syncActivitySchema), activityCtrl.syncActivityEvents);
activityRoutes.post('/presence', syncLimiter, validate(presencePingSchema), activityCtrl.updateLivePresence);
