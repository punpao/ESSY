import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireRole } from "../lib/auth";

export async function adminRoutes(fastify: FastifyInstance) {
  // List deals with filters
  fastify.get(
    "/deals",
    { preHandler: requireRole("admin") },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = z
        .object({
          status: z.enum(["PENDING", "HOLD", "SHIPPED", "RELEASED", "DISPUTE", "REFUND"]).optional(),
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
            disputes: true,
          },
          orderBy: { createdAt: "desc" },
          take: query.limit,
          skip: query.offset,
        }),
        prisma.deal.count({ where }),
      ]);

      return { deals, total, limit: query.limit, offset: query.offset };
    }
  );

  // List disputes with filters
  fastify.get(
    "/disputes",
    { preHandler: requireRole("admin") },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = z
        .object({
          status: z
            .enum(["OPEN", "NEED_MORE_INFO", "RESOLVED_REFUND", "RESOLVED_RELEASE"])
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
            deal: { include: { seller: true, buyer: true, payment: true } },
            evidence: true,
          },
          orderBy: { createdAt: "desc" },
          take: query.limit,
          skip: query.offset,
        }),
        prisma.dispute.count({ where }),
      ]);

      return { disputes, total, limit: query.limit, offset: query.offset };
    }
  );

  // Force release deal (admin override)
  fastify.post(
    "/deals/:id/release",
    { preHandler: requireRole("admin") },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const { reason } = z.object({ reason: z.string().optional() }).parse(request.body);

      const deal = await prisma.deal.findUnique({
        where: { id },
      });

      if (!deal) {
        return reply.status(404).send({ error: "Deal not found" });
      }

      const updated = await prisma.deal.update({
        where: { id },
        data: { status: "RELEASED" },
      });

      await prisma.dealEvent.create({
        data: {
          dealId: deal.id,
          eventType: "ADMIN_FORCE_RELEASE",
          metadata: { reason },
        },
      });

      return updated;
    }
  );
}
