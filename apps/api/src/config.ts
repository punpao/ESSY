export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/escrow",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  jwtSecret: process.env.JWT_SECRET || "change_me",
  lineChannelId: process.env.LINE_CHANNEL_ID || "demo",
  lineChannelSecret: process.env.LINE_CHANNEL_SECRET || "demo",
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || "mock_secret",
  autoReleaseHours: parseInt(process.env.AUTO_RELEASE_HOURS || "48", 10),
} as const;
