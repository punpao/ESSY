import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/escrow',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'change_me_in_production',
    lineChannelId: process.env.LINE_CHANNEL_ID || 'demo',
    lineChannelSecret: process.env.LINE_CHANNEL_SECRET || 'demo',
  },
  
  app: {
    baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
  },
  
  payment: {
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'mock_secret_change_me',
  },
  
  escrow: {
    autoReleaseHours: parseInt(process.env.AUTO_RELEASE_HOURS || '48', 10),
  },
};
