import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { logDealEvent, nextEscrowState } from "../shared/utils";
import { DealStatus } from "@escrow/core";
import { recalculateReputation } from "../shared/reputation";

const openDisputeSchema = z.object({
  reason_text: z.string().min(5),
  reason_code: z.enum(["ไม่ถึง", "ไม่ตรงปก", "อื่นๆ"]).default("อื่นๆ")
});

const evidenceSchema = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(["image", "chatlog", "other"]),
        url: z.string().url(),
        note: z.string().optional()
      })
    )
    .min(1)
});

const resolveSchema = z.object({
  action: z.enum(["REFUND", "RELEASE"]),
  note: z.string().min(3)
});

export async function registerDisputeRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/disputes/:dealId/open",
    {
      preHandler: fastify.authorize(["buyer"])
    },
    async (request, reply) => {
      const { dealId } = request.params as { dealId: string };
      const body = openDisputeSchema.parse(request.body);
      const buyerId = request.user.userId;

      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: { payments: true }
      });

      if (!deal) {
        return reply.notFound("ไม่พบดีล");
      }

      if (deal.buyerId !== buyerId) {
        return reply.forbidden("เปิดข้อพิพาทได้เฉพาะผู้ซื้อ");
      }

      const paid = deal.payments.some((p) => p.status === "PAID");
      if (!paid) {
        return reply.badRequest("ยังไม่มีการชำระเงิน");
      }

      const nextStatus = nextEscrowState(
        deal.status as DealStatus,
        { type: "OPEN_DISPUTE" },
        {
          hasPayment: true,
          deliveredAt: deal.deliveredAt,
          autoReleaseAt: deal.autoReleaseAt,
          now: new Date(),
          hasOpenDispute: false
        }
      );

      const dispute = await prisma.$transaction(async (tx) => {
        const created = await tx.dispute.create({
          data: {
            dealId,
            openedById: buyerId,
            reasonText: body.reason_text,
            status: "OPEN",
            reasonCode: body.reason_code
          }
        });

        await tx.deal.update({
          where: { id: dealId },
          data: {
            status: nextStatus
          }
        });

        return created;
      });

      await logDealEvent(dealId, "DISPUTE", buyerId, `เปิดข้อพิพาท: ${body.reason_text}`);

      return reply.send({ dispute });
    }
  );

  fastify.post(
    "/disputes/:id/evidence",
    {
      preHandler: fastify.authorize(["buyer", "seller", "admin"]),
      schema: { body: evidenceSchema }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as z.infer<typeof evidenceSchema>;
      const actorId = request.user.userId;

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: { deal: true }
      });

      if (!dispute) {
        return reply.notFound("ไม่พบข้อพิพาท");
      }

      if (
        request.user.role !== "admin" &&
        dispute.openedById !== actorId &&
        dispute.deal.sellerId !== actorId
      ) {
        return reply.forbidden("ไม่มีสิทธิ์ส่งหลักฐาน");
      }

      await prisma.evidence.createMany({
        data: body.items.map((item) => ({
          disputeId: dispute.id,
          uploadedById: actorId,
          kind: item.kind,
          url: item.url,
          note: item.note ?? null
        }))
      });

      return reply.send({ ok: true });
    }
  );

  fastify.post(
    "/disputes/:id/resolve",
    {
      preHandler: fastify.authorize(["admin"]),
      schema: { body: resolveSchema }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as z.infer<typeof resolveSchema>;

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: {
          deal: {
            include: { payments: true }
          }
        }
      });

      if (!dispute) {
        return reply.notFound("ไม่พบข้อพิพาท");
      }

      const deal = dispute.deal;
      const paid = deal.payments.some((p) => p.status === "PAID");
      if (!paid) {
        return reply.badRequest("ดีลนี้ยังไม่มีการชำระเงิน");
      }

      const eventType = body.action === "REFUND" ? "RESOLVE_REFUND" : "RESOLVE_RELEASE";
      const nextStatus = nextEscrowState(
        deal.status as DealStatus,
        { type: eventType },
        {
          hasPayment: true,
          deliveredAt: deal.deliveredAt,
          autoReleaseAt: deal.autoReleaseAt,
          now: new Date(),
          hasOpenDispute: true,
          adminOverride: true
        }
      );

      await prisma.$transaction(async (tx) => {
        await tx.dispute.update({
          where: { id: dispute.id },
          data: {
            status: body.action === "REFUND" ? "RESOLVED_REFUND" : "RESOLVED_RELEASE",
            resolutionNote: body.note,
            resolvedAt: new Date()
          }
        });

        await tx.deal.update({
          where: { id: deal.id },
          data: {
            status: nextStatus,
            resolvedAt: new Date()
          }
        });

        if (body.action === "REFUND") {
          await tx.payment.updateMany({
            where: { dealId: deal.id, status: "PAID" },
            data: { status: "REFUNDED" }
          });
          await tx.reputationEvent.create({
            data: {
              sellerId: deal.sellerId,
              type: "negative",
              weight: 1.2,
              note: `คืนเงินจากข้อพิพาท: ${body.note}`
            }
          });
        } else {
          await tx.reputationEvent.create({
            data: {
              sellerId: deal.sellerId,
              type: "positive",
              weight: 0.8,
              note: `ข้อพิพาทตัดสินให้ปล่อยเงิน: ${body.note}`
            }
          });
        }
      });

      await logDealEvent(deal.id, nextStatus, request.user.userId, `ปิดข้อพิพาท: ${body.note}`);
      await recalculateReputation(deal.sellerId);

      return reply.send({ ok: true, status: nextStatus });
    }
  );
}
