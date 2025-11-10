import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string().min(16),
  LINE_CHANNEL_ID: z.string(),
  LINE_CHANNEL_SECRET: z.string(),
  NEXTAUTH_SECRET: z.string(),
  APP_BASE_URL: z.string().url(),
  PAYMENT_WEBHOOK_SECRET: z.string(),
  AUTO_RELEASE_HOURS: z.coerce.number().min(1).default(48)
})

export const env = envSchema.parse(process.env)
