import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { transition } from "@escrow/core";
import { logDealEvent } from "../utils/dealEvents";
import { recordReputationEvent } from "../utils/reputation";

const disputeOpenSchema = z.object({
  reason: z.string().min(5, "อธิบายปัญหาสั้น ๆ"),
  category: z.enum(["ของยังไม่ถึง", "ของไม่ตรงปก", "อื่น ๆ"])
});

const evidenceSchema = z.object({
  evidence: z
    .array(
      z.object({
        url: z.string().url(),
        kind: z.enum(["image", "chatlog", "other"]),
        note: z.string().optional()
      })
    )
    .min(1)
});

const resolveSchema = z.object({
  resolution: z.enum(["REFUND", "RELEASE"]),
  note: z.string().optional()
});

export default async function disputeRoutes(app: FastifyInstance) {
  app.post(
    "/disputes/:dealId/open",
    {
      preHandler: [app.authenticate, app.authorize(["buyer", "admin"])],
      schema: {
        body: disputeOpenSchema
      }
    },
    async (request, reply) => {
      const { dealId } = request.params as { dealId: string };
      const user = request.user;
      if (!user) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const deal = await app.prisma.deal.findUnique({
        where: { id: dealId },
        include: { dispute: true }
      });

      if (!deal) {
        return reply.code(404).send({ message: "ไม่พบดีล" });
      }

      if (user.role !== "admin" && deal.buyerId !== user.sub) {
        return reply.code(403).send({ message: "อนุญาตเฉพาะผู้ซื้อเท่านั้น" });
      }

      if (deal.dispute) {
        return reply.send({ message: "ดีลนี้มีข้อพิพาทอยู่แล้ว", dispute: deal.dispute });
      }

      if (!["HOLD", "SHIPPED"].includes(deal.status)) {
        return reply.code(400).send({ message: "สถานะดีลไม่สามารถเปิดข้อพิพาทได้" });
      }

      const payload = disputeOpenSchema.parse(request.body);

      const nextStatus = transition(deal.status, { type: "BUYER_DISPUTE" });

      const dispute = await app.prisma.dispute.create({
        data: {
          dealId: deal.id,
          openedById: user.sub,
          reasonText: `${payload.category}: ${payload.reason}`
        }
      });

      await app.prisma.deal.update({
        where: { id: deal.id },
        data: {
          status: nextStatus
        }
      });

      await logDealEvent(app.prisma, {
        dealId: deal.id,
        actorId: user.sub,
        type: "dispute.opened",
        payload
      });

      reply.send({
        message: "เปิดข้อพิพาทเรียบร้อย ทีมงานจะติดต่อกลับภายใน 24 ชม.",
        dispute
      });
    }
  );

  app.get(
    "/disputes/:id",
    {
      preHandler: [app.authenticate]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user;

      const dispute = await app.prisma.dispute.findUnique({
        where: { id },
        include: {
          deal: { include: { seller: { select: { id: true, displayName: true } } } },
          openedBy: { select: { id: true, displayName: true } },
          evidence: {
            orderBy: { createdAt: "asc" }
          }
        }
      });

      if (!dispute) {
        return reply.code(404).send({ message: "ไม่พบข้อพิพาท" });
      }

      const allowed =
        user?.role === "admin" ||
        dispute.openedById === user?.sub ||
        dispute.deal.sellerId === user?.sub;

      if (!allowed) {
        return reply.code(403).send({ message: "ไม่มีสิทธิ์ดูข้อพิพาทนี้" });
      }

      reply.send({ dispute });
    }
  );

  app.post(
    "/disputes/:id/evidence",
    {
      preHandler: [app.authenticate],
      schema: {
        body: evidenceSchema
      }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user;
      if (!user) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const dispute = await app.prisma.dispute.findUnique({
        where: { id },
        include: {
          deal: true
        }
      });

      if (!dispute) {
        return reply.code(404).send({ message: "ไม่พบข้อพิพาท" });
      }

      const isParticipant =
        user.role === "admin" ||
        dispute.openedById === user.sub ||
        dispute.deal.sellerId === user.sub;

      if (!isParticipant) {
        return reply.code(403).send({ message: "ไม่มีสิทธิ์เพิ่มหลักฐาน" });
      }

      const payload = evidenceSchema.parse(request.body);

      await app.prisma.evidence.createMany({
        data: payload.evidence.map((item) => ({
          disputeId: dispute.id,
          uploadedById: user.sub,
          kind: item.kind,
          url: item.url,
          note: item.note
        }))
      });

      await logDealEvent(app.prisma, {
        dealId: dispute.dealId,
        actorId: user.sub,
        type: "dispute.evidence",
        payload
      });

      reply.send({ message: "อัปโหลดหลักฐานเรียบร้อย" });
    }
  );

  app.post(
    "/disputes/:id/resolve",
    {
      preHandler: [app.authenticate, app.authorize(["admin"])],
      schema: {
        body: resolveSchema
      }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payload = resolveSchema.parse(request.body);

      const dispute = await app.prisma.dispute.findUnique({
        where: { id },
        include: { deal: { include: { payment: true } } }
      });

      if (!dispute) {
        return reply.code(404).send({ message: "ไม่พบข้อพิพาท" });
      }

      let dealStatus = dispute.deal.status;

      if (payload.resolution === "REFUND") {
        dealStatus = transition(dealStatus, { type: "DISPUTE_RESOLVE_REFUND" });
        await app.prisma.$transaction([
          app.prisma.dispute.update({
            where: { id },
            data: {
              status: "RESOLVED_REFUND",
              resolvedAt: new Date(),
              resolutionNote: payload.note
            }
          }),
          app.prisma.deal.update({
            where: { id: dispute.dealId },
            data: {
              status: dealStatus
            }
          }),
          app.prisma.payment.updateMany({
            where: { dealId: dispute.dealId },
            data: {
              status: "REFUNDED"
            }
          })
        ]);
      } else {
        dealStatus = transition(dealStatus, { type: "DISPUTE_RESOLVE_RELEASE" });
        await app.prisma.$transaction([
          app.prisma.dispute.update({
            where: { id },
            data: {
              status: "RESOLVED_RELEASE",
              resolvedAt: new Date(),
              resolutionNote: payload.note
            }
          }),
          app.prisma.deal.update({
            where: { id: dispute.dealId },
            data: {
              status: dealStatus
            }
          })
        ]);
      }

      await logDealEvent(app.prisma, {
        dealId: dispute.dealId,
        actorId: request.user?.sub,
        type: "dispute.resolved",
        payload
      });

      await recordReputationEvent({
        prisma: app.prisma,
        sellerUserId: dispute.deal.sellerId,
        type: payload.resolution === "REFUND" ? "negative" : "positive",
        weight: payload.resolution === "REFUND" ? -1 : 0.6,
        note:
          payload.resolution === "REFUND"
            ? "Dispute resolved with refund"
            : "Dispute resolved and funds released"
      });

      await app.jobs.enqueueReputation(dispute.deal.sellerId);

      reply.send({
        message: "สรุปข้อพิพาทเรียบร้อย",
        status: dealStatus
      });
    }
  );
}
