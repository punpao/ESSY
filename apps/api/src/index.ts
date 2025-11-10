import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { db } from './lib/db';
import { startWorker } from './worker';

// Routes
import authRoutes from './routes/auth';
import sellerRoutes from './routes/seller';
import dealRoutes from './routes/deals';
import paymentRoutes from './routes/payments';
import disputeRoutes from './routes/disputes';
import adminRoutes from './routes/admin';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Register plugins
  await fastify.register(cors, {
    origin: process.env.APP_BASE_URL || 'http://localhost:3000',
    credentials: true,
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'change_me',
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register API routes
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(sellerRoutes, { prefix: '/api/v1/seller' });
  await fastify.register(dealRoutes, { prefix: '/api/v1/deals' });
  await fastify.register(paymentRoutes, { prefix: '/api/v1/payments' });
  await fastify.register(disputeRoutes, { prefix: '/api/v1/disputes' });
  await fastify.register(adminRoutes, { prefix: '/api/v1/admin' });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(error.statusCode || 500).send({
      error: error.message || 'Internal Server Error',
      statusCode: error.statusCode || 500,
    });
  });

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 API server running on http://${HOST}:${PORT}`);

    // Start background worker
    startWorker();
    console.log('✅ Background worker started');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`Received ${signal}, closing server...`);
      await fastify.close();
      await db.$disconnect();
      process.exit(0);
    });
  });
}

start();
