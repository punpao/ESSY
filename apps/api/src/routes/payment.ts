import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { requireRole } from '../utils/auth';
import { MockPromptPayProvider } from '@essy/payment';
import { EscrowStateMachine } from '@essy/core';
import { config } from '../config';

const paymentProvider = new MockPromptPayProvider();

export async function paymentRoutes(fastify: FastifyInstance) {
  // Create payment charge (returns QR)
  fastify.post('/create', async (request, reply) => {
    const user = await requireRole(request, reply, ['buyer']);

    const { dealId } = z.object({ dealId: z.string() }).parse(request.body);

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { payment: true },
    });

    if (!deal) {
      return reply.status(404).send({ error: 'Deal not found' });
    }

    if (deal.status !== 'PENDING') {
      return reply.status(400).send({ error: 'Deal is not in PENDING status' });
    }

    // Create payment record if doesn't exist
    let payment = deal.payment;
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          dealId: deal.id,
          provider: 'mock_promptpay',
          status: 'INIT',
        },
      });
    }

    // Generate charge from provider
    const charge = await paymentProvider.createCharge({
      dealId: deal.id,
      amountSatang: deal.amountSatang,
      currency: deal.currency,
      description: deal.title,
    });

    // Update payment with provider ref
    payment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerRef: charge.providerRef,
      },
    });

    return {
      qrString: charge.qrString,
      providerRef: charge.providerRef,
      expiresAt: charge.expiresAt,
    };
  });

  // Mock webhook endpoint (simulates payment gateway callback)
  fastify.post('/webhook/mock', async (request, reply) => {
    const body = z
      .object({
        providerRef: z.string(),
        status: z.enum(['PAID', 'FAILED']),
        signature: z.string().optional(),
      })
      .parse(request.body);

    // Verify webhook (mock)
    if (!paymentProvider.verifyWebhook(body, body.signature || '')) {
      return reply.status(401).send({ error: 'Invalid signature' });
    }

    const payment = await prisma.payment.findUnique({
      where: { providerRef: body.providerRef },
      include: { deal: true },
    });

    if (!payment) {
      return reply.status(404).send({ error: 'Payment not found' });
    }

    if (body.status === 'PAID') {
      // Update payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // Transition deal to HOLD
      if (EscrowStateMachine.canTransition(payment.deal.status, 'HOLD', { hasPayment: true })) {
        await prisma.deal.update({
          where: { id: payment.deal.id },
          data: {
            status: 'HOLD',
            buyerId: payment.deal.buyerId || null, // Set buyer if not set
          },
        });

        await prisma.dealEvent.create({
          data: {
            dealId: payment.deal.id,
            fromStatus: payment.deal.status,
            toStatus: 'HOLD',
            reason: 'Payment received',
          },
        });
      }
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
    }

    return { success: true };
  });

  // Admin: Refund payment
  fastify.post('/:dealId/refund', async (request, reply) => {
    const admin = await requireRole(request, reply, ['admin']);

    const { dealId } = z.object({ dealId: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { payment: true },
    });

    if (!deal || !deal.payment) {
      return reply.status(404).send({ error: 'Deal or payment not found' });
    }

    // Process refund via provider
    await paymentProvider.refund({
      paymentId: deal.payment.id,
      amountSatang: deal.amountSatang,
      reason: 'Admin refund',
    });

    // Update payment
    await prisma.payment.update({
      where: { id: deal.payment.id },
      data: { status: 'REFUNDED' },
    });

    // Update deal
    await prisma.deal.update({
      where: { id: dealId },
      data: { status: 'REFUND' },
    });

    await prisma.dealEvent.create({
      data: {
        dealId,
        fromStatus: deal.status,
        toStatus: 'REFUND',
        reason: 'Admin refund',
        userId: admin.id,
      },
    });

    return { success: true };
  });
}
