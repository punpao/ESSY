import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET', 'AUTO_RELEASE_HOURS', 'PAYMENT_WEBHOOK_SECRET'] as const;

required.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`[config] Missing env ${key}, please set it or provide default.`);
  }
});

export const config = {
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET ?? 'change_me',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  autoReleaseHours: Number(process.env.AUTO_RELEASE_HOURS ?? 48),
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET ?? 'mock_secret'
};
