import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  paymentCreateSchema,
  promptpayWebhookSchema,
} from '@thai-escrow/core';
import { DealService } from '../../services/dealService';
import { PaymentService } from '../../services/paymentService';
import { env } from '../../env';

export const paymentRoutes: FastifyPluginAsync = async (app) => {
  const dealService = new DealService(app.prisma, env.AUTO_RELEASE_HOURS);
  const paymentService = new PaymentService(app.prisma, dealService);

  app.post(
    '/create',
    { preHandler: [app.authorize(['buyer'])] },
    async (request) => {
      const body = paymentCreateSchema.parse(request.body);
      const deal = await app.prisma.deal.findUnique({ where: { id: body.dealId } });
      if (!deal) {
        throw app.httpErrors.notFound('Deal not found');
      }
      if (deal.buyerId && deal.buyerId !== request.user.userId) {
        throw app.httpErrors.forbidden('Deal already reserved by another buyer');
      }

      if (!deal.buyerId) {
        await app.prisma.deal.update({
          where: { id: deal.id },
          data: { buyerId: request.user.userId },
        });
      }

      const charge = await paymentService.createCharge(deal.id);
      return {
        qrString: charge.qrString,
        providerRef: charge.providerRef,
        message:
          'สแกน PromptPay เพื่อชำระ ระบบจะพักเงินไว้จนกว่าคุณจะกดยืนยันรับของ',
      };
    }
  );

  app.post('/webhook/mock', async (request) => {
    const payload = promptpayWebhookSchema.parse(request.body);
    const result = await paymentService.handleWebhook(payload, env.PAYMENT_WEBHOOK_SECRET);
    return { result };
  });

  app.post(
    '/:dealId/refund',
    { preHandler: [app.authorize(['admin'])] },
    async (request) => {
      const { dealId } = request.params as { dealId: string };
      const reason = (request.body as { reason?: string } | undefined)?.reason;
      await paymentService.refund(dealId, reason);
      return { message: 'ดำเนินการคืนเงินแล้ว' };
    }
  );
};
