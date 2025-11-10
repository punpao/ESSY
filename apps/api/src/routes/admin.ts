import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import { requireRole } from '../lib/auth';
import { DealStatus, DisputeStatus } from '@prisma/client';

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all deals with filters
  fastify.get('/deals', { preHandler: requireRole('admin') }, async (request, reply) => {
    const schema = z.object({
      status: z.nativeEnum(DealStatus).optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    });

    const { status, page, limit } = schema.parse(request.query);
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [deals, total] = await Promise.all([
      db.deal.findMany({
        where,
        include: {
          seller: {
            include: {
              sellerProfile: true,
            },
          },
          buyer: true,
          payments: true,
          disputes: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.deal.count({ where }),
    ]);

    return {
      deals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  // Get all disputes with filters
  fastify.get('/disputes', { preHandler: requireRole('admin') }, async (request, reply) => {
    const schema = z.object({
      status: z.nativeEnum(DisputeStatus).optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    });

    const { status, page, limit } = schema.parse(request.query);
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [disputes, total] = await Promise.all([
      db.dispute.findMany({
        where,
        include: {
          deal: {
            include: {
              seller: true,
              buyer: true,
            },
          },
          opener: true,
          evidence: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.dispute.count({ where }),
    ]);

    // Add SLA metadata
    const disputesWithSla = disputes.map((dispute) => {
      const hoursSinceCreated =
        (Date.now() - dispute.createdAt.getTime()) / (1000 * 60 * 60);
      let slaStatus = 'good';
      if (hoursSinceCreated > 72) slaStatus = 'overdue';
      else if (hoursSinceCreated > 48) slaStatus = 'warning';

      return {
        ...dispute,
        sla: {
          hoursSinceCreated: Math.floor(hoursSinceCreated),
          status: slaStatus,
        },
      };
    });

    return {
      disputes: disputesWithSla,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  // Force release a deal (edge case admin tool)
  fastify.post('/deals/:id/release', { preHandler: requireRole('admin') }, async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });
    const bodySchema = z.object({
      reason: z.string(),
    });

    const { id } = paramsSchema.parse(request.params);
    const { reason } = bodySchema.parse(request.body);

    const deal = await db.deal.findUnique({ where: { id } });
    if (!deal) {
      return reply.status(404).send({ error: 'Deal not found' });
    }

    // Force release regardless of state (admin power)
    if (deal.status === 'RELEASED' || deal.status === 'REFUND') {
      return reply.status(400).send({ error: 'Deal already finalized' });
    }

    await db.deal.update({
      where: { id },
      data: { status: 'RELEASED' },
    });

    // Log event
    await db.dealEvent.create({
      data: {
        dealId: id,
        eventType: 'FORCE_RELEASE',
        fromState: deal.status,
        toState: 'RELEASED',
        metadata: { reason, adminAction: true },
      },
    });

    return { message: 'Deal force released', status: 'RELEASED' };
  });

  // Get dashboard stats
  fastify.get('/stats', { preHandler: requireRole('admin') }, async (request, reply) => {
    const [
      totalDeals,
      activeDeals,
      openDisputes,
      totalVolume,
    ] = await Promise.all([
      db.deal.count(),
      db.deal.count({
        where: {
          status: {
            in: ['PENDING', 'HOLD', 'SHIPPED'],
          },
        },
      }),
      db.dispute.count({
        where: {
          status: 'OPEN',
        },
      }),
      db.deal.aggregate({
        where: {
          status: {
            in: ['RELEASED', 'REFUND'],
          },
        },
        _sum: {
          amountSatang: true,
        },
      }),
    ]);

    return {
      totalDeals,
      activeDeals,
      openDisputes,
      totalVolumeTHB: (totalVolume._sum.amountSatang || 0) / 100,
    };
  });
};

export default adminRoutes;
