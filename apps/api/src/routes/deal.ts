import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ulid } from 'ulid';
import { prisma } from '../index';
import { requireRole } from '../utils/auth';
import { EscrowStateMachine } from '@essy/core';
import { config } from '../config';

const createDealSchema = z.object({
  title: z.string().min(1).max(200),
  amountSatang: z.number().int().positive(),
  buyerNote: z.string().optional(),
});

const shipDealSchema = z.object({
  trackingNumber: z.string().min(1),
  courier: z.string().min(1),
});

export async function dealRoutes(fastify: FastifyInstance) {
  // Create deal (seller only)
  fastify.post('/', async (request, reply) => {
    const user = await requireRole(request, reply, ['seller']);

    const data = createDealSchema.parse(request.body);

    // Generate paylink token
    const paylinkToken = ulid();

    const deal = await prisma.deal.create({
      data: {
        title: data.title,
        amountSatang: data.amountSatang,
        sellerId: user.id,
        paylinkToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'PENDING',
      },
    });

    const paylinkUrl = `${process.env.APP_BASE_URL}/pay/${paylinkToken}`;

    return { deal, paylinkUrl };
  });

  // Public: Get deal by paylink token (for payment page)
  fastify.get('/paylink/:token', async (request, reply) => {
    const { token } = z.object({ token: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { paylinkToken: token },
      include: {
        seller: { include: { sellerProfile: true } },
        payment: true,
      },
    });

    if (!deal) {
      return reply.status(404).send({ error: 'Deal not found' });
    }

    // Return limited info for public paylink
    return {
      id: deal.id,
      title: deal.title,
      amountSatang: deal.amountSatang,
      currency: deal.currency,
      status: deal.status,
      seller: {
        displayName: deal.seller.displayName,
        sellerProfile: deal.seller.sellerProfile,
      },
      payment: deal.payment ? {
        status: deal.payment.status,
        providerRef: deal.payment.providerRef,
      } : null,
    };
  });

  // Get deal by ID (auth required)
  fastify.get('/:id', async (request, reply) => {
    const user = await requireRole(request, reply, ['buyer', 'seller', 'admin']);

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
      return reply.status(404).send({ error: 'Deal not found' });
    }

    // Check access
    if (user.role !== 'admin' && deal.sellerId !== user.id && deal.buyerId !== user.id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    return deal;
  });

  // Seller: Add tracking (transition to SHIPPED)
  fastify.post('/:id/ship', async (request, reply) => {
    const user = await requireRole(request, reply, ['seller']);

    const { id } = z.object({ id: z.string() }).parse(request.params);
    const data = shipDealSchema.parse(request.body);

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!deal) {
      return reply.status(404).send({ error: 'Deal not found' });
    }

    if (deal.sellerId !== user.id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    if (!EscrowStateMachine.canTransition(deal.status, 'SHIPPED', { hasTracking: true })) {
      return reply.status(400).send({ error: `Cannot ship deal in status ${deal.status}` });
    }

    // Set delivered_at and auto_release_at (mock - in production, update when courier API says delivered)
    const deliveredAt = new Date(); // Mock: assume delivered immediately
    const autoReleaseAt = new Date(
      deliveredAt.getTime() + config.AUTO_RELEASE_HOURS * 60 * 60 * 1000
    );

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        status: 'SHIPPED',
        trackingNumber: data.trackingNumber,
        courier: data.courier,
        deliveredAt,
        autoReleaseAt,
      },
    });

    // Log event
    await prisma.dealEvent.create({
      data: {
        dealId: id,
        fromStatus: deal.status,
        toStatus: 'SHIPPED',
        reason: 'Seller added tracking',
        userId: user.id,
      },
    });

    return updated;
  });

  // Buyer: Confirm receipt (transition to RELEASED)
  fastify.post('/:id/confirm', async (request, reply) => {
    const user = await requireRole(request, reply, ['buyer']);

    const { id } = z.object({ id: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      return reply.status(404).send({ error: 'Deal not found' });
    }

    if (deal.buyerId !== user.id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    if (!EscrowStateMachine.canTransition(deal.status, 'RELEASED')) {
      return reply.status(400).send({ error: `Cannot confirm deal in status ${deal.status}` });
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        status: 'RELEASED',
      },
    });

    // Log event
    await prisma.dealEvent.create({
      data: {
        dealId: id,
        fromStatus: deal.status,
        toStatus: 'RELEASED',
        reason: 'Buyer confirmed receipt',
        userId: user.id,
      },
    });

    return updated;
  });

  // Cancel deal (only if PENDING and unpaid)
  fastify.post('/:id/cancel', async (request, reply) => {
    const user = await requireRole(request, reply, ['seller', 'buyer']);

    const { id } = z.object({ id: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!deal) {
      return reply.status(404).send({ error: 'Deal not found' });
    }

    if (deal.sellerId !== user.id && deal.buyerId !== user.id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    if (deal.status !== 'PENDING' || deal.payment?.status === 'PAID') {
      return reply.status(400).send({ error: 'Cannot cancel deal' });
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        status: 'REFUND',
      },
    });

    await prisma.dealEvent.create({
      data: {
        dealId: id,
        fromStatus: deal.status,
        toStatus: 'REFUND',
        reason: 'Deal cancelled',
        userId: user.id,
      },
    });

    return updated;
  });
}
