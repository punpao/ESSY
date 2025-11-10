import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(10),
  LINE_CHANNEL_ID: z.string().min(1),
  LINE_CHANNEL_SECRET: z.string().min(1),
  PAYMENT_WEBHOOK_SECRET: z.string().default('mock_secret'),
  AUTO_RELEASE_HOURS: z.coerce.number().default(48),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);
