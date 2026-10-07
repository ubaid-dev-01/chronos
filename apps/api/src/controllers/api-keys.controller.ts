import { API_KEY_SCOPES, ApiKey, createApiKey, type ApiKeyScope } from '@chronos/db';
import { Request, Response } from 'express';
import { logAuditEvent } from '../integrations/enterprise/audit-log';
import { ApiError } from '../middleware/error-handler';
import { asyncHandler } from '../utils/async-handler';

/** GET /v1/api-keys list keys for the org (never returns the secret) */
export const listApiKeys = asyncHandler(async (req: Request, res: Response) => {
  const keys = await ApiKey.find({ orgId: req.orgId })
    .select('name keyPrefix scopes lastUsedAt revokedAt createdAt')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: keys });
});

/** POST /v1/api-keys create a new key. The raw secret is returned ONCE. */
export const createApiKeyHandler = asyncHandler(async (req: Request, res: Response) => {
  const { name, scopes } = req.body as { name?: string; scopes?: ApiKeyScope[] };
  if (!name || !name.trim()) throw new ApiError(400, 'Key name is required');

  if (scopes && !scopes.every((s) => API_KEY_SCOPES.includes(s))) {
    throw new ApiError(400, `Invalid scope. Allowed: ${API_KEY_SCOPES.join(', ')}`);
  }

  const { rawKey, apiKey } = await createApiKey({
    orgId: req.orgId!,
    createdBy: req.userId!,
    name: name.trim(),
    scopes,
  });

  await logAuditEvent({
    orgId: req.orgId!,
    userId: req.userId!,
    action: 'settings.updated',
    targetType: 'ApiKey',
    target: String(apiKey._id),
    details: { event: 'api_key.created', name: apiKey.name, scopes: apiKey.scopes },
    ipAddress: req.ip,
    userAgent: req.header('user-agent'),
  });

  res.status(201).json({
    success: true,
    data: {
      _id: apiKey._id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      scopes: apiKey.scopes,
      createdAt: apiKey.createdAt,
      // Only time the full secret is ever exposed store it now, it cannot be retrieved again.
      key: rawKey,
    },
  });
});

/** DELETE /v1/api-keys/:id revoke a key */
export const revokeApiKey = asyncHandler(async (req: Request, res: Response) => {
  const key = await ApiKey.findOneAndUpdate(
    { _id: req.params.id, orgId: req.orgId, revokedAt: null },
    { revokedAt: new Date() },
    { new: true }
  );
  if (!key) throw new ApiError(404, 'API key not found');

  await logAuditEvent({
    orgId: req.orgId!,
    userId: req.userId!,
    action: 'settings.updated',
    targetType: 'ApiKey',
    target: String(key._id),
    details: { event: 'api_key.revoked', name: key.name },
    ipAddress: req.ip,
    userAgent: req.header('user-agent'),
  });

  res.json({ success: true, message: 'API key revoked' });
});
