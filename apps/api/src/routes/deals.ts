import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ulid } from 'ulid';
import { db } from '../lib/db';
import { authenticate } from '../lib/auth';
import { transition } from '@escrow/core';
import { DealStatus } from '@prisma/client';

const dealRoutes: FastifyPluginAsync = async (fastify) => {
  // Create deal (seller only)
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const schema = z.object({
      title: z.string().min(1).max(200),
      amountSatang: z.number().int().positive(),
      buyerNote: z.string().optional(),
    });

    const { title, amountSatang, buyerNote } = schema.parse(request.body);
    const user = request.user!;

    // Check if user is seller
    const sellerProfile = await db.sellerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!sellerProfile) {
      return reply.status(403).send({ error: 'Must be a seller to create deals' });
    }

    // Generate paylink token
    const paylinkToken = ulid();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const deal = await db.deal.create({
      data: {
        title,
        amountSatang,
        currency: 'THB',
        sellerId: user.id,
        status: 'PENDING',
        paylinkToken,
        expiresAt,
      },
      include: {
        seller: {
          include: {
            sellerProfile: true,
          },
        },
      },
    });

    // Log event
    await db.dealEvent.create({
      data: {
        dealId: deal.id,
        eventType: 'CREATED',
        toState: 'PENDING',
        metadata: { buyerNote },
      },
    });

    const paylinkUrl = `${process.env.APP_BASE_URL}/pay/${paylinkToken}`;

    return {
      deal,
      paylinkUrl,
    };
  });

  // Get deal by ID
  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    const schema = z.object({
      id: z.string().uuid(),
    });

    const { id } = schema.parse(request.params);
    const user = request.user!;

    const deal = await db.deal.findUnique({
      where: { id },
      include: {
        seller: {
          include: {
            sellerProfile: true,
          },
        },
        buyer: true,
        payments: true,
        disputes: {
          include: {
            evidence: true,
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!deal) {
      return reply.status(404).send({ error: 'Deal not found' });
    }

    // Check authorization
    if (
      deal.sellerId !== user.id &&
      deal.buyerId !== user.id &&
      user.role !== 'admin'
    ) {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    return deal;
  });

  // Get deal by paylink token (public)
  fastify.get('/paylink/:token', async (request, reply) => {
    const schema = z.object({
      token: z.string(),
    });

    const { token } = schema.parse(request.params);

    const deal = await db.deal.findUnique({
      where: { paylinkToken: token },
      include: {
        seller: {
          include: {
            sellerProfile: true,
          },
        },
        payments: {
          where: { status: 'PAID' },
          take: 1,
        },
      },
    });

    if (!deal) {
      return reply.status(404).send({ error: 'Deal not found' });
    }

    if (deal.expiresAt < new Date()) {
      return reply.status(410).send({ error: 'Deal expired' });
    }

    return deal;
  });

  // Ship deal (add tracking)
  fastify.post('/:id/ship', { preHandler: authenticate }, async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });
    const bodySchema = z.object({
      trackingNumber: z.string(),
      courier: z.string(),
    });

    const { id } = paramsSchema.parse(request.params);
    const { trackingNumber, courier } = bodySchema.parse(request.body);
    const user = request.user!;

    const deal = await db.deal.findUnique({ where: { id } });
    if (!deal) {
      return reply.status(404).send({ error: 'Deal not found' });
    }

    if (deal.sellerId !== user.id) {
      return reply.status(403).send({ error: 'Only seller can add tracking' });
    }

    // Check state transition
    const result = transition(deal.status as DealStatus, {
      type: 'SHIP',
      trackingNumber,
      courier,
    });

    if (!result.valid) {
      return reply.status(400).send({ error: result.error });
    }

    // Calculate auto-release time (48 hours after marking shipped)
    const autoReleaseHours = parseInt(process.env.AUTO_RELEASE_HOURS || '48');
    const autoReleaseAt = new Date(Date.now() + autoReleaseHours * 60 * 60 * 1000);

    const updated = await db.deal.update({
      where: { id },
      data: {
        status: result.newStatus,
        trackingNumber,
        courier,
        autoReleaseAt,
      },
    });

    // Log event
    await db.dealEvent.create({
      data: {
        dealId: id,
        eventType: 'SHIP',
        fromState: deal.status,
        toState: result.newStatus!,
        metadata: { trackingNumber, courier },
      },
    });

    return updated;
  });

  // Confirm received (buyer)
  fastify.post(
    '/:id/confirm',
    { preHandler: authenticate },
    async (request, reply) => {
      const schema = z.object({
        id: z.string().uuid(),
      });

      const { id } = schema.parse(request.params);
      const user = request.user!;

      const deal = await db.deal.findUnique({ where: { id } });
      if (!deal) {
        return reply.status(404).send({ error: 'Deal not found' });
      }

      if (deal.buyerId !== user.id) {
        return reply.status(403).send({ error: 'Only buyer can confirm' });
      }

      // Check state transition
      const result = transition(deal.status as DealStatus, {
        type: 'CONFIRM_RECEIVED',
      });

      if (!result.valid) {
        return reply.status(400).send({ error: result.error });
      }

      const updated = await db.deal.update({
        where: { id },
        data: {
          status: result.newStatus,
          deliveredAt: new Date(),
        },
      });

      // Log event
      await db.dealEvent.create({
        data: {
          dealId: id,
          eventType: 'CONFIRM_RECEIVED',
          fromState: deal.status,
          toState: result.newStatus!,
        },
      });

      // Create positive reputation event
      await db.reputationEvent.create({
        data: {
          sellerId: deal.sellerId,
          type: 'positive',
          weight: 1.0,
          note: `Deal ${id} completed successfully`,
        },
      });

      return updated;
    }
  );

  // Cancel deal (only if PENDING and unpaid)
  fastify.post('/:id/cancel', { preHandler: authenticate }, async (request, reply) => {
    const schema = z.object({
      id: z.string().uuid(),
    });

    const { id } = schema.parse(request.params);
    const user = request.user!;

    const deal = await db.deal.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!deal) {
      return reply.status(404).send({ error: 'Deal not found' });
    }

    if (deal.sellerId !== user.id) {
      return reply.status(403).send({ error: 'Only seller can cancel' });
    }

    if (deal.status !== 'PENDING') {
      return reply.status(400).send({ error: 'Can only cancel PENDING deals' });
    }

    const hasPaidPayment = deal.payments.some((p) => p.status === 'PAID');
    if (hasPaidPayment) {
      return reply.status(400).send({ error: 'Cannot cancel paid deal' });
    }

    // Just delete the deal for MVP
    await db.deal.delete({ where: { id } });

    return { message: 'Deal cancelled' };
  });
};

export default dealRoutes;
