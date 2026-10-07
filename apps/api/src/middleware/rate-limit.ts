import rateLimit from 'express-rate-limit';

/** General API rate limit: 100 requests per minute */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});

/** Auth rate limit: 10 attempts per 15 minutes */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many auth attempts' },
});

/** Sync rate limit: 30 syncs per minute per agent */
export const syncLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.userId || req.ip || 'unknown',
  message: { success: false, error: 'Sync rate limit exceeded' },
});

/** Public REST API rate limit: 60 requests per minute per API key (falls back to IP) */
export const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.orgId || req.ip || 'unknown',
  message: { success: false, error: 'Public API rate limit exceeded' },
});
