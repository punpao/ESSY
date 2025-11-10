import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { transition } from "@escrow/core";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import { logDealEvent } from "../utils/dealEvents";
import { recordReputationEvent } from "../utils/reputation";

export const createDealSchema = z.object({
  title: z.string().min(3, "กรุณาระบุชื่อดีล"),
  amountTHB: z.number().positive("ราคาต้องมากกว่า 0"),
  buyerEmail: z.string().email().optional(),
  note: z.string().max(200).optional()
});

export const shipSchema = z.object({
  trackingNumber: z.string().min(5),
  courier: z.string().min(2),
  deliveredAt: z.string().datetime().optional()
});

export default async function dealRoutes(app: FastifyInstance) {
  app.get(
    "/paylinks/:token",
    async (request, reply) => {
      const { token } = request.params as { token: string };
      const deal = await app.prisma.deal.findUnique({
        where: { paylinkToken: token },
        include: {
          seller: { select: { displayName: true } },
          payment: true
        }
      });

      if (!deal) {
        return reply.code(404).send({ message: "ไม่พบลิงก์การชำระ" });
      }

      reply.send({
        id: deal.id,
        title: deal.title,
        amountSatang: deal.amountSatang,
        status: deal.status,
        sellerName: deal.seller.displayName,
        paymentStatus: deal.payment?.status ?? "INIT"
      });
    }
  );

  app.post(
    "/deals",
    {
      preHandler: [app.authenticate, app.authorize(["seller"])],
      schema: {
        body: createDealSchema
      }
    },
    async (request, reply) => {
      const sellerId = request.user?.sub;
      if (!sellerId) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const payload = createDealSchema.parse(request.body);
      const amountSatang = Math.round(payload.amountTHB * 100);
      const paylinkToken = nanoid(12);
      const expiresAt = dayjs().add(3, "day").toDate();

      const deal = await app.prisma.deal.create({
        data: {
          title: payload.title,
          amountSatang,
          currency: "THB",
          sellerId,
          status: "PENDING",
          paylinkToken,
          expiresAt
        }
      });

      await logDealEvent(app.prisma, {
        dealId: deal.id,
        type: "deal.created",
        actorId: sellerId,
        payload: { note: payload.note }
      });

      const paylinkUrl = `${app.config.APP_BASE_URL}/pay/${deal.paylinkToken}`;

      reply.send({
        deal,
        paylinkUrl,
        message: "ส่งลิงก์ให้ผู้ซื้อในแชทได้เลย"
      });
    }
  );

  app.get(
    "/deals/:id",
    {
      preHandler: [app.authenticate]
    },
    async (request, reply) => {
      const id = (request.params as { id: string }).id;
      const deal = await app.prisma.deal.findUnique({
        where: { id },
        include: {
          seller: true,
          buyer: true,
          payment: true,
          dispute: { include: { evidence: true } },
          events: {
            orderBy: { createdAt: "asc" }
          }
        }
      });

      if (!deal) {
        return reply.code(404).send({ message: "ไม่พบดีล" });
      }

      const user = request.user;
      const allowed =
        user?.role === "admin" || user?.sub === deal.sellerId || user?.sub === deal.buyerId;

      if (!allowed) {
        return reply.code(403).send({ message: "ไม่มีสิทธิ์เข้าดูดีลนี้" });
      }

      reply.send({ deal });
    }
  );

  app.get(
    "/seller/deals",
    {
      preHandler: [app.authenticate, app.authorize(["seller", "admin"])]
    },
    async (request, reply) => {
      const user = request.user!;
      const query = request.query as { sellerId?: string };
      const sellerId = user.role === "admin" ? query.sellerId ?? user.sub : user.sub;

      const deals = await app.prisma.deal.findMany({
        where: {
          sellerId
        },
        include: {
          buyer: { select: { id: true, displayName: true } },
          payment: true,
          dispute: true
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 50
      });

      reply.send({ deals });
    }
  );

  app.get(
    "/buyer/deals",
    {
      preHandler: [app.authenticate, app.authorize(["buyer", "admin"])]
    },
    async (request, reply) => {
      const user = request.user!;
      const buyerId = user.role === "admin" ? (request.query as { buyerId?: string }).buyerId ?? user.sub : user.sub;

      const deals = await app.prisma.deal.findMany({
        where: {
          buyerId
        },
        include: {
          seller: { select: { displayName: true } },
          payment: true,
          dispute: true
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 50
      });

      reply.send({ deals });
    }
  );

  app.post(
    "/deals/:id/ship",
    {
      preHandler: [app.authenticate, app.authorize(["seller", "admin"])],
      schema: {
        body: shipSchema
      }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user;
      if (!user) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const deal = await app.prisma.deal.findUnique({
        where: { id }
      });

      if (!deal) {
        return reply.code(404).send({ message: "ไม่พบดีล" });
      }

      if (user.role !== "admin" && deal.sellerId !== user.sub) {
        return reply.code(403).send({ message: "อนุญาตเฉพาะผู้ขายเท่านั้น" });
      }

      const payload = shipSchema.parse(request.body);

      if (deal.status !== "HOLD" && deal.status !== "SHIPPED") {
        return reply.code(400).send({ message: "ต้องมีการชำระเงินก่อนส่งของ" });
      }

      let nextStatus = deal.status;
      if (deal.status === "HOLD") {
        nextStatus = transition(deal.status, { type: "SELLER_SHIP" });
      }

      const deliveredAt = payload.deliveredAt ? new Date(payload.deliveredAt) : null;
      const autoReleaseAt =
        deliveredAt != null
          ? dayjs(deliveredAt).add(app.config.AUTO_RELEASE_HOURS, "hour").toDate()
          : null;

      const updated = await app.prisma.deal.update({
        where: { id: deal.id },
        data: {
          status: nextStatus,
          trackingNumber: payload.trackingNumber,
          courier: payload.courier,
          deliveredAt,
          autoReleaseAt
        }
      });

      await logDealEvent(app.prisma, {
        dealId: deal.id,
        actorId: user.sub,
        type: "deal.shipped",
        payload: payload
      });

      reply.send({
        message: "อัปเดตการจัดส่งแล้ว",
        deal: updated
      });
    }
  );

  app.post(
    "/deals/:id/confirm",
    {
      preHandler: [app.authenticate, app.authorize(["buyer", "admin"])]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user;

      const deal = await app.prisma.deal.findUnique({
        where: { id },
        include: { payment: true }
      });

      if (!deal) {
        return reply.code(404).send({ message: "ไม่พบดีล" });
      }

      if (user?.role !== "admin" && deal.buyerId !== user?.sub) {
        return reply.code(403).send({ message: "อนุญาตเฉพาะผู้ซื้อเท่านั้น" });
      }

      if (deal.status !== "SHIPPED") {
        return reply.code(400).send({ message: "ยังไม่พร้อมยืนยันรับสินค้า" });
      }

      const nextStatus = transition(deal.status, { type: "BUYER_CONFIRM" });

      const updated = await app.prisma.deal.update({
        where: { id: deal.id },
        data: {
          status: nextStatus,
          deliveredAt: deal.deliveredAt ?? new Date(),
          autoReleaseAt: null
        }
      });

      await logDealEvent(app.prisma, {
        dealId: deal.id,
        actorId: user?.sub,
        type: "deal.released",
        payload: { by: "buyer" }
      });

      await recordReputationEvent({
        prisma: app.prisma,
        sellerUserId: deal.sellerId,
        type: "positive",
        weight: 1,
        note: "Buyer confirmed receipt"
      });

      await app.jobs.enqueueReputation(deal.sellerId);

      reply.send({
        message: "โอนเงินให้ผู้ขายเรียบร้อย",
        deal: updated
      });
    }
  );

  app.post(
    "/deals/:id/cancel",
    {
      preHandler: [app.authenticate, app.authorize(["seller", "admin"])]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user;

      const deal = await app.prisma.deal.findUnique({
        where: { id },
        include: { payment: true }
      });

      if (!deal) {
        return reply.code(404).send({ message: "ไม่พบดีล" });
      }

      if (user?.role !== "admin" && deal.sellerId !== user?.sub) {
        return reply.code(403).send({ message: "อนุญาตเฉพาะผู้ขายเท่านั้น" });
      }

      if (deal.status !== "PENDING") {
        return reply.code(400).send({ message: "ไม่สามารถยกเลิกดีลที่ชำระแล้ว" });
      }

      if (deal.payment && deal.payment.status === "PAID") {
        return reply.code(400).send({ message: "มีการชำระเงินแล้ว" });
      }

      const updated = await app.prisma.deal.update({
        where: { id: deal.id },
        data: {
          status: "REFUND"
        }
      });

      await logDealEvent(app.prisma, {
        dealId: deal.id,
        actorId: user?.sub,
        type: "deal.cancelled"
      });

      reply.send({
        message: "ยกเลิกดีลเรียบร้อย",
        deal: updated
      });
    }
  );
}
