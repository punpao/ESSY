import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { requireRole } from '../lib/auth';
import { transitionDealStatus } from '../lib/escrow';
import { z } from 'zod';

export async function adminRoutes(fastify: FastifyInstance) {
  // Get all deals with filters
  fastify.get('/admin/deals', async (request, reply) => {
    await requireRole(request, reply, ['admin']);

    const query = z
      .object({
        status: z.string().optional(),
        seller_id: z.string().optional(),
        buyer_id: z.string().optional(),
      })
      .parse(request.query);

    const deals = await prisma.deal.findMany({
      where: {
        ...(query.status && { status: query.status as any }),
        ...(query.seller_id && { seller_id: query.seller_id }),
        ...(query.buyer_id && { buyer_id: query.buyer_id }),
      },
      include: {
        seller: {
          include: {
            seller_profile: true,
          },
        },
        buyer: true,
        payment: true,
        dispute: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return deals;
  });

  // Get all disputes
  fastify.get('/admin/disputes', async (request, reply) => {
    await requireRole(request, reply, ['admin']);

    const query = z
      .object({
        status: z.string().optional(),
      })
      .parse(request.query);

    const disputes = await prisma.dispute.findMany({
      where: {
        ...(query.status && { status: query.status as any }),
      },
      include: {
        deal: {
          include: {
            seller: true,
            buyer: true,
            payment: true,
          },
        },
        opener: true,
        evidence: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return disputes;
  });

  // Force release deal
  fastify.post('/admin/deals/:id/release', async (request, reply) => {
    const admin = await requireRole(request, reply, ['admin']);

    const params = z.object({ id: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id: params.id },
    });

    if (!deal) {
      reply.code(404).send({ error: 'Deal not found' });
      return;
    }

    await transitionDealStatus(deal.id, { type: 'DISPUTE_RESOLVED_RELEASE' }, admin.id);

    const updated = await prisma.deal.findUnique({
      where: { id: params.id },
    });

    return updated;
  });
}
