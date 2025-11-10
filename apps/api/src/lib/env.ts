import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z
    .string()
    .default("4000")
    .transform((val) => Number(val)),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  LINE_CHANNEL_ID: z.string(),
  LINE_CHANNEL_SECRET: z.string(),
  APP_BASE_URL: z.string().url(),
  PAYMENT_WEBHOOK_SECRET: z.string().min(6),
  AUTO_RELEASE_HOURS: z
    .string()
    .default("48")
    .transform((value) => Number(value))
});

export type ApiEnv = z.infer<typeof envSchema>;

export function loadEnv(overrides: Partial<Record<keyof ApiEnv, unknown>> = {}): ApiEnv {
  const merged = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    LINE_CHANNEL_ID: process.env.LINE_CHANNEL_ID,
    LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
    APP_BASE_URL: process.env.APP_BASE_URL,
    PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET,
    AUTO_RELEASE_HOURS: process.env.AUTO_RELEASE_HOURS,
    ...overrides
  };

  return envSchema.parse(merged);
}
