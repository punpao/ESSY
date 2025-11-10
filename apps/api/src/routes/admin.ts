import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { requireRole } from '../auth';
import { z } from 'zod';

export async function adminRoutes(fastify: FastifyInstance) {
  // List deals with filters
  fastify.get('/admin/deals', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await requireRole(request, 'admin');
    const { status } = z.object({ status: z.string().optional() }).parse(request.query);

    const deals = await prisma.deal.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        seller: { include: { sellerProfile: true } },
        buyer: true,
        payment: true,
        dispute: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { deals };
  });

  // List disputes
  fastify.get('/admin/disputes', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await requireRole(request, 'admin');
    const { status } = z.object({ status: z.string().optional() }).parse(request.query);

    const disputes = await prisma.dispute.findMany({
      where: status ? { status: status as any } : undefined,
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
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { disputes };
  });

  // Force release deal
  fastify.post('/admin/deals/:id/release', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await requireRole(request, 'admin');
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        status: 'RELEASED',
      },
    });

    return updated;
  });
}
