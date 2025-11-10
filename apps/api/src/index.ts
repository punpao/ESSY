import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from './routes/auth';
import { sellerRoutes } from './routes/seller';
import { dealsRoutes } from './routes/deals';
import { paymentsRoutes } from './routes/payments';
import { disputesRoutes } from './routes/disputes';
import { adminRoutes } from './routes/admin';
import { startWorkers } from './workers';

const fastify = Fastify({
  logger: true,
});

async function start() {
  // Register plugins
  await fastify.register(cors, {
    origin: true,
  });

  // Register routes with prefix
  await fastify.register(authRoutes, { prefix: '/api/v1' });
  await fastify.register(sellerRoutes, { prefix: '/api/v1' });
  await fastify.register(dealsRoutes, { prefix: '/api/v1' });
  await fastify.register(paymentsRoutes, { prefix: '/api/v1' });
  await fastify.register(disputesRoutes, { prefix: '/api/v1' });
  await fastify.register(adminRoutes, { prefix: '/api/v1' });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  // Start workers
  startWorkers();

  const port = parseInt(process.env.PORT || '3001', 10);
  const host = process.env.HOST || '0.0.0.0';

  try {
    await fastify.listen({ port, host });
    console.log(`API server listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
