import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

/** Treat missing or placeholder AWS keys as local disk storage (dev-safe). */
function hasRealAwsCredentials(accessKey?: string, secretKey?: string): boolean {
  if (!accessKey?.trim() || !secretKey?.trim()) return false;
  const dummy = /dummy|placeholder|changeme|example|your[_-]?aws|xxx+/i;
  if (dummy.test(accessKey) || dummy.test(secretKey)) return false;
  return true;
}

export const useLocalStorage = !hasRealAwsCredentials(
  env.AWS_ACCESS_KEY_ID,
  env.AWS_SECRET_ACCESS_KEY
);

export const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: !useLocalStorage
    ? {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

export const S3_BUCKET = env.AWS_S3_BUCKET;
