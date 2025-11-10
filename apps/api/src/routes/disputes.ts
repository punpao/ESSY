import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import { authenticate, requireRole } from '../lib/auth';
import { transition } from '@escrow/core';
import { DealStatus } from '@prisma/client';

const disputeRoutes: FastifyPluginAsync = async (fastify) => {
  // Open dispute (buyer only)
  fastify.post('/:dealId/open', { preHandler: authenticate }, async (request, reply) => {
    const paramsSchema = z.object({
      dealId: z.string().uuid(),
    });
    const bodySchema = z.object({
      reason: z.string().min(10),
      reasonCategory: z.enum(['not_received', 'not_as_described', 'other']).optional(),
    });

    const { dealId } = paramsSchema.parse(request.params);
    const { reason, reasonCategory } = bodySchema.parse(request.body);
    const user = request.user!;

    const deal = await db.deal.findUnique({
      where: { id: dealId },
      include: { disputes: true },
    });

    if (!deal) {
      return reply.status(404).send({ error: 'Deal not found' });
    }

    if (deal.buyerId !== user.id) {
      return reply.status(403).send({ error: 'Only buyer can open dispute' });
    }

    // Check if dispute already exists
    const existingDispute = deal.disputes.find((d) => d.status === 'OPEN');
    if (existingDispute) {
      return reply.status(400).send({ error: 'Dispute already exists' });
    }

    // Check state transition
    const result = transition(deal.status as DealStatus, {
      type: 'OPEN_DISPUTE',
      reason,
    });

    if (!result.valid) {
      return reply.status(400).send({ error: result.error });
    }

    // Create dispute
    const dispute = await db.dispute.create({
      data: {
        dealId,
        openedBy: user.id,
        reasonText: reason,
        status: 'OPEN',
      },
      include: {
        deal: true,
        opener: true,
      },
    });

    // Update deal status
    await db.deal.update({
      where: { id: dealId },
      data: { status: result.newStatus },
    });

    // Log event
    await db.dealEvent.create({
      data: {
        dealId,
        eventType: 'OPEN_DISPUTE',
        fromState: deal.status,
        toState: result.newStatus!,
        metadata: { disputeId: dispute.id, reasonCategory },
      },
    });

    return dispute;
  });

  // Get dispute by ID
  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    const schema = z.object({
      id: z.string().uuid(),
    });

    const { id } = schema.parse(request.params);
    const user = request.user!;

    const dispute = await db.dispute.findUnique({
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
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!dispute) {
      return reply.status(404).send({ error: 'Dispute not found' });
    }

    // Check authorization
    if (
      dispute.deal.sellerId !== user.id &&
      dispute.deal.buyerId !== user.id &&
      user.role !== 'admin'
    ) {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    return dispute;
  });

  // Upload evidence
  fastify.post('/:id/evidence', { preHandler: authenticate }, async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });
    const bodySchema = z.object({
      kind: z.enum(['image', 'chatlog', 'other']),
      url: z.string().url(),
      note: z.string().optional(),
    });

    const { id } = paramsSchema.parse(request.params);
    const { kind, url, note } = bodySchema.parse(request.body);
    const user = request.user!;

    const dispute = await db.dispute.findUnique({
      where: { id },
      include: { deal: true },
    });

    if (!dispute) {
      return reply.status(404).send({ error: 'Dispute not found' });
    }

    // Check authorization (buyer, seller, or admin)
    if (
      dispute.deal.sellerId !== user.id &&
      dispute.deal.buyerId !== user.id &&
      user.role !== 'admin'
    ) {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    const evidence = await db.evidence.create({
      data: {
        disputeId: id,
        uploadedBy: user.id,
        kind,
        url,
        note,
      },
      include: {
        uploader: true,
      },
    });

    return evidence;
  });

  // Resolve dispute (admin only)
  fastify.post('/:id/resolve', { preHandler: requireRole('admin') }, async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });
    const bodySchema = z.object({
      resolution: z.enum(['refund', 'release']),
      note: z.string().optional(),
    });

    const { id } = paramsSchema.parse(request.params);
    const { resolution, note } = bodySchema.parse(request.body);

    const dispute = await db.dispute.findUnique({
      where: { id },
      include: { deal: true },
    });

    if (!dispute) {
      return reply.status(404).send({ error: 'Dispute not found' });
    }

    if (dispute.status !== 'OPEN') {
      return reply.status(400).send({ error: 'Dispute already resolved' });
    }

    if (resolution === 'refund') {
      // Check state transition
      const result = transition(dispute.deal.status as DealStatus, {
        type: 'RESOLVE_REFUND',
      });

      if (!result.valid) {
        return reply.status(400).send({ error: result.error });
      }

      // Update dispute
      await db.dispute.update({
        where: { id },
        data: {
          status: 'RESOLVED_REFUND',
          resolutionNote: note,
          resolvedAt: new Date(),
        },
      });

      // Refund payment
      const payment = await db.payment.findFirst({
        where: {
          dealId: dispute.dealId,
          status: 'PAID',
        },
      });

      if (payment) {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' },
        });
      }

      // Update deal
      await db.deal.update({
        where: { id: dispute.dealId },
        data: { status: 'REFUND' },
      });

      // Create negative reputation event
      await db.reputationEvent.create({
        data: {
          sellerId: dispute.deal.sellerId,
          type: 'negative',
          weight: 1.0,
          note: `Dispute ${id} resolved as refund`,
        },
      });

      // Log event
      await db.dealEvent.create({
        data: {
          dealId: dispute.dealId,
          eventType: 'RESOLVE_REFUND',
          fromState: dispute.deal.status,
          toState: 'REFUND',
          metadata: { disputeId: id, note },
        },
      });

      return { message: 'Dispute resolved with refund', status: 'REFUND' };
    } else {
      // Release funds to seller
      const result = transition(dispute.deal.status as DealStatus, {
        type: 'RESOLVE_RELEASE',
      });

      if (!result.valid) {
        return reply.status(400).send({ error: result.error });
      }

      // Update dispute
      await db.dispute.update({
        where: { id },
        data: {
          status: 'RESOLVED_RELEASE',
          resolutionNote: note,
          resolvedAt: new Date(),
        },
      });

      // Update deal
      await db.deal.update({
        where: { id: dispute.dealId },
        data: { status: 'RELEASED' },
      });

      // Create positive reputation event (dispute but resolved in seller favor)
      await db.reputationEvent.create({
        data: {
          sellerId: dispute.deal.sellerId,
          type: 'neutral',
          weight: 0.5,
          note: `Dispute ${id} resolved as release`,
        },
      });

      // Log event
      await db.dealEvent.create({
        data: {
          dealId: dispute.dealId,
          eventType: 'RESOLVE_RELEASE',
          fromState: dispute.deal.status,
          toState: 'RELEASED',
          metadata: { disputeId: id, note },
        },
      });

      return { message: 'Dispute resolved with release', status: 'RELEASED' };
    }
  });
};

export default disputeRoutes;
