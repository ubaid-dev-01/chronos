import { Router } from 'express';
import { requirePermission } from '../middleware/permissions';
import * as achievementsCtrl from '../controllers/achievements.controller';

export const achievementRoutes = Router();

achievementRoutes.use(requirePermission('insightsEnabled'));
achievementRoutes.get('/me', achievementsCtrl.getMyAchievements);
achievementRoutes.get('/leaderboard', achievementsCtrl.getLeaderboard);
