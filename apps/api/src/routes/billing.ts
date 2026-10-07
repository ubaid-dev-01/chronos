import { Router } from 'express';
import * as billingCtrl from '../controllers/billing.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { checkoutSchema } from '../validators/schemas';

export const billingRoutes = Router();

billingRoutes.post('/webhook', billingCtrl.handleStripeWebhook);

billingRoutes.get('/plans', authenticate, billingCtrl.getPlans);
billingRoutes.get('/subscription', authenticate, billingCtrl.getCurrentSubscription);
billingRoutes.post(
  '/checkout',
  authenticate,
  requireRole('admin'),
  validate(checkoutSchema),
  billingCtrl.createCheckout
);
