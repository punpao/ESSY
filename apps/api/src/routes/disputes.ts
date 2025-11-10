import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth } from '../auth';
import { EscrowStateMachine } from '@thai-escrow/core';

const openDisputeSchema = z.object({
  reasonText: z.string().min(10),
});

const addEvidenceSchema = z.object({
  kind: z.enum(['image', 'chatlog', 'other']),
  url: z.string().url(),
  note: z.string().optional(),
});

const resolveDisputeSchema = z.object({
  resolution: z.enum(['RESOLVED_REFUND', 'RESOLVED_RELEASE']),
  resolutionNote: z.string().min(5),
});

export const disputeRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /disputes/:dealId/open - Open dispute (buyer only)
  fastify.post('/:dealId/open', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = requireAuth(request);
      const { dealId } = request.params as { dealId: string };
      const { reasonText } = openDisputeSchema.parse(request.body);

      const deal = await prisma.deal.findUnique({ where: { id: dealId } });
      if (!deal) {
        return reply.code(404).send({ error: 'Deal not found' });
      }

      if (deal.buyer_id !== user.id) {
        return reply.code(403).send({ error: 'Only buyer can open dispute' });
      }

      if (!['HOLD', 'SHIPPED'].includes(deal.status)) {
        return reply.code(400).send({ error: 'Cannot dispute in current status' });
      }

      // Check if dispute already exists
      const existingDispute = await prisma.dispute.findFirst({
        where: {
          deal_id: dealId,
          status: { in: ['OPEN', 'NEED_MORE_INFO'] },
        },
      });

      if (existingDispute) {
        return reply.code(400).send({ error: 'Dispute already open for this deal' });
      }

      // Create dispute
      const dispute = await prisma.dispute.create({
        data: {
          deal_id: dealId,
          opened_by: user.id,
          reason_text: reasonText,
          status: 'OPEN',
        },
      });

      // Transition deal to DISPUTE
      const newStatus = EscrowStateMachine.transition(deal.status as any, 'OPEN_DISPUTE', {
        currentStatus: deal.status as any,
      });

      await prisma.deal.update({
        where: { id: dealId },
        data: { status: newStatus },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: dealId,
          event_type: 'dispute_opened',
          from_status: deal.status,
          to_status: newStatus,
          actor_id: user.id,
          metadata: JSON.stringify({ disputeId: dispute.id }),
        },
      });

      return dispute;
    },
  });

  // POST /disputes/:id/evidence - Add evidence
  fastify.post('/:id/evidence', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = requireAuth(request);
      const { id } = request.params as { id: string };
      const { kind, url, note } = addEvidenceSchema.parse(request.body);

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: { deal: true },
      });

      if (!dispute) {
        return reply.code(404).send({ error: 'Dispute not found' });
      }

      // Only buyer or seller can add evidence
      if (
        dispute.opened_by !== user.id &&
        dispute.deal.seller_id !== user.id &&
        user.role !== 'admin'
      ) {
        return reply.code(403).send({ error: 'Not authorized' });
      }

      const evidence = await prisma.evidence.create({
        data: {
          dispute_id: id,
          uploaded_by: user.id,
          kind,
          url,
          note,
        },
      });

      return evidence;
    },
  });

  // POST /disputes/:id/resolve - Resolve dispute (admin only)
  fastify.post('/:id/resolve', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = requireAuth(request);
      if (user.role !== 'admin') {
        return reply.code(403).send({ error: 'Admin only' });
      }

      const { id } = request.params as { id: string };
      const { resolution, resolutionNote } = resolveDisputeSchema.parse(request.body);

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: { deal: true },
      });

      if (!dispute) {
        return reply.code(404).send({ error: 'Dispute not found' });
      }

      if (dispute.status !== 'OPEN' && dispute.status !== 'NEED_MORE_INFO') {
        return reply.code(400).send({ error: 'Dispute already resolved' });
      }

      // Update dispute
      const updatedDispute = await prisma.dispute.update({
        where: { id },
        data: {
          status: resolution,
          resolution_note: resolutionNote,
          resolved_at: new Date(),
        },
      });

      // Transition deal
      const event = resolution === 'RESOLVED_REFUND' ? 'RESOLVE_REFUND' : 'RESOLVE_RELEASE';
      const newStatus = EscrowStateMachine.transition('DISPUTE', event, {
        currentStatus: 'DISPUTE',
        isAdmin: true,
      });

      await prisma.deal.update({
        where: { id: dispute.deal_id },
        data: { status: newStatus },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: dispute.deal_id,
          event_type: 'dispute_resolved',
          from_status: 'DISPUTE',
          to_status: newStatus,
          actor_id: user.id,
          metadata: JSON.stringify({ disputeId: id, resolution, resolutionNote }),
        },
      });

      // If refund, process refund
      if (resolution === 'RESOLVED_REFUND') {
        // Trigger refund via payment route (already implemented)
        // In production, call payment service
      }

      // Update seller reputation
      if (resolution === 'RESOLVED_REFUND') {
        const sellerProfile = await prisma.sellerProfile.findUnique({
          where: { user_id: dispute.deal.seller_id },
        });

        if (sellerProfile) {
          await prisma.reputationEvent.create({
            data: {
              seller_id: sellerProfile.id,
              type: 'negative',
              weight: -2.0,
              note: `Dispute ${id} resolved as refund`,
            },
          });

          // Recalculate reputation
          const releasedCount = await prisma.deal.count({
            where: {
              seller_id: dispute.deal.seller_id,
              status: 'RELEASED',
            },
          });

          const disputeCount = await prisma.dispute.count({
            where: {
              deal: {
                seller_id: dispute.deal.seller_id,
              },
              status: { startsWith: 'RESOLVED_REFUND' },
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
      }

      return updatedDispute;
    },
  });

  // GET /disputes/:id - Get dispute details
  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = requireAuth(request);
      const { id } = request.params as { id: string };

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: {
          deal: {
            include: {
              seller: true,
              buyer: true,
            },
          },
          opener: true,
          evidence: {
            include: {
              uploader: true,
            },
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      });

      if (!dispute) {
        return reply.code(404).send({ error: 'Dispute not found' });
      }

      // Check authorization
      if (
        dispute.opened_by !== user.id &&
        dispute.deal.seller_id !== user.id &&
        user.role !== 'admin'
      ) {
        return reply.code(403).send({ error: 'Not authorized' });
      }

      return dispute;
    },
  });
};
