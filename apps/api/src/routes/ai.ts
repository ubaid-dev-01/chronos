import { Router } from 'express';
import { requireRole } from '../middleware/rbac';
import { requirePermission } from '../middleware/permissions';
import { asyncHandler } from '../utils/async-handler';
import { validate } from '../middleware/validate';
import { categorizeSchema } from '../validators/schemas';
import { BurnoutEngine } from '../ai/burnout/engine';
import { InsightsEngine } from '../ai/insights/engine';
import { CategorizationEngine } from '../ai/categorization/engine';
import { User } from '@chronos/db';
import { ApiError } from '../middleware/error-handler';

export const aiRoutes = Router();

aiRoutes.use(requirePermission('insightsEnabled'));

aiRoutes.get('/burnout', requireRole('manager'), asyncHandler(async (req, res) => {
  const engine = new BurnoutEngine();
  const scores = await engine.analyzeOrg(req.orgId!);
  res.json({ success: true, data: scores });
}));

aiRoutes.get('/burnout/:userId', requireRole('manager'), asyncHandler(async (req, res) => {
  const target = await User.findOne({
    _id: req.params.userId,
    orgId: req.orgId,
    isActive: true,
  }).select('displayName').lean() as { displayName?: string } | null;
  if (!target) throw new ApiError(404, 'User not found');

  const engine = new BurnoutEngine();
  const score = await engine.analyzeUser(req.params.userId, target.displayName || '', req.orgId!);
  res.json({ success: true, data: score });
}));

aiRoutes.get('/insights/me', asyncHandler(async (req, res) => {
  const engine = new InsightsEngine();
  const insights = await engine.generateUserInsights(req.userId!, req.orgId!);
  res.json({ success: true, data: insights });
}));

aiRoutes.post('/categorize', validate(categorizeSchema), asyncHandler(async (req, res) => {
  const { windowTitle, processName } = req.body;
  const engine = new CategorizationEngine();
  const result = await engine.categorize(req.orgId!, req.userId!, windowTitle, processName);
  res.json({ success: true, data: result });
}));
