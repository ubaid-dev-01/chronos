import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().default(''),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().default(''),
  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  AWS_ACCESS_KEY_ID: z.string().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().default(''),
  AWS_S3_BUCKET: z.string().default('chronos-screenshots'),
  AWS_REGION: z.string().default('us-east-1'),
  CORS_ORIGINS: z.string().transform((s) => s.split(',')).default('http://localhost:3000,http://localhost:1420'),
  API_PUBLIC_URL: z.string().default('http://localhost:4000'),
  APP_URL: z.string().default('http://localhost:3000'),
  RESEND_API_KEY: z.string().default(''),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .preprocess((v) => v === 'true' || v === true, z.boolean())
    .default(false),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('Chronos <onboarding@resend.dev>'),
  EMAIL_REPLY_TO: z.string().default(''),
  DOWNLOAD_BASE_URL: z.string().default('https://releases.chronos.app/desktop'),
  DOWNLOAD_URL_WINDOWS: z.string().default(''),
  DOWNLOAD_URL_MACOS: z.string().default(''),
  DOWNLOAD_URL_LINUX: z.string().default(''),
  DESKTOP_AGENT_VERSION: z.string().default('0.1.0'),
  MOBILE_IOS_URL: z.string().default(''),
  MOBILE_ANDROID_URL: z.string().default(''),
  INTERNAL_EMAIL_SECRET: z.string().default('chronos-dev-internal-email-secret'),
});

export const env = envSchema.parse(process.env);
