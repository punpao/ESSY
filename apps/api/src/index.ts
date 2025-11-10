import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { authRoutes } from './routes/auth';
import { sellerRoutes } from './routes/seller';
import { dealRoutes } from './routes/deal';
import { paymentRoutes } from './routes/payment';
import { disputeRoutes } from './routes/dispute';
import { adminRoutes } from './routes/admin';
import { setupWorkers } from './workers';

const prisma = new PrismaClient();

const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

// Plugins
fastify.register(cors, {
  origin: config.APP_BASE_URL,
  credentials: true,
});

fastify.register(jwt, {
  secret: config.JWT_SECRET,
});

fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Routes
fastify.register(authRoutes, { prefix: '/api/v1/auth' });
fastify.register(sellerRoutes, { prefix: '/api/v1/seller' });
fastify.register(dealRoutes, { prefix: '/api/v1/deals' });
fastify.register(paymentRoutes, { prefix: '/api/v1/payments' });
fastify.register(disputeRoutes, { prefix: '/api/v1/disputes' });
fastify.register(adminRoutes, { prefix: '/api/v1/admin' });

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
    console.log(`🚀 API server listening on port ${config.PORT}`);

    // Setup background workers
    await setupWorkers();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
