import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Smoke-test the HTTP plumbing (route -> middleware -> controller -> response
// shape) for the auth login flow without touching a real MongoDB instance.
// Any model/function not explicitly stubbed below falls back to an inert
// generic mongoose-like object so unrelated routes can still be imported
// (routes/index.ts eagerly wires up every route module).
const mockLoginWithPassword = vi.fn();

vi.mock('@chronos/db', () => {
  // Minimal fake so `audit-log.ts` (pulled in transitively via routes/index.ts)
  // can construct its Schema at import time without a real mongoose install
  // in this app (apps/api doesn't declare mongoose as a direct dependency —
  // only @chronos/db does, and it isn't needed for this route's test).
  class FakeSchema {
    index() { return this; }
  }
  (FakeSchema as unknown as { Types: unknown }).Types = { ObjectId: 'ObjectId', Mixed: 'Mixed' };
  const fakeMongoose = { Schema: FakeSchema, models: {}, model: () => ({}) };

  const genericModel = () => ({
    find: () => ({
      sort: () => ({ skip: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }) }),
      lean: () => Promise.resolve([]),
    }),
    findOne: () => ({ select: () => ({ lean: () => Promise.resolve(null) }) }),
    findById: () => ({ select: () => ({ lean: () => Promise.resolve(null) }), lean: () => Promise.resolve(null) }),
    countDocuments: () => Promise.resolve(0),
    create: () => Promise.resolve({}),
    aggregate: () => Promise.resolve([]),
  });

  const stubs: Record<string, unknown> = {
    loginWithPassword: (...args: unknown[]) => mockLoginWithPassword(...args),
    registerWithPassword: vi.fn(),
    refreshWithToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    verifyAccessToken: vi.fn().mockRejectedValue(new Error('not used in this test')),
    connectDB: vi.fn(),
    mongoose: fakeMongoose,
  };

  return new Proxy(stubs, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      return genericModel();
    },
  });
});

const { app } = await import('../app');

describe('POST /v1/auth/login (smoke test)', () => {
  beforeEach(() => {
    mockLoginWithPassword.mockReset();
  });

  it('returns access + refresh tokens for valid credentials', async () => {
    mockLoginWithPassword.mockResolvedValue({
      accessToken: 'access-token-abc',
      refreshToken: 'refresh-token-xyz',
      expiresIn: 900,
    });

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'person@example.com', password: 'correct-horse' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBe('access-token-abc');
    expect(mockLoginWithPassword).toHaveBeenCalledWith(
      'person@example.com',
      'correct-horse'
    );
  });

  it('returns 401 for invalid credentials', async () => {
    mockLoginWithPassword.mockRejectedValue(new Error('INVALID_CREDENTIALS'));

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'person@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when email or password is missing', async () => {
    const res = await request(app).post('/v1/auth/login').send({ email: '' });

    expect(res.status).toBe(400);
    expect(mockLoginWithPassword).not.toHaveBeenCalled();
  });
});

describe('POST /v1/auth/register (smoke test)', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'a@b.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /v1 (public index)', () => {
  it('does not require authentication', async () => {
    const res = await request(app).get('/v1/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
