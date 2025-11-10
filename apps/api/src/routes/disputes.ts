import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../lib/auth';
import { transitionDealStatus } from '../lib/escrow';
import { z } from 'zod';
import { ulid } from 'ulid';

export async function disputesRoutes(fastify: FastifyInstance) {
  // Open dispute
  fastify.post('/disputes/:dealId/open', async (request, reply) => {
    const user = await requireAuth(request, reply);

    const params = z.object({ dealId: z.string() }).parse(request.params);
    const body = z
      .object({
        reason_text: z.string().min(1),
      })
      .parse(request.body);

    const deal = await prisma.deal.findUnique({
      where: { id: params.dealId },
      include: { dispute: true },
    });

    if (!deal) {
      reply.code(404).send({ error: 'Deal not found' });
      return;
    }

    if (deal.buyer_id !== user.id && user.role !== 'admin') {
      reply.code(403).send({ error: 'Only buyer can open dispute' });
      return;
    }

    if (deal.dispute) {
      reply.code(400).send({ error: 'Dispute already exists' });
      return;
    }

    const dispute = await prisma.dispute.create({
      data: {
        id: ulid(),
        deal_id: deal.id,
        opened_by: user.id,
        reason_text: body.reason_text,
        status: 'OPEN',
      },
    });

    await transitionDealStatus(deal.id, { type: 'DISPUTE_OPENED' }, user.id);

    return dispute;
  });

  // Add evidence
  fastify.post('/disputes/:id/evidence', async (request, reply) => {
    const user = await requireAuth(request, reply);

    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z
      .object({
        url: z.string().url(),
        kind: z.enum(['image', 'chatlog', 'other']),
        note: z.string().optional(),
      })
      .parse(request.body);

    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
    });

    if (!dispute) {
      reply.code(404).send({ error: 'Dispute not found' });
      return;
    }

    // Check access
    const deal = await prisma.deal.findUnique({
      where: { id: dispute.deal_id },
    });

    if (
      deal?.buyer_id !== user.id &&
      deal?.seller_id !== user.id &&
      user.role !== 'admin'
    ) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    const evidence = await prisma.evidence.create({
      data: {
        id: ulid(),
        dispute_id: dispute.id,
        uploaded_by: user.id,
        url: body.url,
        kind: body.kind,
        note: body.note || null,
      },
    });

    return evidence;
  });

  // Resolve dispute (admin only)
  fastify.post('/disputes/:id/resolve', async (request, reply) => {
    const admin = await requireRole(request, reply, ['admin']);

    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z
      .object({
        resolution: z.enum(['RESOLVED_REFUND', 'RESOLVED_RELEASE']),
        resolution_note: z.string().optional(),
      })
      .parse(request.body);

    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
      include: { deal: true },
    });

    if (!dispute) {
      reply.code(404).send({ error: 'Dispute not found' });
      return;
    }

    const updated = await prisma.dispute.update({
      where: { id: params.id },
      data: {
        status: body.resolution,
        resolution_note: body.resolution_note || null,
        resolved_at: new Date(),
      },
    });

    // Transition deal
    if (body.resolution === 'RESOLVED_REFUND') {
      await transitionDealStatus(dispute.deal_id, { type: 'DISPUTE_RESOLVED_REFUND' }, admin.id);
    } else {
      await transitionDealStatus(dispute.deal_id, { type: 'DISPUTE_RESOLVED_RELEASE' }, admin.id);
    }

    return updated;
  });
}
