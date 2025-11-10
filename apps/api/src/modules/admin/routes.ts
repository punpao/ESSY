import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { DealStatus } from "@escrow/core";
import { logDealEvent, nextEscrowState } from "../shared/utils";

const adminQuerySchema = z.object({
  status: z
    .enum(["PENDING", "HOLD", "SHIPPED", "RELEASED", "DISPUTE", "REFUND"])
    .optional()
});

const releaseBodySchema = z.object({
  note: z.string().min(3).optional()
});

export async function registerAdminRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/admin/deals",
    {
      preHandler: fastify.authorize(["admin"]),
      schema: { querystring: adminQuerySchema }
    },
    async (request) => {
      const { status } = request.query as z.infer<typeof adminQuerySchema>;

      const deals = await prisma.deal.findMany({
        where: {
          status: status ?? undefined
        },
        orderBy: { createdAt: "desc" },
        include: {
          seller: true,
          buyer: true,
          disputes: true
        }
      });

      return { deals };
    }
  );

  fastify.get(
    "/admin/disputes",
    {
      preHandler: fastify.authorize(["admin"]),
      schema: { querystring: z.object({ status: z.string().optional() }) }
    },
    async (request) => {
      const { status } = request.query as { status?: string };

      const disputes = await prisma.dispute.findMany({
        where: {
          status: status as any
        },
        orderBy: { createdAt: "desc" },
        include: {
          deal: {
            include: {
              seller: true,
              buyer: true
            }
          }
        }
      });

      return { disputes };
    }
  );

  fastify.post(
    "/admin/deals/:id/release",
    {
      preHandler: fastify.authorize(["admin"]),
      schema: { body: releaseBodySchema }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as z.infer<typeof releaseBodySchema>;

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: { payments: true }
      });

      if (!deal) {
        return reply.notFound("ไม่พบดีล");
      }

      const paid = deal.payments.some((p) => p.status === "PAID");
      if (!paid) {
        return reply.badRequest("ไม่มีการชำระเงิน");
      }

      const nextStatus = nextEscrowState(
        deal.status as DealStatus,
        { type: "RESOLVE_RELEASE" },
        {
          hasPayment: true,
          deliveredAt: deal.deliveredAt,
          autoReleaseAt: deal.autoReleaseAt,
          now: new Date(),
          hasOpenDispute: false,
          adminOverride: true
        }
      );

      await prisma.deal.update({
        where: { id },
        data: {
          status: nextStatus,
          resolvedAt: new Date()
        }
      });

      await prisma.reputationEvent.create({
        data: {
          sellerId: deal.sellerId,
          type: "positive",
          weight: 0.5,
          note: body.note ?? "แอดมินปล่อยเงิน"
        }
      });

      await logDealEvent(deal.id, nextStatus, request.user.userId, body.note ?? "Force release");

      return reply.send({ ok: true });
    }
  );
}
