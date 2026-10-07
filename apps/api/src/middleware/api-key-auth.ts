import { Request, Response, NextFunction } from 'express';
import { verifyApiKey, type ApiKeyScope } from '@chronos/db';
import { ApiError } from './error-handler';

declare global {
  namespace Express {
    interface Request {
      apiKeyScopes?: ApiKeyScope[];
    }
  }
}

function extractKey (req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length).trim();

  const apiKeyHeader = req.header('x-api-key');
  return apiKeyHeader?.trim() || null;
}

/**
 * Authenticates requests to the public REST API (`/v1/public/*`) using an
 * organization-scoped API key instead of a user JWT. Attach with
 * `requireApiKeyScope('timelogs:read')` etc. per-route to enforce granular access.
 */
export async function authenticateApiKey (req: Request, _res: Response, next: NextFunction) {
  try {
    const rawKey = extractKey(req);
    if (!rawKey) {
      throw new ApiError(401, 'Missing API key. Provide it via `Authorization: Bearer <key>` or `X-API-Key`.');
    }

    const verified = await verifyApiKey(rawKey);
    if (!verified) {
      throw new ApiError(401, 'Invalid or revoked API key');
    }

    req.orgId = verified.orgId;
    req.apiKeyScopes = verified.scopes;
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(new ApiError(401, 'API key authentication failed'));
  }
}

export function requireApiKeyScope (scope: ApiKeyScope) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.apiKeyScopes?.includes(scope)) {
      return next(new ApiError(403, `API key is missing required scope: ${scope}`));
    }
    next();
  };
}
