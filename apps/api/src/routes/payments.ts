import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { transition } from "@escrow/core";
import { logDealEvent } from "../utils/dealEvents";
import { recordReputationEvent } from "../utils/reputation";

const createPaymentSchema = z.object({
  paylinkToken: z.string().min(6),
  buyerEmail: z.string().email().optional(),
  buyerDisplayName: z.string().optional()
});

const webhookSchema = z.object({
  secret: z.string(),
  providerRef: z.string(),
  status: z.enum(["PAID", "FAILED", "REFUNDED"]),
  buyerEmail: z.string().email().optional(),
  buyerDisplayName: z.string().optional()
});

export default async function paymentRoutes(app: FastifyInstance) {
  app.post(
    "/payments/create",
    {
      schema: {
        body: createPaymentSchema
      }
    },
    async (request, reply) => {
      const payload = createPaymentSchema.parse(request.body);

      const deal = await app.prisma.deal.findUnique({
        where: { paylinkToken: payload.paylinkToken },
        include: {
          seller: {
            include: {
              sellerProfile: true
            }
          },
          payment: true
        }
      });

      if (!deal) {
        return reply.code(404).send({ message: "ไม่พบดีล" });
      }

      if (deal.status !== "PENDING" && deal.status !== "HOLD") {
        return reply.code(400).send({ message: "ดีลนี้ไม่สามารถชำระได้" });
      }

      const provider = app.payments.getDefault();
      const sellerProfile = deal.seller.sellerProfile;

      const promptPayId = sellerProfile?.promptPayId;
      if (!promptPayId || promptPayId.trim().length === 0) {
        return reply
          .code(400)
          .send({ message: "ผู้ขายยังไม่ได้ยืนยัน PromptPay ID กรุณาติดต่อผู้ขาย" });
      }

      const charge = await provider.createCharge({
        dealId: deal.id,
        title: deal.title,
        sellerPromptPayId: promptPayId,
        paylinkToken: deal.paylinkToken,
        money: { amountSatang: deal.amountSatang, currency: "THB" }
      });

      const payment = await app.prisma.payment.upsert({
        where: { dealId: deal.id },
        update: {
          provider: provider.name,
          providerRef: charge.providerRef,
          status: "INIT"
        },
        create: {
          dealId: deal.id,
          provider: provider.name,
          providerRef: charge.providerRef,
          status: "INIT"
        }
      });

      await logDealEvent(app.prisma, {
        dealId: deal.id,
        actorId: deal.sellerId,
        type: "payment.created",
        payload: {
          provider: provider.name,
          providerRef: payment.providerRef
        }
      });

      reply.send({
        qrString: charge.qrString,
        providerRef: charge.providerRef,
        paymentId: payment.id,
        status: payment.status,
        message:
          "สแกน QR ผ่านแอปธนาคารของคุณ เงินจะถูกพักไว้จนกว่าคุณจะยืนยันรับของ หรือระบบเห็นว่าจัดส่งสำเร็จ"
      });
    }
  );

  app.post(
    "/payments/webhook/mock",
    {
      schema: {
        body: webhookSchema
      }
    },
    async (request, reply) => {
      const payload = webhookSchema.parse(request.body);
      const provider = app.payments.getDefault();

      const result = provider.verifyWebhook({
        payload,
        secret: app.config.PAYMENT_WEBHOOK_SECRET
      });

      const payment = await app.prisma.payment.findUnique({
        where: { providerRef: result.providerRef },
        include: { deal: true }
      });

      if (!payment) {
        return reply.code(404).send({ message: "ไม่พบการชำระเงิน" });
      }

      const deal = payment.deal;

      if (result.status === "PAID") {
        const buyerEmail = payload.buyerEmail;
        let buyerId = deal.buyerId;

        if (!buyerId && buyerEmail) {
          const buyer = await app.prisma.user.upsert({
            where: { email: buyerEmail },
            update: {},
            create: {
              email: buyerEmail,
              displayName: payload.buyerDisplayName ?? buyerEmail.split("@")[0],
              role: "buyer"
            }
          });
          buyerId = buyer.id;
        }

        const nextStatus =
          deal.status === "PENDING" ? transition(deal.status, { type: "PAYMENT_HOLD" }) : deal.status;

        await app.prisma.$transaction([
          app.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "PAID",
              paidAt: new Date()
            }
          }),
          app.prisma.deal.update({
            where: { id: deal.id },
            data: {
              status: nextStatus,
              buyerId: buyerId ?? deal.buyerId
            }
          })
        ]);

        await logDealEvent(app.prisma, {
          dealId: deal.id,
          actorId: buyerId,
          type: "payment.held",
          payload: { providerRef: payment.providerRef }
        });

        reply.send({ ok: true });
        return;
      }

      if (result.status === "FAILED") {
        await app.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED"
          }
        });
        await logDealEvent(app.prisma, {
          dealId: deal.id,
          actorId: null,
          type: "payment.failed",
          payload
        });
        reply.send({ ok: true });
        return;
      }

      if (result.status === "REFUNDED") {
        await app.prisma.$transaction([
          app.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "REFUNDED"
            }
          }),
          app.prisma.deal.update({
            where: { id: deal.id },
            data: {
              status: "REFUND"
            }
          })
        ]);

        await logDealEvent(app.prisma, {
          dealId: deal.id,
          actorId: null,
          type: "payment.refunded",
          payload
        });
        reply.send({ ok: true });
        return;
      }
    }
  );

  app.post(
    "/payments/:dealId/refund",
    {
      preHandler: [app.authenticate, app.authorize(["admin"])],
      schema: {
        params: z.object({
          dealId: z.string()
        }),
        body: z
          .object({
            reason: z.string().optional()
          })
          .optional()
      }
    },
    async (request, reply) => {
      const { dealId } = request.params as { dealId: string };

      const payment = await app.prisma.payment.findUnique({
        where: { dealId },
        include: { deal: true }
      });

      if (!payment) {
        return reply.code(404).send({ message: "ไม่พบรายการชำระเงิน" });
      }

      const provider = app.payments.get(payment.provider);
      await provider.refund({
        paymentId: payment.id,
        providerRef: payment.providerRef,
        amount: { amountSatang: payment.deal.amountSatang, currency: "THB" }
      });

      await app.prisma.$transaction([
        app.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "REFUNDED"
          }
        }),
        app.prisma.deal.update({
          where: { id: dealId },
          data: {
            status: "REFUND"
          }
        })
      ]);

      await logDealEvent(app.prisma, {
        dealId,
        actorId: request.user?.sub,
        type: "payment.refunded.admin",
        payload: request.body
      });

      await recordReputationEvent({
        prisma: app.prisma,
        sellerUserId: payment.deal.sellerId,
        type: "negative",
        weight: -1,
        note: "Refunded by admin"
      });

      await app.jobs.enqueueReputation(payment.deal.sellerId);

      reply.send({ message: "คืนเงินให้ผู้ซื้อเรียบร้อย" });
    }
  );
}
