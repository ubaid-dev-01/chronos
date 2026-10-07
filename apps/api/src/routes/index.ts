import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rate-limit';
import { healthRoutes } from './health';
import { authRoutes } from './auth';
import { orgRoutes } from './orgs';
import { userRoutes } from './users';
import { projectRoutes } from './projects';
import { timelogRoutes } from './timelogs';
import { screenshotRoutes } from './screenshots';
import { reportRoutes } from './reports';
import { billingRoutes } from './billing';
import { aiRoutes } from './ai';
import { summaryRoutes } from './summary';
import { taskRoutes } from './tasks';
import { commentRoutes } from './comments';
import { inviteRoutes } from './invites';
import { activityRoutes } from './activity';
import { publicRoutes } from './public';
import { apiKeyRoutes } from './api-keys';
import { analyticsRoutes } from './analytics';
import { pulseRoutes } from './pulse';
import { achievementRoutes } from './achievements';

export const router = Router();

// Public API index (browser hitting /v1 should not require auth)
router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Chronos API',
      version: '0.1.0',
      health: '/v1/health',
      healthJson: '/v1/health/json',
      dashboard: '/',
      auth: {
        login: 'POST /v1/auth/login',
        register: 'POST /v1/auth/register',
        me: 'GET /v1/auth/me (Bearer token required)',
      },
      note: 'Most /v1/* routes require Authorization: Bearer <accessToken>',
    },
  });
});

// Public
router.use('/health', healthRoutes);
router.use(publicRoutes);

// Billing (webhook is public, other routes have own auth)
router.use('/billing', billingRoutes);

// Public auth + invites
router.use('/auth', authRoutes);
router.use('/invites', inviteRoutes);

// Protected (all routes below require auth)
router.use(apiLimiter);
router.use(authenticate);

router.use('/orgs', orgRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/timelogs', timelogRoutes);
router.use('/screenshots', screenshotRoutes);
router.use('/reports', reportRoutes);
router.use('/summary', summaryRoutes);
router.use('/tasks', taskRoutes);
router.use('/comments', commentRoutes);
router.use('/activity', activityRoutes);
router.use('/ai', aiRoutes);
router.use('/api-keys', apiKeyRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/pulse', pulseRoutes);
router.use('/achievements', achievementRoutes);
