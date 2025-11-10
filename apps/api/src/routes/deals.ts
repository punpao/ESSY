import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../auth';
import { EscrowStateMachine } from '@essy/core';
import { ulid } from 'ulid';
import { z } from 'zod';
import { config } from '../config';

const createDealSchema = z.object({
  title: z.string().min(1).max(200),
  amountSatang: z.number().int().positive(),
  currency: z.string().default('THB'),
  buyerNote: z.string().optional(),
});

const shipDealSchema = z.object({
  trackingNumber: z.string().min(1),
  courier: z.string().min(1),
});

export async function dealRoutes(fastify: FastifyInstance) {
  // Create deal
  fastify.post('/deals', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await requireRole(request, 'seller');
    const { title, amountSatang, currency, buyerNote } = createDealSchema.parse(request.body);

    // Check seller profile exists
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return reply.code(400).send({ error: 'Seller profile not found. Please complete KYC first.' });
    }

    const dealId = ulid();
    const paylinkToken = ulid();

    const deal = await prisma.deal.create({
      data: {
        id: dealId,
        title,
        amountSatang,
        currency,
        sellerId: user.id,
        status: 'PENDING',
        paylinkToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        dealId: deal.id,
        provider: 'mock_promptpay',
        providerRef: `INIT_${dealId}`,
        status: 'INIT',
      },
    });

    const paylinkUrl = `${config.appBaseUrl}/pay/${paylinkToken}`;

    return { deal, paylinkUrl };
  });

  // Get deal
  fastify.get('/deals/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await requireAuth(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        seller: { include: { sellerProfile: true } },
        buyer: true,
        payment: true,
        dispute: { include: { evidence: true } },
      },
    });

    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }

    // Check access
    if (deal.sellerId !== user.id && deal.buyerId !== user.id && user.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    return deal;
  });

  // Ship deal (add tracking)
  fastify.post('/deals/:id/ship', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await requireRole(request, 'seller');
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const { trackingNumber, courier } = shipDealSchema.parse(request.body);

    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }

    if (deal.sellerId !== user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    // Validate state transition
    if (!EscrowStateMachine.canTransition(deal.status, 'SHIPPED')) {
      return reply.code(400).send({ error: `Cannot ship deal in status ${deal.status}` });
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        status: 'SHIPPED',
        trackingNumber,
        courier,
        // Auto-release in 48 hours if not confirmed
        autoReleaseAt: new Date(Date.now() + config.autoReleaseHours * 60 * 60 * 1000),
      },
    });

    return updated;
  });

  // Buyer confirm receipt
  fastify.post('/deals/:id/confirm', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await requireAuth(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }

    if (deal.buyerId !== user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    if (!EscrowStateMachine.canTransition(deal.status, 'RELEASED')) {
      return reply.code(400).send({ error: `Cannot confirm deal in status ${deal.status}` });
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        status: 'RELEASED',
      },
    });

    // Trigger reputation update (async)
    // In production, queue this job

    return updated;
  });

  // Cancel deal (only if PENDING)
  fastify.post('/deals/:id/cancel', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await requireAuth(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }

    if (deal.sellerId !== user.id && user.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    if (!EscrowStateMachine.canCancel(deal.status)) {
      return reply.code(400).send({ error: 'Can only cancel PENDING deals' });
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        status: 'REFUND',
      },
    });

    return updated;
  });
}
