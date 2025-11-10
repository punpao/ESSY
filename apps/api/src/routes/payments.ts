import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import { MockPromptPayProvider } from '@escrow/payment';
import { transition } from '@escrow/core';
import { DealStatus } from '@prisma/client';

const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  const provider = new MockPromptPayProvider(
    process.env.PAYMENT_WEBHOOK_SECRET || 'mock_secret'
  );

  // Create payment for a deal
  fastify.post('/create', async (request, reply) => {
    const schema = z.object({
      paylinkToken: z.string(),
    });

    const { paylinkToken } = schema.parse(request.body);

    // Find deal
    const deal = await db.deal.findUnique({
      where: { paylinkToken },
      include: { payments: true },
    });

    if (!deal) {
      return reply.status(404).send({ error: 'Deal not found' });
    }

    if (deal.expiresAt < new Date()) {
      return reply.status(410).send({ error: 'Deal expired' });
    }

    if (deal.status !== 'PENDING') {
      return reply.status(400).send({ error: 'Deal already paid or completed' });
    }

    // Check if payment already exists
    const existingPayment = deal.payments.find((p) => p.status === 'PAID');
    if (existingPayment) {
      return reply.status(400).send({ error: 'Deal already paid' });
    }

    // Create charge with mock provider
    const webhookUrl = `${process.env.API_BASE_URL}/api/v1/payments/webhook/mock`;
    const charge = await provider.createCharge({
      deal: deal as any,
      webhookUrl,
    });

    // Create payment record
    const payment = await db.payment.create({
      data: {
        dealId: deal.id,
        provider: 'mock_promptpay',
        providerRef: charge.providerRef,
        status: 'INIT',
      },
    });

    return {
      payment,
      qrCode: charge.qrString,
      expiresAt: charge.expiresAt,
    };
  });

  // Mock webhook (simulates PSP callback)
  fastify.post('/webhook/mock', async (request, reply) => {
    const schema = z.object({
      providerRef: z.string(),
      status: z.enum(['paid', 'failed']),
      buyerId: z.string().uuid().optional(),
    });

    const { providerRef, status, buyerId } = schema.parse(request.body);

    // Find payment
    const payment = await db.payment.findUnique({
      where: { providerRef },
      include: { deal: true },
    });

    if (!payment) {
      return reply.status(404).send({ error: 'Payment not found' });
    }

    if (status === 'paid') {
      // Update payment
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // Transition deal to HOLD
      const result = transition(payment.deal.status as DealStatus, { type: 'PAY' });
      if (!result.valid) {
        fastify.log.error(`Invalid transition: ${result.error}`);
        return reply.status(400).send({ error: result.error });
      }

      // Update deal
      await db.deal.update({
        where: { id: payment.dealId },
        data: {
          status: result.newStatus,
          buyerId: buyerId || payment.deal.buyerId,
        },
      });

      // Log event
      await db.dealEvent.create({
        data: {
          dealId: payment.dealId,
          eventType: 'PAY',
          fromState: payment.deal.status,
          toState: result.newStatus!,
          metadata: { paymentId: payment.id, providerRef },
        },
      });

      return { message: 'Payment processed', status: 'HOLD' };
    } else {
      // Failed payment
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      return { message: 'Payment failed' };
    }
  });

  // Refund payment (admin only, called from dispute resolution)
  fastify.post('/:dealId/refund', async (request, reply) => {
    const schema = z.object({
      dealId: z.string().uuid(),
    });

    const { dealId } = schema.parse(request.params);

    const deal = await db.deal.findUnique({
      where: { id: dealId },
      include: { payments: true },
    });

    if (!deal) {
      return reply.status(404).send({ error: 'Deal not found' });
    }

    const payment = deal.payments.find((p) => p.status === 'PAID');
    if (!payment) {
      return reply.status(400).send({ error: 'No paid payment found' });
    }

    // Call provider refund
    const refundResult = await provider.refund({
      paymentId: payment.id,
      providerRef: payment.providerRef,
      amount: deal.amountSatang,
      reason: 'Dispute resolved in favor of buyer',
    });

    // Update payment
    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    });

    // Update deal status
    await db.deal.update({
      where: { id: dealId },
      data: { status: 'REFUND' },
    });

    // Log event
    await db.dealEvent.create({
      data: {
        dealId,
        eventType: 'REFUND',
        fromState: deal.status,
        toState: 'REFUND',
        metadata: { refundRef: refundResult.refundRef },
      },
    });

    return { message: 'Payment refunded', refundRef: refundResult.refundRef };
  });
};

export default paymentRoutes;
