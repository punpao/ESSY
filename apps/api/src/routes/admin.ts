import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAdmin } from '../auth';
import { EscrowStateMachine } from '@thai-escrow/core';

const forceReleaseSchema = z.object({
  note: z.string().optional(),
});

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /admin/deals - List all deals with filters
  fastify.get('/deals', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      requireAdmin(request);

      const { status, limit = 50, offset = 0 } = request.query as any;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const deals = await prisma.deal.findMany({
        where,
        include: {
          seller: {
            include: {
              seller_profile: true,
            },
          },
          buyer: true,
          payments: true,
          disputes: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: parseInt(limit),
        skip: parseInt(offset),
      });

      const total = await prisma.deal.count({ where });

      return {
        deals,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      };
    },
  });

  // GET /admin/disputes - List all disputes with filters
  fastify.get('/disputes', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      requireAdmin(request);

      const { status, limit = 50, offset = 0 } = request.query as any;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const disputes = await prisma.dispute.findMany({
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
        orderBy: {
          created_at: 'desc',
        },
        take: parseInt(limit),
        skip: parseInt(offset),
      });

      const total = await prisma.dispute.count({ where });

      // Calculate SLA status
      const now = new Date();
      const disputesWithSLA = disputes.map((dispute) => {
        const hoursOpen = (now.getTime() - dispute.created_at.getTime()) / (1000 * 60 * 60);
        let slaStatus = 'on_time';
        if (hoursOpen > 72) slaStatus = 'overdue';
        else if (hoursOpen > 48) slaStatus = 'due_soon';
        else if (hoursOpen > 24) slaStatus = 'due_24h';

        return {
          ...dispute,
          hoursOpen: Math.round(hoursOpen),
          slaStatus,
        };
      });

      return {
        disputes: disputesWithSLA,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      };
    },
  });

  // POST /admin/deals/:id/release - Force release (admin override)
  fastify.post('/deals/:id/release', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = requireAdmin(request);
      const { id } = request.params as { id: string };
      const { note } = forceReleaseSchema.parse(request.body);

      const deal = await prisma.deal.findUnique({ where: { id } });
      if (!deal) {
        return reply.code(404).send({ error: 'Deal not found' });
      }

      if (deal.status === 'RELEASED') {
        return reply.code(400).send({ error: 'Deal already released' });
      }

      // Force transition
      const updatedDeal = await prisma.deal.update({
        where: { id },
        data: { status: 'RELEASED' },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: id,
          event_type: 'admin_force_release',
          from_status: deal.status,
          to_status: 'RELEASED',
          actor_id: user.id,
          metadata: JSON.stringify({ note }),
        },
      });

      return updatedDeal;
    },
  });

  // GET /admin/stats - Get platform statistics
  fastify.get('/stats', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      requireAdmin(request);

      const totalDeals = await prisma.deal.count();
      const totalUsers = await prisma.user.count();
      const totalSellers = await prisma.sellerProfile.count();
      const verifiedSellers = await prisma.sellerProfile.count({ where: { verified: true } });
      const openDisputes = await prisma.dispute.count({ where: { status: 'OPEN' } });

      const dealsByStatus = await prisma.deal.groupBy({
        by: ['status'],
        _count: true,
      });

      const totalVolume = await prisma.deal.aggregate({
        where: { status: { in: ['RELEASED', 'HOLD', 'SHIPPED'] } },
        _sum: { amount_satang: true },
      });

      return {
        totalDeals,
        totalUsers,
        totalSellers,
        verifiedSellers,
        openDisputes,
        dealsByStatus,
        totalVolumeSatang: totalVolume._sum.amount_satang || 0,
      };
    },
  });
};
