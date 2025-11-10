import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { authenticate, requireRole } from "../auth";

export async function adminRoutes(fastify: FastifyInstance) {
  // List deals with filters
  fastify.get(
    "/admin/deals",
    { preHandler: [authenticate, requireRole(["admin"])] },
    async (request, reply) => {
      const { status } = z
        .object({ status: z.string().optional() })
        .parse(request.query);

      const where = status ? { status } : {};

      const deals = await prisma.deal.findMany({
        where,
        include: {
          seller: true,
          buyer: true,
          payments: true,
          disputes: true,
        },
        orderBy: { created_at: "desc" },
        take: 100,
      });

      return { deals };
    }
  );

  // List disputes
  fastify.get(
    "/admin/disputes",
    { preHandler: [authenticate, requireRole(["admin"])] },
    async (request, reply) => {
      const { status } = z
        .object({ status: z.string().optional() })
        .parse(request.query);

      const where = status ? { status } : {};

      const disputes = await prisma.dispute.findMany({
        where,
        include: {
          deal: {
            include: {
              seller: true,
              buyer: true,
              payments: true,
            },
          },
          opener: true,
          evidence: true,
        },
        orderBy: { created_at: "desc" },
        take: 100,
      });

      return { disputes };
    }
  );

  // Force release (admin override)
  fastify.post(
    "/admin/deals/:id/release",
    { preHandler: [authenticate, requireRole(["admin"])] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);

      const deal = await prisma.deal.update({
        where: { id },
        data: {
          status: "RELEASED",
          updated_at: new Date(),
        },
      });

      return { success: true, deal };
    }
  );
}
