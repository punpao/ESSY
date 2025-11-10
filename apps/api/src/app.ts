import type { FastifyInstance } from 'fastify';
import sensible from '@fastify/sensible';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { AppConfig } from './config.js';
import prismaPlugin from './plugins/prisma.js';
import redisPlugin from './plugins/redis.js';
import authPlugin from './plugins/auth.js';
import queuesPlugin from './plugins/queues.js';
import paymentProviderPlugin from './services/paymentProvider.js';
import { authRoutes } from './routes/auth.js';
import { sellerRoutes } from './routes/seller.js';
import { dealRoutes } from './routes/deals.js';
import { paymentRoutes } from './routes/payments.js';
import { disputeRoutes } from './routes/disputes.js';
import { adminRoutes } from './routes/admin.js';
import { buyerRoutes } from './routes/buyer.js';

export const buildApp = async (fastify: FastifyInstance, config: AppConfig) => {
  await fastify.register(sensible);
  await fastify.register(helmet);
  await fastify.register(cors, {
    origin: true,
    credentials: true
  });

  await fastify.register(prismaPlugin);
  await fastify.register(redisPlugin, { config });
  await fastify.register(queuesPlugin);
  await fastify.register(paymentProviderPlugin, { config });
  await fastify.register(authPlugin, { config });

  fastify.get('/api/v1/health', async () => ({
    status: 'ok',
    uptime: process.uptime()
  }));

  await authRoutes(fastify, config);
  await sellerRoutes(fastify, config);
  await buyerRoutes(fastify, config);
  await dealRoutes(fastify, config);
  await paymentRoutes(fastify, config);
  await disputeRoutes(fastify, config);
  await adminRoutes(fastify, config);

  return fastify;
};
