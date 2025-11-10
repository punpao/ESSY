import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../auth';
import { EscrowStateMachine } from '@essy/core';
import { z } from 'zod';

const openDisputeSchema = z.object({
  reasonText: z.string().min(10),
});

const addEvidenceSchema = z.object({
  url: z.string().url(),
  kind: z.enum(['image', 'chatlog', 'other']),
  note: z.string().optional(),
});

const resolveDisputeSchema = z.object({
  resolution: z.enum(['RESOLVED_REFUND', 'RESOLVED_RELEASE']),
  resolutionNote: z.string().min(10),
});

export async function disputeRoutes(fastify: FastifyInstance) {
  // Open dispute
  fastify.post('/disputes/:dealId/open', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await requireAuth(request);
    const { dealId } = z.object({ dealId: z.string() }).parse(request.params);
    const { reasonText } = openDisputeSchema.parse(request.body);

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }

    if (deal.buyerId !== user.id) {
      return reply.code(403).send({ error: 'Only buyer can open dispute' });
    }

    if (!EscrowStateMachine.canOpenDispute(deal.status)) {
      return reply.code(400).send({ error: `Cannot open dispute for deal in status ${deal.status}` });
    }

    // Check if dispute already exists
    const existing = await prisma.dispute.findUnique({
      where: { dealId },
    });

    if (existing) {
      return reply.code(400).send({ error: 'Dispute already exists' });
    }

    const dispute = await prisma.dispute.create({
      data: {
        dealId,
        openedBy: user.id,
        reasonText,
        status: 'OPEN',
      },
    });

    // Update deal status
    await prisma.deal.update({
      where: { id: dealId },
      data: {
        status: 'DISPUTE',
      },
    });

    return dispute;
  });

  // Add evidence
  fastify.post('/disputes/:id/evidence', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await requireAuth(request);
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { url, kind, note } = addEvidenceSchema.parse(request.body);

    const dispute = await prisma.dispute.findUnique({
      where: { id },
    });

    if (!dispute) {
      return reply.code(404).send({ error: 'Dispute not found' });
    }

    // Check access
    const deal = await prisma.deal.findUnique({
      where: { id: dispute.dealId },
    });

    if (!deal || (deal.buyerId !== user.id && deal.sellerId !== user.id && user.role !== 'admin')) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const evidence = await prisma.evidence.create({
      data: {
        disputeId: id,
        uploadedBy: user.id,
        kind: kind as any,
        url,
        note,
      },
    });

    return evidence;
  });

  // Resolve dispute (admin only)
  fastify.post('/disputes/:id/resolve', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await requireRole(request, 'admin');
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
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
    const updated = await prisma.dispute.update({
      where: { id },
      data: {
        status: resolution as any,
        resolutionNote,
        resolvedAt: new Date(),
      },
    });

    // Update deal and payment
    if (resolution === 'RESOLVED_REFUND') {
      await prisma.deal.update({
        where: { id: dispute.dealId },
        data: { status: 'REFUND' },
      });

      await prisma.payment.update({
        where: { dealId: dispute.dealId },
        data: { status: 'REFUNDED' },
      });
    } else if (resolution === 'RESOLVED_RELEASE') {
      await prisma.deal.update({
        where: { id: dispute.dealId },
        data: { status: 'RELEASED' },
      });
    }

    return updated;
  });
}
