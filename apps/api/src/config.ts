import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_FILE || '.env.local' });

const configSchema = z.object({
  port: z.coerce.number().default(4000),
  databaseUrl: z.string().url(),
  redisUrl: z.string().url(),
  jwtSecret: z.string().min(8),
  lineChannelId: z.string(),
  lineChannelSecret: z.string(),
  paymentWebhookSecret: z.string(),
  appBaseUrl: z.string().url(),
  autoReleaseHours: z.coerce.number().default(48)
});

export type AppConfig = z.infer<typeof configSchema>;

export const loadConfig = (): AppConfig =>
  configSchema.parse({
    port: process.env.PORT,
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    jwtSecret: process.env.JWT_SECRET,
    lineChannelId: process.env.LINE_CHANNEL_ID,
    lineChannelSecret: process.env.LINE_CHANNEL_SECRET,
    paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
    appBaseUrl: process.env.APP_BASE_URL,
    autoReleaseHours: process.env.AUTO_RELEASE_HOURS
  });
