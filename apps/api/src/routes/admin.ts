import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { requireRole } from '../utils/auth';

export async function adminRoutes(fastify: FastifyInstance) {
  // Get all deals with filters
  fastify.get('/deals', async (request, reply) => {
    const admin = await requireRole(request, reply, ['admin']);

    const query = z
      .object({
        status: z.enum(['PENDING', 'HOLD', 'SHIPPED', 'RELEASED', 'DISPUTE', 'REFUND']).optional(),
        limit: z.coerce.number().int().positive().max(100).default(50),
        offset: z.coerce.number().int().nonnegative().default(0),
      })
      .parse(request.query);

    const where = query.status ? { status: query.status } : {};

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: {
          seller: { include: { sellerProfile: true } },
          buyer: true,
          payment: true,
          dispute: true,
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.deal.count({ where }),
    ]);

    return { deals, total, limit: query.limit, offset: query.offset };
  });

  // Get all disputes
  fastify.get('/disputes', async (request, reply) => {
    const admin = await requireRole(request, reply, ['admin']);

    const query = z
      .object({
        status: z
          .enum(['OPEN', 'NEED_MORE_INFO', 'RESOLVED_REFUND', 'RESOLVED_RELEASE'])
          .optional(),
        limit: z.coerce.number().int().positive().max(100).default(50),
        offset: z.coerce.number().int().nonnegative().default(0),
      })
      .parse(request.query);

    const where = query.status ? { status: query.status } : {};

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          deal: {
            include: {
              seller: { include: { sellerProfile: true } },
              buyer: true,
              payment: true,
            },
          },
          opener: true,
          evidence: true,
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.dispute.count({ where }),
    ]);

    return { disputes, total, limit: query.limit, offset: query.offset };
  });

  // Force release deal (admin override)
  fastify.post('/deals/:id/release', async (request, reply) => {
    const admin = await requireRole(request, reply, ['admin']);

    const { id } = z.object({ id: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      return reply.status(404).send({ error: 'Deal not found' });
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: { status: 'RELEASED' },
    });

    await prisma.dealEvent.create({
      data: {
        dealId: id,
        fromStatus: deal.status,
        toStatus: 'RELEASED',
        reason: 'Admin force release',
        userId: admin.id,
      },
    });

    return updated;
  });
}
