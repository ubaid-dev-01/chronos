import { Router } from 'express';
import { requirePermission } from '../middleware/permissions';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { savedReportSchema } from '../validators/schemas';
import * as reportsCtrl from '../controllers/reports.controller';

export const reportRoutes = Router();

reportRoutes.use(requirePermission('reportsEnabled'));
reportRoutes.get('/timesheet', reportsCtrl.getTimesheet);
reportRoutes.get('/export', reportsCtrl.exportReport);
reportRoutes.get('/saved', reportsCtrl.listSavedReports);
reportRoutes.post('/saved', validate(savedReportSchema), reportsCtrl.createSavedReport);
reportRoutes.delete('/saved/:id', reportsCtrl.deleteSavedReport);
reportRoutes.get('/locks', reportsCtrl.listTimetableLocks);
reportRoutes.post('/locks', requireRole('admin'), reportsCtrl.lockTimetable);
reportRoutes.delete('/locks/:id', requireRole('admin'), reportsCtrl.unlockTimetable);
