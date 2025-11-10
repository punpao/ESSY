import type { FastifyInstance } from 'fastify';
import { authRoutes } from './modules/auth';
import { sellerRoutes } from './modules/seller';
import { dealRoutes } from './modules/deals';
import { paymentRoutes } from './modules/payments';
import { disputeRoutes } from './modules/disputes';
import { adminRoutes } from './modules/admin';
import { paylinkRoutes } from './modules/paylinks';

export async function registerRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(sellerRoutes, { prefix: '/api/v1/seller' });
  await app.register(dealRoutes, { prefix: '/api/v1/deals' });
  await app.register(paymentRoutes, { prefix: '/api/v1/payments' });
  await app.register(disputeRoutes, { prefix: '/api/v1/disputes' });
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });
  await app.register(paylinkRoutes, { prefix: '/api/v1/paylinks' });
}
