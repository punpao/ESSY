import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { config } from './config';
import { authRoutes } from './routes/auth';
import { dealRoutes } from './routes/deals';
import { paymentRoutes } from './routes/payments';
import { disputeRoutes } from './routes/disputes';
import { adminRoutes } from './routes/admin';
import { sellerRoutes } from './routes/seller';
import { startWorker } from './worker';

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'info' : 'warn',
  },
});

// Register plugins
fastify.register(cors, {
  origin: [config.appBaseUrl, 'http://localhost:3000'],
  credentials: true,
});

fastify.register(jwt, {
  secret: config.jwtSecret,
});

fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// JWT verification decorator
fastify.decorate('authenticate', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
fastify.register(authRoutes, { prefix: '/api/v1/auth' });
fastify.register(dealRoutes, { prefix: '/api/v1/deals' });
fastify.register(paymentRoutes, { prefix: '/api/v1/payments' });
fastify.register(disputeRoutes, { prefix: '/api/v1/disputes' });
fastify.register(adminRoutes, { prefix: '/api/v1/admin' });
fastify.register(sellerRoutes, { prefix: '/api/v1/seller' });

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  const statusCode = (error as any).statusCode || 500;
  reply.code(statusCode).send({
    error: error.message || 'Internal Server Error',
    statusCode,
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`🚀 API server running on http://${config.host}:${config.port}`);
    
    // Start background worker
    startWorker();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
