import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import {
  computeAutoRelease,
  generatePaylinkToken,
  logDealEvent,
  nextEscrowState,
  thbToSatang
} from "../shared/utils";
import { DealStatus } from "@escrow/core";
import { recalculateReputation } from "../shared/reputation";
import { ulid } from "ulid";
import { cancelSchema, confirmSchema, createDealSchema, shipDealSchema } from "./schemas";

export async function registerDealRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/deals",
    {
      preHandler: fastify.authorize(["seller"]),
      schema: { body: createDealSchema }
    },
    async (request, reply) => {
      const sellerId = request.user.userId;
      const body = request.body as z.infer<typeof createDealSchema>;

      const paylinkToken = generatePaylinkToken();
      const expiresAt = new Date(Date.now() + body.expires_in_hours * 3600 * 1000);

      const deal = await prisma.deal.create({
        data: {
          id: ulid(),
          title: body.title,
          amountSatang: thbToSatang(body.amount_thb),
          currency: "THB",
          sellerId,
          buyerId: null,
          status: "PENDING",
          paylinkToken,
          expiresAt,
          buyerNote: body.buyer_note ?? null
        }
      });

      await logDealEvent(deal.id, deal.status as DealStatus, sellerId, "สร้างเพย์ลิงก์ใหม่");

      return reply.send({
        deal,
        paylink_url: `${env.appBaseUrl}/pay/${paylinkToken}`
      });
    }
  );

  fastify.get(
    "/deals/:id",
    { preHandler: fastify.authorize(["buyer", "seller", "admin"]) },
    async (request, reply) => {
      const id = (request.params as { id: string }).id;
      const user = request.user;

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: {
          seller: {
            include: {
              sellerProfile: true
            }
          },
          buyer: true,
          payments: true,
          disputes: true
        }
      });

      if (!deal) {
        return reply.notFound("ไม่พบดีล");
      }

      if (
        user.role !== "admin" &&
        deal.sellerId !== user.userId &&
        deal.buyerId !== user.userId
      ) {
        return reply.forbidden("ไม่มีสิทธิ์เข้าถึงดีลนี้");
      }

      return { deal };
    }
  );

  fastify.get("/deals/paylink/:token", async (request, reply) => {
    const token = (request.params as { token: string }).token;
    const deal = await prisma.deal.findFirst({
      where: { paylinkToken: token },
      include: {
        seller: {
          include: {
            sellerProfile: true
          }
        }
      }
    });

    if (!deal) {
      return reply.notFound("เพย์ลิงก์ไม่ถูกต้อง");
    }

    return { deal };
  });

  fastify.post(
    "/deals/:id/ship",
    {
      preHandler: fastify.authorize(["seller"]),
      schema: { body: shipDealSchema }
    },
    async (request, reply) => {
      const sellerId = request.user.userId;
      const id = (request.params as { id: string }).id;
      const body = request.body as z.infer<typeof shipDealSchema>;

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: { payments: true, disputes: { where: { status: "OPEN" } } }
      });

      if (!deal) {
        return reply.notFound("ไม่พบดีล");
      }

      if (deal.sellerId !== sellerId) {
        return reply.forbidden("ไม่สามารถอัปเดตดีลของผู้อื่น");
      }

      const paidPayment = deal.payments.find((p) => p.status === "PAID");
      if (!paidPayment) {
        return reply.badRequest("ยังไม่พบการชำระเงิน");
      }

      const deliveredAt = body.delivered_at ?? null;
      const autoReleaseAt = computeAutoRelease(deliveredAt);

      const nextStatus = nextEscrowState(
        deal.status as DealStatus,
        { type: "SHIP", deliveredAt },
        {
          hasPayment: Boolean(paidPayment),
          deliveredAt,
          autoReleaseAt,
          now: new Date(),
          hasOpenDispute: deal.disputes.length > 0
        }
      );

      const updated = await prisma.deal.update({
        where: { id },
        data: {
          status: nextStatus,
          trackingNumber: body.tracking_number,
          courier: body.courier,
          deliveredAt,
          autoReleaseAt
        }
      });

      await logDealEvent(id, nextStatus, sellerId, "อัปเดตข้อมูลการจัดส่ง");

      if (autoReleaseAt) {
        await fastify.autoReleaseQueue.add(
          "enforce",
          { dealId: id },
          { delay: Math.max(0, autoReleaseAt.getTime() - Date.now()) }
        );
      }

      return reply.send({ deal: updated });
    }
  );

  fastify.post(
    "/deals/:id/confirm",
    {
      preHandler: fastify.authorize(["buyer", "admin"]),
      schema: { body: confirmSchema }
    },
    async (request, reply) => {
      const user = request.user;
      const id = (request.params as { id: string }).id;

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: { payments: true }
      });

      if (!deal) {
        return reply.notFound("ไม่พบดีล");
      }

      if (user.role !== "admin" && deal.buyerId !== user.userId) {
        return reply.forbidden("ต้องเป็นผู้ซื้อเท่านั้น");
      }

      const paidPayment = deal.payments.find((p) => p.status === "PAID");
      if (!paidPayment) {
        return reply.badRequest("ยังไม่มีการชำระเงิน");
      }

      const nextStatus = nextEscrowState(
        deal.status as DealStatus,
        { type: "CONFIRM_RECEIPT" },
        {
          hasPayment: true,
          deliveredAt: deal.deliveredAt,
          autoReleaseAt: deal.autoReleaseAt,
          now: new Date(),
          hasOpenDispute: false,
          buyerConfirmed: true
        }
      );

      const updated = await prisma.deal.update({
        where: { id },
        data: {
          status: nextStatus,
          releasedAt: new Date()
        }
      });

      await prisma.reputationEvent.create({
        data: {
          sellerId: deal.sellerId,
          type: "positive",
          weight: 1,
          note: "ลูกค้ายืนยันได้รับสินค้า"
        }
      });

      await logDealEvent(id, nextStatus, user.userId, "ผู้ซื้อยืนยันได้รับของ");
      await recalculateReputation(deal.sellerId);

      return reply.send({ deal: updated });
    }
  );

  fastify.post(
    "/deals/:id/cancel",
    {
      preHandler: fastify.authorize(["seller", "admin"]),
      schema: { body: cancelSchema }
    },
    async (request, reply) => {
      const user = request.user;
      const id = (request.params as { id: string }).id;
      const body = request.body as z.infer<typeof cancelSchema>;

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: { payments: true }
      });

      if (!deal) {
        return reply.notFound("ไม่พบดีล");
      }

      if (user.role !== "admin" && deal.sellerId !== user.userId) {
        return reply.forbidden("ไม่มีสิทธิ์ยกเลิก");
      }

      const hasPaid = deal.payments.some((p) => p.status === "PAID");
      if (hasPaid) {
        return reply.badRequest("ไม่สามารถยกเลิกหลังมีการชำระเงิน");
      }

      if (deal.status !== "PENDING") {
        return reply.badRequest("ยกเลิกได้เฉพาะสถานะรอชำระ");
      }

      const cancelled = await prisma.deal.update({
        where: { id },
        data: {
          status: "REFUND",
          cancelledAt: new Date(),
          cancelReason: body.reason
        }
      });

      await logDealEvent(id, "REFUND", user.userId, `ยกเลิกเพราะ: ${body.reason}`);

      return reply.send({ deal: cancelled });
    }
  );
}
