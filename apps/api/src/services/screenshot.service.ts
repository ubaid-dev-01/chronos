import fs from 'fs/promises';
import path from 'path';
import { createHmac } from 'crypto';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { s3, S3_BUCKET, useLocalStorage } from '../config/s3';
import { env } from '../config/env';

const LOCAL_PREFIX = 'local://';
const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'screenshots');

function signLocalKey(key: string, expiresAt: number): string {
  const sig = createHmac('sha256', env.JWT_ACCESS_SECRET || 'dev-local-files')
    .update(`${key}:${expiresAt}`)
    .digest('hex');
  return sig;
}

export function buildLocalFileUrl(key: string): string {
  const expiresAt = Date.now() + 60 * 60 * 1000;
  const sig = signLocalKey(key, expiresAt);
  const base = env.API_PUBLIC_URL.replace(/\/$/, '');
  const [orgId, timelogId, file] = key.split('/');
  return `${base}/v1/files/screenshots/${orgId}/${timelogId}/${file}?expires=${expiresAt}&sig=${sig}`;
}

export function verifyLocalFileAccess(
  key: string,
  expires: number,
  sig: string
): boolean {
  if (!expires || Date.now() > expires) return false;
  return signLocalKey(key, expires) === sig;
}

export async function uploadScreenshot(
  imageBuffer: Buffer,
  orgId: string,
  timelogId: string
): Promise<{ url: string; thumbnailUrl: string }> {
  const id = uuidv4();
  const key = `${orgId}/${timelogId}/${id}.webp`;
  const thumbKey = `${orgId}/${timelogId}/${id}_thumb.webp`;

  const [optimized, thumbnail] = await Promise.all([
    sharp(imageBuffer).resize(1920, null, { withoutEnlargement: true }).webp({ quality: 75 }).toBuffer(),
    sharp(imageBuffer).resize(320, null, { withoutEnlargement: true }).webp({ quality: 60 }).toBuffer(),
  ]);

  if (useLocalStorage) {
    const dir = path.join(UPLOAD_ROOT, orgId, timelogId);
    await fs.mkdir(dir, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(UPLOAD_ROOT, key), optimized),
      fs.writeFile(path.join(UPLOAD_ROOT, thumbKey), thumbnail),
    ]);
    return {
      url: `${LOCAL_PREFIX}${key}`,
      thumbnailUrl: `${LOCAL_PREFIX}${thumbKey}`,
    };
  }

  await Promise.all([
    s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET, Key: key, Body: optimized,
      ContentType: 'image/webp', ServerSideEncryption: 'AES256',
      Metadata: { orgId, timelogId },
    })),
    s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET, Key: thumbKey, Body: thumbnail,
      ContentType: 'image/webp', ServerSideEncryption: 'AES256',
    })),
  ]);

  return {
    url: `s3://${S3_BUCKET}/${key}`,
    thumbnailUrl: `s3://${S3_BUCKET}/${thumbKey}`,
  };
}

export async function getPresignedUrl(storedUrl: string): Promise<string> {
  if (storedUrl.startsWith(LOCAL_PREFIX)) {
    const key = storedUrl.slice(LOCAL_PREFIX.length);
    return buildLocalFileUrl(key);
  }
  const key = storedUrl.replace(`s3://${S3_BUCKET}/`, '');
  const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

export async function deleteScreenshot(storedUrl: string): Promise<void> {
  if (storedUrl.startsWith(LOCAL_PREFIX)) {
    const key = storedUrl.slice(LOCAL_PREFIX.length);
    await fs.unlink(path.join(UPLOAD_ROOT, key)).catch(() => {});
    return;
  }
  const key = storedUrl.replace(`s3://${S3_BUCKET}/`, '');
  await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}

export async function readLocalScreenshot(key: string): Promise<Buffer> {
  return fs.readFile(path.join(UPLOAD_ROOT, key));
}
