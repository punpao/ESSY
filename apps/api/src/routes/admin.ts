import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppConfig } from '../config.js';
import { applyDealTransition } from '../services/dealState.js';

export const adminRoutes = async (fastify: FastifyInstance, _config: AppConfig) => {
  fastify.get(
    '/api/v1/admin/deals',
    { preHandler: [fastify.authenticate, fastify.authorize(['admin'])] },
    async (request, reply) => {
      const status = z
        .string()
        .optional()
        .parse((request.query as any).status);
      const deals = await fastify.prisma.deal.findMany({
        where: status ? { status: status as any } : {},
        include: { seller: true, buyer: true, dispute: true, payment: true },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      return reply.send({ deals });
    }
  );

  fastify.get(
    '/api/v1/admin/disputes',
    { preHandler: [fastify.authenticate, fastify.authorize(['admin'])] },
    async (request, reply) => {
      const status = z
        .string()
        .optional()
        .parse((request.query as any).status);
        const disputes = await fastify.prisma.dispute.findMany({
          where: status ? { status: status as any } : {},
          include: {
            deal: {
              include: {
                seller: {
                  select: {
                    displayName: true
                  }
                },
                buyer: {
                  select: {
                    displayName: true
                  }
                }
              }
            },
            evidence: true
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        });
      return reply.send({ disputes });
    }
  );

  fastify.post(
    '/api/v1/admin/deals/:id/release',
    { preHandler: [fastify.authenticate, fastify.authorize(['admin'])] },
    async (request, reply) => {
      const id = z.string().parse((request.params as any).id);
      const deal = await fastify.prisma.deal.findUnique({
        where: { id },
        include: { dispute: true }
      });
      if (!deal) {
        return reply.code(404).send({ message: 'ไม่พบดีล' });
      }
      if (!['HOLD', 'SHIPPED', 'DISPUTE'].includes(deal.status)) {
        return reply.code(400).send({ message: 'สถานะปัจจุบันไม่สามารถบังคับโอนได้' });
      }

      const updated = await applyDealTransition(
        fastify.prisma,
        { ...deal, dispute: deal.dispute },
        { type: 'ADMIN_RELEASE' },
        request.user.id,
        { autoReleaseAt: null }
      );

      await fastify.queues.reputation.add('recalculate', { sellerId: deal.sellerId });

      await fastify.prisma.dealEvent.create({
        data: {
          dealId: id,
          actorId: request.user.id,
          event: 'ADMIN_RELEASE',
          note: 'แอดมินบังคับโอนเงินให้ผู้ขาย'
        }
      });

      return reply.send({
        message: 'ปล่อยเงินให้ผู้ขายเรียบร้อย',
        deal: updated
      });
    }
  );
};
