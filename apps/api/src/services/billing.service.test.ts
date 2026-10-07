import { describe, it, expect } from 'vitest';
import * as billingService from './billing.service';
import { ApiError } from '../middleware/error-handler';

// No STRIPE_SECRET_KEY is configured in the test environment, so the service
// should fail fast with a clear 503 rather than attempting a network call.
describe('billing.service (Stripe not configured)', () => {
  it('createCheckoutSession throws a 503 ApiError', async () => {
    await expect(
      billingService.createCheckoutSession('org1', 'pro', 'https://x/success', 'https://x/cancel')
    ).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).statusCode).toBe(503);
      return true;
    });
  });

  it('getOrCreateCustomer throws a 503 ApiError', async () => {
    await expect(billingService.getOrCreateCustomer('org1')).rejects.toMatchObject({
      statusCode: 503,
    });
  });

  it('handleWebhook throws a 503 ApiError', async () => {
    await expect(
      billingService.handleWebhook(Buffer.from('{}'), 'sig_test')
    ).rejects.toMatchObject({ statusCode: 503 });
  });
});
