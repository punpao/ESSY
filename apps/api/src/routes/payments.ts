import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate } from '../auth';
import { MockPromptPayProvider } from '@thai-escrow/payment';
import { escrowMachine } from '@thai-escrow/core';
import { config } from '../config';

const CreatePaymentSchema = z.object({
  deal_id: z.string(),
});

const WebhookSchema = z.object({
  provider_ref: z.string(),
  status: z.enum(['PAID', 'FAILED']),
});

const RefundSchema = z.object({
  reason: z.string().optional(),
});

const paymentProvider = new MockPromptPayProvider({
  webhookSecret: config.payment.webhookSecret,
});

export default async function paymentRoutes(fastify: FastifyInstance) {
  // Create payment
  fastify.post('/payments/create', async (request, reply) => {
    const user = await authenticate(request);
    const body = CreatePaymentSchema.parse(request.body);
    
    const deal = await prisma.deal.findUnique({ where: { id: body.deal_id } });
    
    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }
    
    if (deal.status !== 'PENDING') {
      return reply.code(400).send({ error: 'Deal already paid or not available' });
    }
    
    // Create charge with payment provider
    const charge = await paymentProvider.createCharge({
      amount_satang: deal.amount_satang,
      currency: deal.currency,
      deal_id: deal.id,
    });
    
    // Save payment record
    const payment = await prisma.payment.create({
      data: {
        deal_id: deal.id,
        provider: 'mock_promptpay',
        provider_ref: charge.provider_ref,
        status: 'INIT',
      },
    });
    
    await prisma.dealEvent.create({
      data: {
        deal_id: deal.id,
        event_type: 'payment_initiated',
        actor_id: user.id,
        metadata: { provider_ref: charge.provider_ref },
      },
    });
    
    return { payment, qr_string: charge.qr_string, expires_at: charge.expires_at };
  });

  // Mock webhook (simulates payment gateway callback)
  fastify.post('/payments/webhook/mock', async (request, reply) => {
    const body = WebhookSchema.parse(request.body);
    
    // Find payment by provider_ref
    const payment = await prisma.payment.findUnique({
      where: { provider_ref: body.provider_ref },
      include: { deal: true },
    });
    
    if (!payment) {
      return reply.code(404).send({ error: 'Payment not found' });
    }
    
    if (body.status === 'PAID') {
      // Update payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paid_at: new Date(),
        },
      });
      
      // Transition deal to HOLD
      const context = {
        status: payment.deal.status,
        buyer_id: payment.deal.buyer_id || 'webhook_buyer',
      };
      
      if (escrowMachine.canTransition(context, 'payment_received')) {
        const newStatus = escrowMachine.transition(context, 'payment_received');
        
        await prisma.deal.update({
          where: { id: payment.deal_id },
          data: {
            status: newStatus,
            buyer_id: payment.deal.buyer_id, // Will be set if user was authenticated
          },
        });
        
        await prisma.dealEvent.create({
          data: {
            deal_id: payment.deal_id,
            event_type: 'payment_received',
            metadata: { provider_ref: body.provider_ref },
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

  // Refund payment (admin only)
  fastify.post('/payments/:dealId/refund', async (request, reply) => {
    const user = await authenticate(request);
    const { dealId } = request.params as { dealId: string };
    const body = RefundSchema.parse(request.body);
    
    if (user.role !== 'admin') {
      return reply.code(403).send({ error: 'Admin only' });
    }
    
    const payment = await prisma.payment.findFirst({
      where: { deal_id: dealId, status: 'PAID' },
    });
    
    if (!payment) {
      return reply.code(404).send({ error: 'No paid payment found' });
    }
    
    // Refund via provider
    const refundResult = await paymentProvider.refund({
      provider_ref: payment.provider_ref,
      amount_satang: 0, // Will use original amount
      reason: body.reason,
    });
    
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    });
    
    await prisma.deal.update({
      where: { id: dealId },
      data: { status: 'REFUND' },
    });
    
    await prisma.dealEvent.create({
      data: {
        deal_id: dealId,
        event_type: 'refunded',
        actor_id: user.id,
        metadata: { refund_ref: refundResult.refund_ref, reason: body.reason },
      },
    });
    
    return { success: true, refund: refundResult };
  });
}
