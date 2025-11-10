import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { requireRole } from '../utils/auth';
import { EscrowStateMachine } from '@essy/core';

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
  resolutionNote: z.string().min(1),
});

export async function disputeRoutes(fastify: FastifyInstance) {
  // Buyer: Open dispute
  fastify.post('/:dealId/open', async (request, reply) => {
    const user = await requireRole(request, reply, ['buyer']);

    const { dealId } = z.object({ dealId: z.string() }).parse(request.params);
    const data = openDisputeSchema.parse(request.body);

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { dispute: true },
    });

    if (!deal) {
      return reply.status(404).send({ error: 'Deal not found' });
    }

    if (deal.buyerId !== user.id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    if (deal.dispute) {
      return reply.status(400).send({ error: 'Dispute already exists' });
    }

    if (!EscrowStateMachine.canTransition(deal.status, 'DISPUTE')) {
      return reply.status(400).send({ error: `Cannot open dispute in status ${deal.status}` });
    }

    const dispute = await prisma.dispute.create({
      data: {
        dealId,
        openedBy: user.id,
        reasonText: data.reasonText,
        status: 'OPEN',
      },
    });

    // Update deal status
    await prisma.deal.update({
      where: { id: dealId },
      data: { status: 'DISPUTE' },
    });

    await prisma.dealEvent.create({
      data: {
        dealId,
        fromStatus: deal.status,
        toStatus: 'DISPUTE',
        reason: 'Buyer opened dispute',
        userId: user.id,
      },
    });

    return dispute;
  });

  // Add evidence to dispute
  fastify.post('/:id/evidence', async (request, reply) => {
    const user = await requireRole(request, reply, ['buyer', 'seller']);

    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const data = addEvidenceSchema.parse(request.body);

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: { deal: true },
    });

    if (!dispute) {
      return reply.status(404).send({ error: 'Dispute not found' });
    }

    // Check access
    if (
      dispute.deal.buyerId !== user.id &&
      dispute.deal.sellerId !== user.id &&
      user.role !== 'admin'
    ) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const evidence = await prisma.evidence.create({
      data: {
        disputeId: id,
        uploadedBy: user.id,
        url: data.url,
        kind: data.kind,
        note: data.note,
      },
    });

    return evidence;
  });

  // Admin: Resolve dispute
  fastify.post('/:id/resolve', async (request, reply) => {
    const admin = await requireRole(request, reply, ['admin']);

    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const data = resolveDisputeSchema.parse(request.body);

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: { deal: { include: { payment: true } } },
    });

    if (!dispute) {
      return reply.status(404).send({ error: 'Dispute not found' });
    }

    if (dispute.status !== 'OPEN' && dispute.status !== 'NEED_MORE_INFO') {
      return reply.status(400).send({ error: 'Dispute already resolved' });
    }

    // Update dispute
    const updatedDispute = await prisma.dispute.update({
      where: { id },
      data: {
        status: data.resolution,
        resolutionNote: data.resolutionNote,
        resolvedAt: new Date(),
      },
    });

    // Update deal and payment
    if (data.resolution === 'RESOLVED_REFUND') {
      await prisma.deal.update({
        where: { id: dispute.dealId },
        data: { status: 'REFUND' },
      });

      if (dispute.deal.payment) {
        await prisma.payment.update({
          where: { id: dispute.deal.payment.id },
          data: { status: 'REFUNDED' },
        });
      }
    } else {
      await prisma.deal.update({
        where: { id: dispute.dealId },
        data: { status: 'RELEASED' },
      });
    }

    await prisma.dealEvent.create({
      data: {
        dealId: dispute.dealId,
        fromStatus: dispute.deal.status,
        toStatus: data.resolution === 'RESOLVED_REFUND' ? 'REFUND' : 'RELEASED',
        reason: `Admin resolved dispute: ${data.resolutionNote}`,
        userId: admin.id,
      },
    });

    return updatedDispute;
  });
}
