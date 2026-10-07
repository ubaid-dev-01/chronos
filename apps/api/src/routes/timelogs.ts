import { Router } from 'express';
import { requireRole } from '../middleware/rbac';
import { syncLimiter } from '../middleware/rate-limit';
import { validate } from '../middleware/validate';
import { syncBatchSchema, startTimerSchema } from '../validators/schemas';
import * as timelogsCtrl from '../controllers/timelogs.controller';

export const timelogRoutes = Router();

timelogRoutes.post('/sync', syncLimiter, validate(syncBatchSchema), timelogsCtrl.syncTimeLogs);

// ClickUp-style manual timer (web/mobile). Must be declared before the
// `/:id` routes below so "active"/"start"/"stop" aren't captured as an id.
timelogRoutes.get('/active', timelogsCtrl.getActiveTimer);
timelogRoutes.post('/start', validate(startTimerSchema), timelogsCtrl.startTimer);
timelogRoutes.post('/stop', timelogsCtrl.stopTimer);

timelogRoutes.get('/', timelogsCtrl.getTimeLogs);
timelogRoutes.get('/:id', timelogsCtrl.getTimeLog);
timelogRoutes.delete('/:id', requireRole('manager'), timelogsCtrl.deleteTimeLog);
