import type { FastifyPluginAsync } from 'fastify';
import { DealService } from '../../services/dealService';
import { DisputeService } from '../../services/disputeService';
import { ReputationService } from '../../services/reputationService';
import { env } from '../../env';

export const adminRoutes: FastifyPluginAsync = async (app) => {
  const dealService = new DealService(app.prisma, env.AUTO_RELEASE_HOURS);
  const disputeService = new DisputeService(app.prisma, dealService);
  const reputationService = new ReputationService(app.prisma);

  app.get('/deals', { preHandler: [app.authorize(['admin'])] }, async (request) => {
    const status = (request.query as { status?: string }).status;
    return dealService.adminList(status as any);
  });

  app.get(
    '/disputes',
    { preHandler: [app.authorize(['admin'])] },
    async (request) => {
      const status = (request.query as { status?: string }).status;
      return disputeService.list(status);
    }
  );

  app.post(
    '/deals/:id/release',
    { preHandler: [app.authorize(['admin'])] },
    async (request) => {
      const { id } = request.params as { id: string };
      const deal = await app.prisma.deal.findUnique({ where: { id } });
      if (!deal) {
        throw app.httpErrors.notFound('Deal not found');
      }
      await dealService.transitionState(
        deal,
        { type: 'ADMIN_FORCE_RELEASE' },
        {
          hasPayment: true,
          hasTracking: Boolean(deal.trackingNumber),
          autoReleaseHours: env.AUTO_RELEASE_HOURS,
        }
      );
      await reputationService.recalcSellerScore(deal.sellerId);
      return { message: 'บังคับโอนเงินให้ผู้ขายแล้ว' };
    }
  );
};
