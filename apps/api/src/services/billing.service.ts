import { Organization } from '@chronos/db';
import { PLANS, PlanTier } from '@chronos/types';
import Stripe from 'stripe';
import { env } from '../config/env';
import { logAuditEvent } from '../integrations/enterprise/audit-log';
import { ApiError } from '../middleware/error-handler';

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

function requireStripe(): Stripe {
  if (!stripe) throw new ApiError(503, 'Stripe not configured');
  return stripe;
}

export async function getOrCreateCustomer(orgId: string): Promise<string> {
  const s = requireStripe();
  const org = await Organization.findById(orgId) as any;
  if (!org) throw new ApiError(404, 'Organization not found');

  if (org.stripeCustomerId) return org.stripeCustomerId;

  const customer = await s.customers.create({
    metadata: { orgId: orgId.toString() },
    name: org.name,
  });

  org.stripeCustomerId = customer.id;
  await org.save();
  return customer.id;
}

export async function createCheckoutSession(
  orgId: string, planTier: PlanTier, successUrl: string, cancelUrl: string
): Promise<string> {
  const s = requireStripe();
  const plan = PLANS.find((p) => p.tier === planTier);
  if (!plan) throw new ApiError(400, 'Invalid plan');

  const customerId = await getOrCreateCustomer(orgId);

  const session = await s.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `Chronos ${plan.name}`, description: plan.features.join(', ') },
        unit_amount: plan.price,
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { orgId, planTier },
  });

  return session.url!;
}

export async function handleWebhook(payload: Buffer, signature: string): Promise<void> {
  const s = requireStripe();
  const event = s.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { orgId, planTier } = session.metadata!;
      const plan = PLANS.find((p) => p.tier === planTier);
      if (plan) {
        const org = await Organization.findByIdAndUpdate(orgId, {
          planTier: plan.tier, seatLimit: plan.seatLimit,
        }, { new: true }) as any;
        await auditBillingEvent(org, 'billing.subscription_created', { planTier: plan.tier });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const org = await Organization.findOneAndUpdate(
        { stripeCustomerId: sub.customer as string },
        { planTier: 'free', seatLimit: 1 },
        { new: true }
      ) as any;
      await auditBillingEvent(org, 'billing.subscription_canceled', {});
      break;
    }
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice;
      console.warn(`Payment failed for customer: ${inv.customer}`);
      break;
    }
  }
}

/**
 * Stripe webhooks have no authenticated user in the request, so we attribute
 * the audit entry to the org owner when known. Best-effort never fails the
 * webhook if audit logging has an issue.
 */
async function auditBillingEvent (
  org: { _id: unknown; ownerId?: unknown } | null,
  action: 'billing.subscription_created' | 'billing.subscription_canceled',
  details: Record<string, unknown>
): Promise<void> {
  if (!org?.ownerId) return;
  try {
    await logAuditEvent({
      orgId: String(org._id),
      userId: String(org.ownerId),
      action,
      targetType: 'Organization',
      target: String(org._id),
      details,
    });
  } catch (err) {
    console.warn('Failed to write billing audit log:', err);
  }
}
