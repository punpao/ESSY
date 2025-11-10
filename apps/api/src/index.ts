import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { config } from './config';
import { setupRecurringJobs } from './worker';

// Import routes
import authRoutes from './routes/auth';
import dealRoutes from './routes/deals';
import paymentRoutes from './routes/payments';
import sellerRoutes from './routes/seller';
import disputeRoutes from './routes/disputes';
import adminRoutes from './routes/admin';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Register plugins
fastify.register(cors, {
  origin: config.app.baseUrl,
  credentials: true,
});

fastify.register(jwt, {
  secret: config.auth.jwtSecret,
});

fastify.register(multipart);

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes under /api/v1
fastify.register(
  async (app) => {
    app.register(authRoutes);
    app.register(dealRoutes);
    app.register(paymentRoutes);
    app.register(sellerRoutes);
    app.register(disputeRoutes);
    app.register(adminRoutes);
  },
  { prefix: '/api/v1' }
);

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  // Validation errors
  if (error.validation) {
    return reply.code(400).send({
      error: 'Validation error',
      details: error.validation,
    });
  }
  
  // JWT errors
  if (error.message === 'Unauthorized' || error.message === 'No Authorization was found in request.headers') {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  
  if (error.message === 'Forbidden') {
    return reply.code(403).send({ error: 'Forbidden' });
  }
  
  // Generic error
  return reply.code(500).send({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

// Start server
async function start() {
  try {
    // Setup background workers
    await setupRecurringJobs();
    
    // Start server
    await fastify.listen({ port: config.port, host: config.host });
    
    fastify.log.info(`🚀 API server listening on http://${config.host}:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
