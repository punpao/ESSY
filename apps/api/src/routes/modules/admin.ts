import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { transitionDeal } from '../../services/dealService';

export async function adminRoutes(app: FastifyInstance) {
  app.get(
    '/deals',
    { preHandler: app.authorize(['admin']) },
    async (request) => {
      const query = z
        .object({
          status: z.string().optional()
        })
        .parse(request.query);
      const deals = await prisma.deal.findMany({
        where: {
          status: query.status ? (query.status as any) : undefined
        },
        include: {
          seller: true,
          buyer: true,
          dispute: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return { deals };
    }
  );

  app.get(
    '/disputes',
    { preHandler: app.authorize(['admin']) },
    async (request) => {
      const query = z
        .object({
          status: z.string().optional()
        })
        .parse(request.query);
      const disputes = await prisma.dispute.findMany({
        where: {
          status: query.status ? (query.status as any) : undefined
        },
        include: {
          deal: true,
          openedBy: true,
          evidence: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return { disputes };
    }
  );

  app.post(
    '/deals/:id/release',
    { preHandler: app.authorize(['admin']) },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const deal = await prisma.deal.findUnique({ where: { id } });
      if (!deal) return reply.notFound();
      if (!['HOLD', 'SHIPPED', 'DISPUTE'].includes(deal.status)) {
        return reply.status(400).send({ error: 'ไม่สามารถบังคับโอนได้' });
      }
      const updated = await transitionDeal({
        dealId: id,
        event: { type: 'ADMIN_FORCE_RELEASE' },
        context: { actorId: request.user.id, actorRole: 'admin', note: 'Admin forced release' }
      });
      return { deal: updated };
    }
  );
}
