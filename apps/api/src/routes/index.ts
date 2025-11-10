import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { authRoutes } from './modules/auth';
import { sellerRoutes } from './modules/seller';
import { dealRoutes } from './modules/deals';
import { paymentRoutes } from './modules/payments';
import { disputeRoutes } from './modules/disputes';
import { adminRoutes } from './modules/admin';

export const routesPlugin = fp<FastifyPluginAsync>(async (app) => {
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(sellerRoutes, { prefix: '/seller' });
  await app.register(dealRoutes, { prefix: '/deals' });
  await app.register(paymentRoutes, { prefix: '/payments' });
  await app.register(disputeRoutes, { prefix: '/disputes' });
  await app.register(adminRoutes, { prefix: '/admin' });
});
