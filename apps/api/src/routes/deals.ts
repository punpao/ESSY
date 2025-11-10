import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth } from '../auth';
import { generateULID, generatePaylinkToken, calculateAutoReleaseDate } from '@thai-escrow/core';
import { EscrowStateMachine } from '@thai-escrow/core';
import { config } from '../config';

const createDealSchema = z.object({
  title: z.string().min(3).max(200),
  amountSatang: z.number().int().positive(),
  description: z.string().optional(),
});

const shipDealSchema = z.object({
  trackingNumber: z.string().min(5),
  courier: z.string().min(2),
});

export const dealRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /deals - Create deal (seller only)
  fastify.post('/', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = requireAuth(request);
      
      // Check seller profile exists
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { user_id: user.id },
      });

      if (!sellerProfile) {
        return reply.code(400).send({ error: 'Must be a verified seller' });
      }

      const { title, amountSatang, description } = createDealSchema.parse(request.body);

      const paylinkToken = generatePaylinkToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const deal = await prisma.deal.create({
        data: {
          id: generateULID(),
          title,
          amount_satang: amountSatang,
          currency: 'THB',
          seller_id: user.id,
          status: 'PENDING',
          paylink_token: paylinkToken,
          expires_at: expiresAt,
        },
      });

      // Log event
      await prisma.dealEvent.create({
        data: {
          deal_id: deal.id,
          event_type: 'created',
          to_status: 'PENDING',
          actor_id: user.id,
        },
      });

      const paylinkUrl = `${config.appBaseUrl}/pay/${paylinkToken}`;

      return {
        deal,
        paylinkUrl,
      };
    },
  });

  // GET /deals/:id - Get deal details
  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = requireAuth(request);
      const { id } = request.params as { id: string };

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: {
          seller: {
            include: {
              seller_profile: true,
            },
          },
          buyer: true,
          payments: true,
          disputes: true,
        },
      });

      if (!deal) {
        return reply.code(404).send({ error: 'Deal not found' });
      }

      // Check authorization
      if (deal.seller_id !== user.id && deal.buyer_id !== user.id && user.role !== 'admin') {
        return reply.code(403).send({ error: 'Not authorized' });
      }

      return deal;
    },
  });

  // GET /deals/token/:token - Get deal by paylink token (public for buyer)
  fastify.get('/token/:token', async (request, reply) => {
    const { token } = request.params as { token: string };

    const deal = await prisma.deal.findUnique({
      where: { paylink_token: token },
      include: {
        seller: {
          include: {
            seller_profile: true,
          },
        },
        payments: true,
      },
    });

    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }

    // Don't expose sensitive seller info
    return {
      id: deal.id,
      title: deal.title,
      amount_satang: deal.amount_satang,
      currency: deal.currency,
      status: deal.status,
      expires_at: deal.expires_at,
      seller: {
        id: deal.seller.id,
        display_name: deal.seller.display_name,
        verified: deal.seller.seller_profile?.verified || false,
        reputation_score: deal.seller.seller_profile?.reputation_score || 0,
      },
      has_payment: deal.payments.some((p) => p.status === 'PAID'),
    };
  });

  // POST /deals/:id/ship - Add tracking (seller only)
  fastify.post('/:id/ship', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = requireAuth(request);
      const { id } = request.params as { id: string };
      const { trackingNumber, courier } = shipDealSchema.parse(request.body);

      const deal = await prisma.deal.findUnique({ where: { id } });
      if (!deal) {
        return reply.code(404).send({ error: 'Deal not found' });
      }

      if (deal.seller_id !== user.id) {
        return reply.code(403).send({ error: 'Not authorized' });
      }

      if (deal.status !== 'HOLD') {
        return reply.code(400).send({ error: `Cannot ship from status: ${deal.status}` });
      }

      // Transition to SHIPPED
      const newStatus = EscrowStateMachine.transition('HOLD', 'ADD_TRACKING', {
        currentStatus: 'HOLD',
        hasTracking: true,
      });

      // Mock delivered_at (in real system, track via courier API)
      const deliveredAt = new Date();
      deliveredAt.setDate(deliveredAt.getDate() + 3); // Mock 3 days delivery

      const autoReleaseAt = calculateAutoReleaseDate(deliveredAt, config.autoReleaseHours);

      const updatedDeal = await prisma.deal.update({
        where: { id },
        data: {
          status: newStatus,
          tracking_number: trackingNumber,
          courier,
          delivered_at: deliveredAt,
          auto_release_at: autoReleaseAt,
        },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: deal.id,
          event_type: 'shipped',
          from_status: 'HOLD',
          to_status: newStatus,
          actor_id: user.id,
          metadata: JSON.stringify({ trackingNumber, courier }),
        },
      });

      return updatedDeal;
    },
  });

  // POST /deals/:id/confirm - Buyer confirms receipt
  fastify.post('/:id/confirm', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = requireAuth(request);
      const { id } = request.params as { id: string };

      const deal = await prisma.deal.findUnique({ where: { id } });
      if (!deal) {
        return reply.code(404).send({ error: 'Deal not found' });
      }

      if (deal.buyer_id !== user.id) {
        return reply.code(403).send({ error: 'Only buyer can confirm' });
      }

      if (deal.status !== 'SHIPPED') {
        return reply.code(400).send({ error: `Cannot confirm from status: ${deal.status}` });
      }

      const newStatus = EscrowStateMachine.transition('SHIPPED', 'CONFIRM_RECEIVED', {
        currentStatus: 'SHIPPED',
      });

      const updatedDeal = await prisma.deal.update({
        where: { id },
        data: {
          status: newStatus,
        },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: deal.id,
          event_type: 'confirmed',
          from_status: 'SHIPPED',
          to_status: newStatus,
          actor_id: user.id,
        },
      });

      // Update seller reputation
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { user_id: deal.seller_id },
      });

      if (sellerProfile) {
        await prisma.reputationEvent.create({
          data: {
            seller_id: sellerProfile.id,
            type: 'positive',
            weight: 1.0,
            note: `Deal ${deal.id} completed successfully`,
          },
        });

        // Recalculate reputation (simple count for now)
        const releasedCount = await prisma.deal.count({
          where: {
            seller_id: deal.seller_id,
            status: 'RELEASED',
          },
        });

        const disputeCount = await prisma.dispute.count({
          where: {
            deal: {
              seller_id: deal.seller_id,
            },
          },
        });

        const newScore = releasedCount * 10 - disputeCount * 5;

        await prisma.sellerProfile.update({
          where: { id: sellerProfile.id },
          data: {
            reputation_score: Math.max(0, newScore),
          },
        });
      }

      return updatedDeal;
    },
  });

  // POST /deals/:id/cancel - Cancel deal (seller only, before payment)
  fastify.post('/:id/cancel', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = requireAuth(request);
      const { id } = request.params as { id: string };

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: { payments: true },
      });

      if (!deal) {
        return reply.code(404).send({ error: 'Deal not found' });
      }

      if (deal.seller_id !== user.id) {
        return reply.code(403).send({ error: 'Not authorized' });
      }

      const hasPaidPayment = deal.payments.some((p) => p.status === 'PAID');
      if (hasPaidPayment) {
        return reply.code(400).send({ error: 'Cannot cancel after payment' });
      }

      const newStatus = EscrowStateMachine.transition('PENDING', 'CANCEL', {
        currentStatus: 'PENDING',
        hasPayment: false,
      });

      const updatedDeal = await prisma.deal.update({
        where: { id },
        data: { status: newStatus },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: deal.id,
          event_type: 'cancelled',
          from_status: 'PENDING',
          to_status: newStatus,
          actor_id: user.id,
        },
      });

      return updatedDeal;
    },
  });

  // GET /deals/my/all - Get user's deals
  fastify.get('/my/all', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = requireAuth(request);

      const deals = await prisma.deal.findMany({
        where: {
          OR: [{ seller_id: user.id }, { buyer_id: user.id }],
        },
        include: {
          seller: true,
          buyer: true,
          payments: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return deals;
    },
  });
};
