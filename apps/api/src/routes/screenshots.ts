import { Router } from 'express';
import * as screenshotCtrl from '../controllers/screenshots.controller';
import { requireRole } from '../middleware/rbac';
import { requirePermission } from '../middleware/permissions';

export const screenshotRoutes = Router();

screenshotRoutes.use(requirePermission('screenshotsEnabled'));
screenshotRoutes.get('/', screenshotCtrl.getScreenshots);
screenshotRoutes.get('/timeline', screenshotCtrl.getScreenshotTimeline);
screenshotRoutes.get('/:id', screenshotCtrl.getScreenshot);
screenshotRoutes.delete('/:id', requireRole('member'), screenshotCtrl.deleteScreenshot);
