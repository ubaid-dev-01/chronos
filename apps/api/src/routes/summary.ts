import { Router } from 'express';
import * as summaryCtrl from '../controllers/summary.controller';

export const summaryRoutes = Router();

summaryRoutes.get('/calendar', summaryCtrl.getCalendarSummary);
summaryRoutes.get('/day', summaryCtrl.getDaySummary);
