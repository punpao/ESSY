import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { transition } from "@escrow/core";
import { logDealEvent } from "../utils/dealEvents";
import { recordReputationEvent } from "../utils/reputation";

const dealsQuerySchema = z.object({
  status: z
    .enum(["PENDING", "HOLD", "SHIPPED", "RELEASED", "DISPUTE", "REFUND"])
    .optional()
});

const disputesQuerySchema = z.object({
  status: z.enum(["OPEN", "NEED_MORE_INFO", "RESOLVED_REFUND", "RESOLVED_RELEASE"]).optional()
});

export default async function adminRoutes(app: FastifyInstance) {
  app.get(
    "/admin/deals",
    {
      preHandler: [app.authenticate, app.authorize(["admin"])]
    },
    async (request, reply) => {
      const query = dealsQuerySchema.parse(request.query ?? {});

      const deals = await app.prisma.deal.findMany({
        where: {
          status: query.status
        },
        include: {
          seller: { select: { displayName: true, email: true } },
          buyer: { select: { displayName: true, email: true } },
          dispute: true,
          payment: true
        },
        orderBy: { createdAt: "desc" },
        take: 100
      });

      reply.send({ deals });
    }
  );

  app.get(
    "/admin/disputes",
    {
      preHandler: [app.authenticate, app.authorize(["admin"])]
    },
    async (request, reply) => {
      const query = disputesQuerySchema.parse(request.query ?? {});

      const disputes = await app.prisma.dispute.findMany({
        where: {
          status: query.status
        },
        include: {
          deal: {
            include: {
              seller: { select: { displayName: true } }
            }
          },
          openedBy: { select: { displayName: true, email: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 100
      });

      reply.send({ disputes });
    }
  );

  app.post(
    "/admin/deals/:id/release",
    {
      preHandler: [app.authenticate, app.authorize(["admin"])]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const deal = await app.prisma.deal.findUnique({
        where: { id },
        include: { payment: true }
      });

      if (!deal) {
        return reply.code(404).send({ message: "ไม่พบดีล" });
      }

      if (deal.status === "RELEASED") {
        return reply.send({ message: "ดีลนี้ถูกปล่อยเงินแล้ว" });
      }

      let nextStatus = deal.status;
      if (deal.status === "HOLD") {
        nextStatus = transition(deal.status, { type: "ADMIN_RELEASE" });
      } else if (deal.status === "SHIPPED" || deal.status === "DISPUTE") {
        nextStatus = "RELEASED";
      } else {
        return reply.code(400).send({ message: "สถานะนี้ไม่สามารถปล่อยเงินได้" });
      }

      await app.prisma.deal.update({
        where: { id: deal.id },
        data: {
          status: nextStatus,
          autoReleaseAt: null,
          deliveredAt: deal.deliveredAt ?? new Date()
        }
      });

      await logDealEvent(app.prisma, {
        dealId: deal.id,
        actorId: request.user?.sub,
        type: "deal.released.admin"
      });

      await recordReputationEvent({
        prisma: app.prisma,
        sellerUserId: deal.sellerId,
        type: "positive",
        weight: 0.8,
        note: "Admin forced release"
      });

      await app.jobs.enqueueReputation(deal.sellerId);

      reply.send({ message: "ปล่อยเงินให้ผู้ขายเรียบร้อย" });
    }
  );
}
