import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { MockPromptPayProvider } from '@thai-escrow/payment';
import { EscrowStateMachine } from '@thai-escrow/core';
import { config } from '../config';

const createPaymentSchema = z.object({
  dealId: z.string().uuid(),
});

const webhookSchema = z.object({
  event: z.string(),
  providerRef: z.string(),
  status: z.string(),
  paidAt: z.string().optional(),
});

const refundSchema = z.object({
  dealId: z.string().uuid(),
  reason: z.string(),
});

const paymentProvider = new MockPromptPayProvider();

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /payments/create - Create payment (QR code)
  fastify.post('/create', async (request, reply) => {
    const { dealId } = createPaymentSchema.parse(request.body);

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        seller: {
          include: {
            seller_profile: true,
          },
        },
      },
    });

    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }

    if (deal.status !== 'PENDING') {
      return reply.code(400).send({ error: 'Deal is not in PENDING status' });
    }

    if (!deal.seller.seller_profile) {
      return reply.code(400).send({ error: 'Seller has no PromptPay profile' });
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: {
        deal_id: dealId,
        status: { in: ['INIT', 'PAID'] },
      },
    });

    if (existingPayment) {
      // Return existing payment QR
      const chargeResponse = await paymentProvider.createCharge({
        dealId,
        amountSatang: deal.amount_satang,
        currency: deal.currency,
        description: deal.title,
        recipientPromptPayId: deal.seller.seller_profile.promptpay_id,
      });

      return {
        payment: existingPayment,
        qrDataUrl: chargeResponse.qrDataUrl,
        qrString: chargeResponse.qrString,
        expiresAt: chargeResponse.expiresAt,
      };
    }

    // Create new payment
    const chargeResponse = await paymentProvider.createCharge({
      dealId,
      amountSatang: deal.amount_satang,
      currency: deal.currency,
      description: deal.title,
      recipientPromptPayId: deal.seller.seller_profile.promptpay_id,
    });

    const payment = await prisma.payment.create({
      data: {
        deal_id: dealId,
        provider: 'mock_promptpay',
        provider_ref: chargeResponse.providerRef,
        status: 'INIT',
      },
    });

    return {
      payment,
      qrDataUrl: chargeResponse.qrDataUrl,
      qrString: chargeResponse.qrString,
      expiresAt: chargeResponse.expiresAt,
    };
  });

  // POST /payments/webhook/mock - Mock webhook from payment provider
  fastify.post('/webhook/mock', async (request, reply) => {
    const payload = webhookSchema.parse(request.body);

    // Verify webhook (simplified)
    const isValid = paymentProvider.verifyWebhook(payload as any, config.paymentWebhookSecret);
    if (!isValid) {
      return reply.code(401).send({ error: 'Invalid webhook signature' });
    }

    const payment = await prisma.payment.findUnique({
      where: { provider_ref: payload.providerRef },
      include: { deal: true },
    });

    if (!payment) {
      return reply.code(404).send({ error: 'Payment not found' });
    }

    if (payload.event === 'payment.success' && payload.status === 'PAID') {
      // Update payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paid_at: payload.paidAt ? new Date(payload.paidAt) : new Date(),
        },
      });

      // Transition deal to HOLD
      const newStatus = EscrowStateMachine.transition('PENDING', 'PAYMENT_RECEIVED', {
        currentStatus: payment.deal.status as any,
        hasPayment: true,
        hasBuyer: true, // Mock - in real system, extract from payment
      });

      // Extract buyer ID from request (in production, from payment gateway)
      // For mock, use authenticated user or create mock buyer
      let buyerId = payment.deal.buyer_id;
      if (!buyerId) {
        // Create or get mock buyer
        const mockBuyer = await prisma.user.upsert({
          where: { email: 'mock.buyer@example.com' },
          create: {
            email: 'mock.buyer@example.com',
            display_name: 'Mock Buyer',
            role: 'buyer',
            kyc_level: 'none',
          },
          update: {},
        });
        buyerId = mockBuyer.id;
      }

      await prisma.deal.update({
        where: { id: payment.deal_id },
        data: {
          status: newStatus,
          buyer_id: buyerId,
        },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: payment.deal_id,
          event_type: 'payment_received',
          from_status: 'PENDING',
          to_status: newStatus,
          metadata: JSON.stringify({ paymentId: payment.id }),
        },
      });

      return { success: true, message: 'Payment processed' };
    }

    return { success: true, message: 'Webhook received' };
  });

  // POST /payments/:dealId/refund - Refund payment (admin only)
  fastify.post('/:dealId/refund', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = request.user as any;
      if (user.role !== 'admin') {
        return reply.code(403).send({ error: 'Admin only' });
      }

      const { dealId } = request.params as { dealId: string };
      const { reason } = refundSchema.parse(request.body);

      const payment = await prisma.payment.findFirst({
        where: {
          deal_id: dealId,
          status: 'PAID',
        },
      });

      if (!payment) {
        return reply.code(404).send({ error: 'No paid payment found for this deal' });
      }

      // Process refund
      const refundResponse = await paymentProvider.refund({
        providerRef: payment.provider_ref,
        amountSatang: 0, // Full refund - get from deal
        reason,
      });

      if (refundResponse.success) {
        await prisma.payment.update({
          where: { id: payment.id },
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

        await prisma.dealEvent.create({
          data: {
            deal_id: dealId,
            event_type: 'refunded',
            to_status: 'REFUND',
            actor_id: user.id,
            metadata: JSON.stringify({ refundRef: refundResponse.refundRef, reason }),
          },
        });

        return { success: true, refundRef: refundResponse.refundRef };
      }

      return reply.code(500).send({ error: 'Refund failed' });
    },
  });

  // GET /payments/deal/:dealId - Get payment for deal
  fastify.get('/deal/:dealId', async (request, reply) => {
    const { dealId } = request.params as { dealId: string };

    const payments = await prisma.payment.findMany({
      where: { deal_id: dealId },
      orderBy: { created_at: 'desc' },
    });

    return payments;
  });
};
