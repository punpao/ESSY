import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { setupAuth } from './auth';
import { authRoutes } from './routes/auth';
import { sellerRoutes } from './routes/seller';
import { dealRoutes } from './routes/deals';
import { paymentRoutes } from './routes/payments';
import { disputeRoutes } from './routes/disputes';
import { adminRoutes } from './routes/admin';
import { paylinkRoutes } from './routes/paylink';
import { startAutoReleaseWorker } from './workers/autoRelease';

const fastify = Fastify({
  logger: true,
});

async function start() {
  // CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  // Auth
  await setupAuth(fastify);

  // Routes with /api/v1 prefix
  await fastify.register(authRoutes, { prefix: '/api/v1' });
  await fastify.register(sellerRoutes, { prefix: '/api/v1' });
  await fastify.register(dealRoutes, { prefix: '/api/v1' });
  await fastify.register(paymentRoutes, { prefix: '/api/v1' });
  await fastify.register(disputeRoutes, { prefix: '/api/v1' });
  await fastify.register(adminRoutes, { prefix: '/api/v1' });
  await fastify.register(paylinkRoutes, { prefix: '/api/v1' });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  // Start worker
  startAutoReleaseWorker();

  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 API server listening on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
