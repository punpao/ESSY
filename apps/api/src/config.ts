import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'change_me',
  nextAuthSecret: process.env.NEXTAUTH_SECRET || 'change_me',
  lineChannelId: process.env.LINE_CHANNEL_ID || 'demo',
  lineChannelSecret: process.env.LINE_CHANNEL_SECRET || 'demo',
  lineCallbackUrl: process.env.LINE_CALLBACK_URL || 'http://localhost:3000/api/auth/callback/line',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'mock_secret',
  autoReleaseHours: parseInt(process.env.AUTO_RELEASE_HOURS || '48', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
};
