import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  createDealSchema,
  setTrackingSchema,
  confirmReceiptSchema,
  EscrowEvent,
} from '@thai-escrow/core';
import { DealService } from '../../services/dealService';
import { ReputationService } from '../../services/reputationService';
import { env } from '../../env';

const cancelSchema = z.object({
  reason: z.string().optional(),
});

export const dealRoutes: FastifyPluginAsync = async (app) => {
  const dealService = new DealService(app.prisma, env.AUTO_RELEASE_HOURS);
  const reputationService = new ReputationService(app.prisma);

  app.post('/', { preHandler: [app.authorize(['seller'])] }, async (request) => {
    const body = createDealSchema.parse(request.body);
    const deal = await dealService.createDeal({
      ...body,
      sellerId: request.user.userId,
    });
    return {
      deal,
      paylinkUrl: `${env.APP_BASE_URL}/pay/${deal.paylinkToken}`,
    };
  });

  app.get(
    '/seller',
    { preHandler: [app.authorize(['seller'])] },
    async (request) => {
      return dealService.listSellerDeals(request.user.userId);
    }
  );

  app.get(
    '/buyer',
    { preHandler: [app.authorize(['buyer'])] },
    async (request) => {
      return dealService.listBuyerDeals(request.user.userId);
    }
  );

  app.get('/paylink/:token', async (request) => {
    const { token } = request.params as { token: string };
    const deal = await dealService.findByPaylink(token);
    if (!deal) {
      throw app.httpErrors.notFound('Paylink not found');
    }
    return deal;
  });

  app.get('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const deal = await dealService.getDeal(id);
    if (!deal) {
      throw app.httpErrors.notFound('Deal not found');
    }
    if (
      deal.sellerId !== request.user.userId &&
      deal.buyerId !== request.user.userId &&
      request.user.role !== 'admin'
    ) {
      throw app.httpErrors.forbidden('Not allowed to view this deal');
    }
    return deal;
  });

  app.post(
    '/:id/ship',
    { preHandler: [app.authorize(['seller'])] },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = setTrackingSchema.parse(request.body);
      const deal = await app.prisma.deal.findUnique({ where: { id } });
      if (!deal) {
        throw app.httpErrors.notFound('Deal not found');
      }
      if (deal.sellerId !== request.user.userId) {
        throw app.httpErrors.forbidden('Deal does not belong to seller');
      }
      if (deal.status !== 'HOLD' && deal.status !== 'SHIPPED') {
        throw app.httpErrors.badRequest('Deal not ready for shipment');
      }
      const updated = await dealService.setTracking(deal, body);
      return { deal: updated };
    }
  );

  app.post(
    '/:id/delivered',
    { preHandler: [app.authorize(['seller', 'admin'])] },
    async (request) => {
      const { id } = request.params as { id: string };
      const deal = await app.prisma.deal.findUnique({ where: { id } });
      if (!deal) {
        throw app.httpErrors.notFound('Deal not found');
      }
      const deliveredAt = new Date();
      const event: EscrowEvent = { type: 'MARK_DELIVERED', payload: { deliveredAt } };
      await dealService.transitionState(
        deal,
        event,
        {
          hasPayment: true,
          hasTracking: Boolean(deal.trackingNumber),
          deliveredAt,
          autoReleaseHours: env.AUTO_RELEASE_HOURS,
        }
      );
      const updated = await dealService.markDelivered(deal, deliveredAt);
      return { deal: updated };
    }
  );

  app.post(
    '/:id/confirm',
    { preHandler: [app.authorize(['buyer'])] },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = confirmReceiptSchema.parse({ dealId: id });
      const deal = await app.prisma.deal.findUnique({ where: { id: body.dealId } });
      if (!deal) {
        throw app.httpErrors.notFound('Deal not found');
      }
      if (deal.buyerId !== request.user.userId) {
        throw app.httpErrors.forbidden('Buyer mismatch');
      }
      const result = await dealService.transitionState(
        deal,
        { type: 'BUYER_CONFIRM_RECEIPT' },
        {
          hasPayment: true,
          hasTracking: Boolean(deal.trackingNumber),
          autoReleaseHours: env.AUTO_RELEASE_HOURS,
        }
      );
      if (!result.changed) {
        return { message: 'ไม่มีการเปลี่ยนแปลงสถานะ', status: deal.status };
      }
      await reputationService.recalcSellerScore(deal.sellerId);
      return { message: 'ยืนยันรับของแล้ว', status: 'RELEASED' };
    }
  );

  app.post(
    '/:id/cancel',
    { preHandler: [app.authorize(['seller'])] },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = cancelSchema.parse(request.body ?? {});
      const deal = await app.prisma.deal.findUnique({
        where: { id },
        include: { payment: true },
      });
      if (!deal) {
        throw app.httpErrors.notFound('Deal not found');
      }
      if (deal.sellerId !== request.user.userId) {
        throw app.httpErrors.forbidden('Cannot cancel another seller deal');
      }
      if (deal.status !== 'PENDING') {
        throw app.httpErrors.badRequest('Deal cannot be cancelled');
      }
      if (deal.payment && deal.payment.status === 'PAID') {
        throw app.httpErrors.badRequest('Cannot cancel after payment');
      }
      await dealService.transitionState(
        deal,
        { type: 'CANCEL_PENDING' },
        {
          hasPayment: false,
          hasTracking: false,
          autoReleaseHours: env.AUTO_RELEASE_HOURS,
        }
      );
      await app.prisma.deal.update({
        where: { id },
        data: {
          status: 'REFUND',
          updatedAt: new Date(),
          cancelledReason: body.reason ?? null,
        },
      });
      return { message: 'ยกเลิกรายการสำเร็จ' };
    }
  );
};
