import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppConfig } from '../config.js';

export const buyerRoutes = async (fastify: FastifyInstance, _config: AppConfig) => {
  fastify.get(
    '/api/v1/buyer/deals',
    { preHandler: [fastify.authenticate, fastify.authorize(['buyer'])] },
    async (request, reply) => {
      const deals = await fastify.prisma.deal.findMany({
        where: { buyerId: request.user.id },
        include: {
          payment: true,
          dispute: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 30
      });

      return reply.send({ deals });
    }
  );

  fastify.get(
    '/api/v1/buyer/disputes/:id',
    { preHandler: [fastify.authenticate, fastify.authorize(['buyer'])] },
    async (request, reply) => {
      const id = z.string().parse((request.params as any).id);
      const dispute = await fastify.prisma.dispute.findUnique({
        where: { id },
        include: {
          deal: true,
          evidence: true
        }
      });

      if (!dispute || dispute.openedById !== request.user.id) {
        return reply.code(404).send({ message: 'ไม่พบข้อพิพาท' });
      }

      return reply.send({ dispute });
    }
  );
};
