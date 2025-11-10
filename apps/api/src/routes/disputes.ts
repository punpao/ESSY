import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate } from '../auth';
import { escrowMachine } from '@thai-escrow/core';

const OpenDisputeSchema = z.object({
  reason: z.enum(['not_received', 'not_as_described', 'other']),
  reason_text: z.string().min(10),
});

const AddEvidenceSchema = z.object({
  kind: z.enum(['image', 'chatlog', 'other']),
  url: z.string().url(),
  note: z.string().optional(),
});

const ResolveDisputeSchema = z.object({
  resolution: z.enum(['RESOLVED_REFUND', 'RESOLVED_RELEASE']),
  resolution_note: z.string().min(1),
});

export default async function disputeRoutes(fastify: FastifyInstance) {
  // Open dispute (buyer only)
  fastify.post('/disputes/:dealId/open', async (request, reply) => {
    const user = await authenticate(request);
    const { dealId } = request.params as { dealId: string };
    const body = OpenDisputeSchema.parse(request.body);
    
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    
    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }
    
    if (deal.buyer_id !== user.id) {
      return reply.code(403).send({ error: 'Only buyer can open dispute' });
    }
    
    // Check if already has open dispute
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        deal_id: dealId,
        status: { in: ['OPEN', 'NEED_MORE_INFO'] },
      },
    });
    
    if (existingDispute) {
      return reply.code(400).send({ error: 'Dispute already open' });
    }
    
    // Validate state transition
    const context = { status: deal.status };
    if (!escrowMachine.canTransition(context, 'open_dispute')) {
      return reply.code(400).send({ error: 'Cannot open dispute in current state' });
    }
    
    const newStatus = escrowMachine.transition(context, 'open_dispute');
    
    const dispute = await prisma.dispute.create({
      data: {
        deal_id: dealId,
        opened_by: user.id,
        reason: body.reason,
        reason_text: body.reason_text,
        status: 'OPEN',
      },
    });
    
    await prisma.deal.update({
      where: { id: dealId },
      data: { status: newStatus },
    });
    
    await prisma.dealEvent.create({
      data: {
        deal_id: dealId,
        event_type: 'dispute_opened',
        actor_id: user.id,
        metadata: { dispute_id: dispute.id, reason: body.reason },
      },
    });
    
    // Add negative reputation event
    await prisma.reputationEvent.create({
      data: {
        seller_id: deal.seller_id,
        type: 'negative',
        weight: -1.0,
        note: `Dispute opened on deal ${dealId}`,
      },
    });
    
    return { dispute };
  });

  // Add evidence to dispute
  fastify.post('/disputes/:id/evidence', async (request, reply) => {
    const user = await authenticate(request);
    const { id } = request.params as { id: string };
    const body = AddEvidenceSchema.parse(request.body);
    
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: { deal: true },
    });
    
    if (!dispute) {
      return reply.code(404).send({ error: 'Dispute not found' });
    }
    
    // Only buyer or seller can add evidence
    if (dispute.opened_by !== user.id && dispute.deal.seller_id !== user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
    
    const evidence = await prisma.evidence.create({
      data: {
        dispute_id: id,
        uploaded_by: user.id,
        kind: body.kind,
        url: body.url,
        note: body.note,
      },
    });
    
    return { evidence };
  });

  // Resolve dispute (admin only)
  fastify.post('/disputes/:id/resolve', async (request, reply) => {
    const user = await authenticate(request);
    const { id } = request.params as { id: string };
    const body = ResolveDisputeSchema.parse(request.body);
    
    if (user.role !== 'admin') {
      return reply.code(403).send({ error: 'Admin only' });
    }
    
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: { deal: true },
    });
    
    if (!dispute) {
      return reply.code(404).send({ error: 'Dispute not found' });
    }
    
    const action = body.resolution === 'RESOLVED_REFUND' ? 'resolve_refund' : 'resolve_release';
    const context = { status: dispute.deal.status };
    
    if (!escrowMachine.canTransition(context, action)) {
      return reply.code(400).send({ error: 'Invalid state transition' });
    }
    
    const newStatus = escrowMachine.transition(context, action);
    
    const updatedDispute = await prisma.dispute.update({
      where: { id },
      data: {
        status: body.resolution,
        resolution_note: body.resolution_note,
        resolved_at: new Date(),
      },
    });
    
    await prisma.deal.update({
      where: { id: dispute.deal_id },
      data: { status: newStatus },
    });
    
    await prisma.dealEvent.create({
      data: {
        deal_id: dispute.deal_id,
        event_type: 'dispute_resolved',
        actor_id: user.id,
        metadata: { resolution: body.resolution, note: body.resolution_note },
      },
    });
    
    // If resolved with release, remove negative reputation
    if (body.resolution === 'RESOLVED_RELEASE') {
      await prisma.reputationEvent.create({
        data: {
          seller_id: dispute.deal.seller_id,
          type: 'positive',
          weight: 0.5,
          note: `Dispute resolved in seller favor on deal ${dispute.deal_id}`,
        },
      });
    }
    
    return { dispute: updatedDispute };
  });

  // Get dispute details
  fastify.get('/disputes/:id', async (request, reply) => {
    const user = await authenticate(request);
    const { id } = request.params as { id: string };
    
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        deal: true,
        evidence: {
          include: {
            uploader: {
              select: { id: true, display_name: true },
            },
          },
        },
      },
    });
    
    if (!dispute) {
      return reply.code(404).send({ error: 'Dispute not found' });
    }
    
    // Only involved parties or admin can view
    if (
      dispute.opened_by !== user.id &&
      dispute.deal.seller_id !== user.id &&
      user.role !== 'admin'
    ) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
    
    return { dispute };
  });
}
