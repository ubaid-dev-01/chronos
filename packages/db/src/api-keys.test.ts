import { describe, it, expect } from 'vitest';
import { verifyApiKey } from './api-keys';

describe('verifyApiKey', () => {
  it('rejects empty keys without touching the database', async () => {
    expect(await verifyApiKey('')).toBeNull();
  });

  it('rejects keys with the wrong prefix without touching the database', async () => {
    expect(await verifyApiKey('sk_test_not_a_public_api_key')).toBeNull();
    expect(await verifyApiKey('random-string')).toBeNull();
  });
});
