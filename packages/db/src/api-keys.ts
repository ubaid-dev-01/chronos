import { createHash, randomBytes } from 'crypto';
import { API_KEY_SCOPES, ApiKey, ApiKeyScope } from './models/ApiKey';

const KEY_PREFIX = 'ck_live_';

function hashApiKey (raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/** Generates a new public-API key. Returns the raw secret ONCE only the hash is persisted. */
export async function createApiKey (input: {
  orgId: string;
  createdBy: string;
  name: string;
  scopes?: ApiKeyScope[];
}): Promise<{ rawKey: string; apiKey: InstanceType<typeof ApiKey> }> {
  const secret = randomBytes(24).toString('base64url');
  const rawKey = `${KEY_PREFIX}${secret}`;

  const apiKey = await ApiKey.create({
    orgId: input.orgId,
    createdBy: input.createdBy,
    name: input.name,
    keyPrefix: rawKey.slice(0, 12),
    keyHash: hashApiKey(rawKey),
    scopes: input.scopes && input.scopes.length > 0 ? input.scopes : API_KEY_SCOPES,
  });

  return { rawKey, apiKey };
}

export interface VerifiedApiKey {
  keyId: string;
  orgId: string;
  scopes: ApiKeyScope[];
}

/** Verifies a raw API key string and returns its scope, or null if invalid/revoked. */
export async function verifyApiKey (rawKey: string): Promise<VerifiedApiKey | null> {
  if (!rawKey || !rawKey.startsWith(KEY_PREFIX)) return null;

  const keyHash = hashApiKey(rawKey);
  const record = await ApiKey.findOne({ keyHash, revokedAt: null });
  if (!record) return null;

  // Best-effort usage tracking; failure to update shouldn't block the request.
  ApiKey.updateOne({ _id: record._id }, { lastUsedAt: new Date() }).catch(() => undefined);

  return {
    keyId: String(record._id),
    orgId: String(record.orgId),
    scopes: record.scopes,
  };
}
