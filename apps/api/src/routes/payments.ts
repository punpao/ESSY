import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../lib/auth';
import { transitionDealStatus } from '../lib/escrow';
import { MockPromptPayProvider } from '@essy/payment';
import { z } from 'zod';
import { ulid } from 'ulid';

const paymentProvider = new MockPromptPayProvider(
  process.env.PAYMENT_WEBHOOK_SECRET || 'mock_secret'
);

export async function paymentsRoutes(fastify: FastifyInstance) {
  // Create payment charge (returns QR)
  fastify.post('/payments/create', async (request, reply) => {
    const body = z
      .object({
        deal_id: z.string(),
      })
      .parse(request.body);

    const deal = await prisma.deal.findUnique({
      where: { id: body.deal_id },
      include: { payment: true },
    });

    if (!deal) {
      reply.code(404).send({ error: 'Deal not found' });
      return;
    }

    if (deal.payment) {
      // Return existing payment QR
      return {
        qr_string: `PROMPTPAY|${deal.payment.provider_ref}|${(deal.amount_satang / 100).toFixed(2)}`,
        provider_ref: deal.payment.provider_ref,
      };
    }

    // Create new payment
    const charge = await paymentProvider.createCharge({
      dealId: deal.id,
      amountSatang: deal.amount_satang,
      currency: deal.currency,
      description: deal.title,
    });

    const payment = await prisma.payment.create({
      data: {
        id: ulid(),
        deal_id: deal.id,
        provider: 'mock_promptpay',
        provider_ref: charge.providerRef,
        status: 'INIT',
      },
    });

    return {
      qr_string: charge.qrString,
      provider_ref: charge.providerRef,
      payment_id: payment.id,
    };
  });

  // Mock webhook endpoint
  fastify.post('/payments/webhook/mock', async (request, reply) => {
    const body = z
      .object({
        provider_ref: z.string(),
        signature: z.string().optional(),
      })
      .parse(request.body);

    // Verify webhook
    const isValid = paymentProvider.verifyWebhook(body, body.signature || 'mock_secret');
    if (!isValid) {
      reply.code(401).send({ error: 'Invalid signature' });
      return;
    }

    // Find payment
    const payment = await prisma.payment.findFirst({
      where: { provider_ref: body.provider_ref },
      include: { deal: true },
    });

    if (!payment) {
      reply.code(404).send({ error: 'Payment not found' });
      return;
    }

    // Update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paid_at: new Date(),
      },
    });

    // Transition deal to HOLD
    await transitionDealStatus(payment.deal_id, { type: 'PAYMENT_RECEIVED' }, 'system');

    // Set buyer_id if not set (from webhook metadata in production)
    if (!payment.deal.buyer_id) {
      // In production, get buyer from webhook metadata
      // For MVP, leave null (will be set when buyer confirms)
    }

    return { success: true };
  });

  // Refund payment (admin only)
  fastify.post('/payments/:dealId/refund', async (request, reply) => {
    const admin = await requireRole(request, reply, ['admin']);

    const params = z.object({ dealId: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id: params.dealId },
      include: { payment: true },
    });

    if (!deal || !deal.payment) {
      reply.code(404).send({ error: 'Payment not found' });
      return;
    }

    // Process refund
    const refund = await paymentProvider.refund({
      paymentId: deal.payment.id,
      amountSatang: deal.amount_satang,
      reason: 'Admin refund',
    });

    // Update payment
    await prisma.payment.update({
      where: { id: deal.payment.id },
      data: {
        status: 'REFUNDED',
      },
    });

    // Transition deal
    await transitionDealStatus(deal.id, { type: 'DISPUTE_RESOLVED_REFUND' }, admin.id);

    return { success: true, refund };
  });
}
