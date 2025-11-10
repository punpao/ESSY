import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../auth';
import { MockPromptPayProvider } from '@essy/payment';
import { EscrowStateMachine } from '@essy/core';
import { z } from 'zod';
import { config } from '../config';

const paymentProvider = new MockPromptPayProvider(config.appBaseUrl);

export async function paymentRoutes(fastify: FastifyInstance) {
  // Create payment charge (returns QR)
  fastify.post('/payments/create', async (request, reply) => {
    const { dealId } = z.object({ dealId: z.string() }).parse(request.body);

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { payment: true },
    });

    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }

    if (!deal.payment) {
      return reply.code(400).send({ error: 'Payment not initialized' });
    }

    const charge = await paymentProvider.createCharge({
      dealId: deal.id,
      amountSatang: deal.amountSatang,
      currency: deal.currency,
      description: deal.title,
    });

    // Update payment with provider ref
    await prisma.payment.update({
      where: { dealId },
      data: {
        providerRef: charge.providerRef,
      },
    });

    return charge;
  });

  // Mock webhook (simulates PSP callback)
  fastify.post('/payments/webhook/mock', async (request, reply) => {
    const body = request.body as any;
    const { dealId, providerRef } = z
      .object({
        dealId: z.string(),
        providerRef: z.string(),
      })
      .parse(body);

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { payment: true },
    });

    if (!deal || !deal.payment) {
      return reply.code(404).send({ error: 'Deal or payment not found' });
    }

    if (deal.payment.providerRef !== providerRef) {
      return reply.code(400).send({ error: 'Invalid provider ref' });
    }

    // Update payment status
    await prisma.payment.update({
      where: { dealId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Update deal status to HOLD
    if (EscrowStateMachine.canTransition(deal.status, 'HOLD')) {
      await prisma.deal.update({
        where: { id: dealId },
        data: {
          status: 'HOLD',
        },
      });
    }

    return { success: true };
  });

  // Refund payment (admin only)
  fastify.post('/payments/:dealId/refund', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await requireRole(request, 'admin');
    const { dealId } = z.object({ dealId: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { payment: true },
    });

    if (!deal || !deal.payment) {
      return reply.code(404).send({ error: 'Deal or payment not found' });
    }

    const refund = await paymentProvider.refund({
      paymentId: deal.payment.id,
      amountSatang: deal.amountSatang,
      reason: 'Dispute resolution',
    });

    await prisma.payment.update({
      where: { dealId },
      data: {
        status: 'REFUNDED',
      },
    });

    await prisma.deal.update({
      where: { id: dealId },
      data: {
        status: 'REFUND',
      },
    });

    return refund;
  });
}
