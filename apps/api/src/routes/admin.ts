import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { requireRole } from "../lib/jwt";

export async function adminRoutes(fastify: FastifyInstance) {
  // List all deals with filters
  fastify.get(
    "/admin/deals",
    {
      onRequest: [
        fastify.authenticate,
        async (request) => await requireRole(["admin"])(request),
      ],
    },
    async (request, reply) => {
      const { status, limit = "50" } = request.query as { status?: string; limit?: string };

      const where = status ? { status } : {};

      const deals = await prisma.deal.findMany({
        where,
        include: {
          seller: { include: { seller_profile: true } },
          buyer: true,
          payments: true,
          disputes: true,
        },
        orderBy: { created_at: "desc" },
        take: parseInt(limit),
      });

      return reply.send({ deals, total: deals.length });
    }
  );

  // List all disputes with filters
  fastify.get(
    "/admin/disputes",
    {
      onRequest: [
        fastify.authenticate,
        async (request) => await requireRole(["admin"])(request),
      ],
    },
    async (request, reply) => {
      const { status, limit = "50" } = request.query as { status?: string; limit?: string };

      const where = status ? { status } : {};

      const disputes = await prisma.dispute.findMany({
        where,
        include: {
          deal: { include: { seller: true, buyer: true } },
          buyer: true,
          evidence: true,
        },
        orderBy: { created_at: "desc" },
        take: parseInt(limit),
      });

      // Calculate SLA labels
      const now = new Date();
      const disputesWithSLA = disputes.map((d) => {
        const hoursOpen = (now.getTime() - d.created_at.getTime()) / (1000 * 60 * 60);
        let sla: string;
        if (hoursOpen < 24) sla = "due_24h";
        else if (hoursOpen < 48) sla = "due_48h";
        else if (hoursOpen < 72) sla = "due_72h";
        else sla = "overdue";

        return { ...d, sla, hours_open: Math.floor(hoursOpen) };
      });

      return reply.send({ disputes: disputesWithSLA, total: disputes.length });
    }
  );

  // Force release (edge case)
  fastify.post(
    "/admin/deals/:id/release",
    {
      onRequest: [
        fastify.authenticate,
        async (request) => await requireRole(["admin"])(request),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as { userId: string; role: string };

      const deal = await prisma.deal.findUnique({ where: { id } });
      if (!deal) {
        return reply.code(404).send({ error: "Deal not found" });
      }

      await prisma.deal.update({
        where: { id },
        data: { status: "RELEASED" },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: id,
          event_type: "released",
          from_status: deal.status,
          to_status: "RELEASED",
          actor_id: user.userId,
          metadata: JSON.stringify({ forced: true }),
        },
      });

      return reply.send({ success: true, message: "Deal force released" });
    }
  );
}
