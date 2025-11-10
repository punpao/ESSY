import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../config/database";
import { authenticate, requireRole } from "../middleware/auth";
import { EscrowStateMachine } from "@essy/core";
import { logDealEvent } from "../utils/dealEvents";

export async function adminRoutes(fastify: FastifyInstance) {
  // List deals
  fastify.get(
    "/admin/deals",
    { preHandler: [authenticate, requireRole("admin")] },
    async (request, reply) => {
      const { status } = request.query as { status?: string };

      const deals = await prisma.deal.findMany({
        where: status ? { status: status as any } : undefined,
        include: {
          seller: { select: { id: true, displayName: true } },
          buyer: { select: { id: true, displayName: true } },
          payments: true,
          disputes: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return { deals };
    }
  );

  // List disputes
  fastify.get(
    "/admin/disputes",
    { preHandler: [authenticate, requireRole("admin")] },
    async (request, reply) => {
      const { status } = request.query as { status?: string };

      const disputes = await prisma.dispute.findMany({
        where: status ? { status: status as any } : undefined,
        include: {
          deal: {
            include: {
              seller: { select: { id: true, displayName: true } },
              buyer: { select: { id: true, displayName: true } },
            },
          },
          opener: { select: { id: true, displayName: true } },
          evidence: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return { disputes };
    }
  );

  // Force release deal
  fastify.post(
    "/admin/deals/:id/release",
    { preHandler: [authenticate, requireRole("admin")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const deal = await prisma.deal.findUnique({
        where: { id },
      });

      if (!deal) {
        reply.code(404).send({ error: "Deal not found" });
        return;
      }

      if (!EscrowStateMachine.canTransition(deal.status, "RELEASED")) {
        reply.code(400).send({ error: `Cannot release deal in status ${deal.status}` });
        return;
      }

      const updated = await prisma.deal.update({
        where: { id },
        data: { status: "RELEASED" },
      });

      await logDealEvent(id, "ADMIN_FORCE_RELEASE", deal.status, "RELEASED");

      return updated;
    }
  );
}
