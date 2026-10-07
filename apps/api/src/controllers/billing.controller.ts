import { Request, Response } from 'express';
import { Organization } from '@chronos/db';
import { PLANS, PlanTier, resolveSeatLimit } from '@chronos/types';
import * as billingService from '../services/billing.service';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../middleware/error-handler';

export const getPlans = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: PLANS });
});

export const getCurrentSubscription = asyncHandler(async (req: Request, res: Response) => {
  const org = await Organization.findById(req.orgId) as any;
  if (!org) throw new ApiError(404, 'Organization not found');
  const plan = PLANS.find((p) => p.tier === org.planTier);
  res.json({
    success: true,
    data: { plan, seatLimit: resolveSeatLimit(org) },
  });
});

export const createCheckout = asyncHandler(async (req: Request, res: Response) => {
  const { planTier } = req.body as { planTier: PlanTier };
  if (!['starter', 'pro', 'enterprise'].includes(planTier)) {
    throw new ApiError(400, 'Invalid plan. Choose starter, pro, or enterprise.');
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = await billingService.createCheckoutSession(
    req.orgId!, planTier,
    `${appUrl}/settings/billing?success=true`,
    `${appUrl}/settings/billing?canceled=true`
  );
  res.json({ success: true, data: { url } });
});

export const handleStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  await billingService.handleWebhook(req.body, signature);
  res.json({ received: true });
});
