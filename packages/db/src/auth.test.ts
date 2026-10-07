import { describe, it, expect, beforeAll } from 'vitest';
import { signAccessToken, verifyAccessToken } from './auth';

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
});

describe('signAccessToken / verifyAccessToken', () => {
  it('round-trips claims through a signed JWT', async () => {
    const token = await signAccessToken({
      sub: 'user-123',
      orgId: 'org-456',
      role: 'admin',
      email: 'person@example.com',
    });

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe('user-123');
    expect(payload.orgId).toBe('org-456');
    expect(payload.role).toBe('admin');
    expect(payload.email).toBe('person@example.com');
  });

  it('rejects a malformed token', async () => {
    await expect(verifyAccessToken('not.a.jwt')).rejects.toThrow();
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await signAccessToken({
      sub: 'user-1',
      orgId: 'org-1',
      role: 'member',
      email: 'a@b.com',
    });

    process.env.JWT_ACCESS_SECRET = 'b'.repeat(32);
    await expect(verifyAccessToken(token)).rejects.toThrow();
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
  });

  it('throws when JWT_ACCESS_SECRET is missing or too short', async () => {
    const original = process.env.JWT_ACCESS_SECRET;
    process.env.JWT_ACCESS_SECRET = 'too-short';

    await expect(
      signAccessToken({ sub: 'x', orgId: 'y', role: 'member', email: 'e@e.com' })
    ).rejects.toThrow(/at least 32 characters/);

    process.env.JWT_ACCESS_SECRET = original;
  });
});
