import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3001"),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(32),
  LINE_CHANNEL_ID: z.string().optional(),
  LINE_CHANNEL_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(32),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  PAYMENT_WEBHOOK_SECRET: z.string().default("mock_secret"),
  AUTO_RELEASE_HOURS: z.string().default("48"),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function getEnv(): Env {
  if (!env) {
    env = envSchema.parse(process.env);
  }
  return env;
}
