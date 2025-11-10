import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: getEnv("DATABASE_URL"),
  redisUrl: getEnv("REDIS_URL"),
  jwtSecret: getEnv("JWT_SECRET"),
  paymentWebhookSecret: getEnv("PAYMENT_WEBHOOK_SECRET"),
  autoReleaseHours: Number(process.env.AUTO_RELEASE_HOURS ?? 48),
  appBaseUrl: getEnv("APP_BASE_URL"),
  lineChannelId: getEnv("LINE_CHANNEL_ID"),
  lineChannelSecret: getEnv("LINE_CHANNEL_SECRET")
};
