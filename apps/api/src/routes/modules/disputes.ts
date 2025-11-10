import type { FastifyPluginAsync } from 'fastify';
import {
  disputeOpenSchema,
  disputeEvidenceSchema,
  disputeResolveSchema,
} from '@thai-escrow/core';
import { DisputeService } from '../../services/disputeService';
import { DealService } from '../../services/dealService';
import { PaymentService } from '../../services/paymentService';
import { env } from '../../env';

export const disputeRoutes: FastifyPluginAsync = async (app) => {
  const dealService = new DealService(app.prisma, env.AUTO_RELEASE_HOURS);
  const disputeService = new DisputeService(app.prisma, dealService);
  const paymentService = new PaymentService(app.prisma, dealService);

  app.post(
    '/:dealId/open',
    { preHandler: [app.authorize(['buyer'])] },
    async (request) => {
      const { dealId } = request.params as { dealId: string };
      const body = disputeOpenSchema.parse({ ...request.body, dealId });
      const deal = await app.prisma.deal.findUnique({ where: { id: dealId } });
      if (!deal) {
        throw app.httpErrors.notFound('Deal not found');
      }
      if (deal.buyerId !== request.user.userId) {
        throw app.httpErrors.forbidden('Only the buyer can open a dispute');
      }
      const dispute = await disputeService.open(dealId, request.user.userId, body);
      return { dispute };
    }
  );

  app.post(
    '/:id/evidence',
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = disputeEvidenceSchema.parse(request.body);
      const dispute = await app.prisma.dispute.findUnique({ where: { id } });
      if (!dispute) {
        throw app.httpErrors.notFound('Dispute not found');
      }
      if (
        request.user.role !== 'admin' &&
        dispute.openedById !== request.user.userId
      ) {
        throw app.httpErrors.forbidden('Not allowed to append evidence');
      }
      const evidence = await disputeService.addEvidence(
        id,
        request.user.userId,
        body
      );
      return { evidence };
    }
  );

  app.post(
    '/:id/resolve',
    { preHandler: [app.authorize(['admin'])] },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = disputeResolveSchema.parse(request.body);
      const dispute = await app.prisma.dispute.findUnique({
        where: { id },
      });
      if (!dispute) {
        throw app.httpErrors.notFound('Dispute not found');
      }
      await disputeService.resolve(id, body);
      if (body.resolution === 'refund') {
        await paymentService.refund(dispute.dealId, body.note);
      }
      return { message: 'อัปเดตผลการพิจารณาเรียบร้อย' };
    }
  );
};
