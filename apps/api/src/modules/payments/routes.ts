import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { logDealEvent, nextEscrowState } from "../shared/utils";
import { DealStatus } from "@escrow/core";
import { recalculateReputation } from "../shared/reputation";

const createPaymentSchema = z.object({
  paylink_token: z.string().min(10),
  buyer_email: z.string().email().optional(),
  buyer_id: z.string().uuid().optional()
});

const mockWebhookSchema = z.object({
  provider_ref: z.string(),
  deal_id: z.string(),
  amount_satang: z.number().positive(),
  buyer_id: z.string().uuid().nullable().optional(),
  status: z.enum(["PAID", "REFUNDED", "FAILED"])
});

const refundSchema = z.object({
  reason: z.string().min(3)
});

export async function registerPaymentRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/payments/create",
    {
      schema: { body: createPaymentSchema }
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof createPaymentSchema>;

      const deal = await prisma.deal.findFirst({
        where: { paylinkToken: body.paylink_token },
        include: { payments: true }
      });

      if (!deal) {
        return reply.notFound("เพย์ลิงก์ไม่ถูกต้อง");
      }

      if (deal.expiresAt < new Date()) {
        return reply.badRequest("เพย์ลิงก์หมดอายุแล้ว");
      }

      const existingPaid = deal.payments.find((p) => p.status === "PAID");
      if (existingPaid) {
        return reply.badRequest("ดีลนี้ชำระแล้ว");
      }

      const payment = await prisma.payment.create({
        data: {
          dealId: deal.id,
          provider: "mock_promptpay",
          status: "INIT",
          amountSatang: deal.amountSatang,
          providerRef: null
        }
      });

      const charge = await fastify.paymentProvider.createCharge({
        dealId: deal.id,
        amountSatang: deal.amountSatang,
        currency: deal.currency,
        buyerEmail: body.buyer_email,
        expiresAt: deal.expiresAt,
        metadata: { paylinkToken: deal.paylinkToken }
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerRef: charge.providerRef
        }
      });

      if (body.buyer_id) {
        await prisma.deal.update({
          where: { id: deal.id },
          data: { buyerId: body.buyer_id }
        });
      }

      return reply.send({
        payment_id: payment.id,
        provider_ref: charge.providerRef,
        qr_string: charge.qrString,
        amount_satang: deal.amountSatang
      });
    }
  );

  fastify.post("/payments/webhook/mock", async (request, reply) => {
    const signature = (request.headers["x-mock-signature"] ?? "") as string;
    const rawBody = JSON.stringify(request.body);

    const verification = fastify.paymentProvider.verifyWebhook(rawBody, signature);
    if (!verification.valid) {
      return reply.status(400).send({ ok: false, reason: "invalid signature" });
    }

    const payload = mockWebhookSchema.parse(verification.payload);
    const deal = await prisma.deal.findUnique({
      where: { id: payload.deal_id },
      include: { payments: true, disputes: { where: { status: "OPEN" } } }
    });

    if (!deal) {
      return reply.status(404).send({ ok: false, reason: "deal not found" });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        dealId: deal.id,
        providerRef: payload.provider_ref
      }
    });

    if (!payment) {
      return reply.status(404).send({ ok: false, reason: "payment not found" });
    }

    if (payload.status === "PAID") {
      if (payment.status !== "PAID") {
        const nextStatus = nextEscrowState(
          deal.status as DealStatus,
          { type: "PAYMENT_HOLD" },
          {
            hasPayment: true,
            deliveredAt: deal.deliveredAt,
            autoReleaseAt: deal.autoReleaseAt,
            now: new Date(),
            hasOpenDispute: false
          }
        );

        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "PAID",
              paidAt: new Date()
            }
          }),
          prisma.deal.update({
            where: { id: deal.id },
            data: {
              status: nextStatus,
              buyerId: payload.buyer_id ?? deal.buyerId
            }
          })
        ]);

        await logDealEvent(
          deal.id,
          nextStatus,
          payload.buyer_id ?? deal.buyerId ?? "system",
          "ผู้ซื้อชำระเงินผ่าน PromptPay (mock)"
        );
      }
    }

    return reply.send({ ok: true });
  });

  fastify.post(
    "/payments/:dealId/refund",
    {
      preHandler: fastify.authorize(["admin"]),
      schema: { body: refundSchema }
    },
    async (request, reply) => {
      const { dealId } = request.params as { dealId: string };
      const body = request.body as z.infer<typeof refundSchema>;

      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: { payments: true, disputes: { where: { status: "OPEN" } } }
      });

      if (!deal) {
        return reply.notFound("ไม่พบดีล");
      }

      const paidPayment = deal.payments.find((p) => p.status === "PAID");
      if (!paidPayment) {
        return reply.badRequest("ยังไม่มีการชำระเงิน");
      }

      const nextStatus = nextEscrowState(
        deal.status as DealStatus,
        { type: "RESOLVE_REFUND" },
        {
          hasPayment: true,
          deliveredAt: deal.deliveredAt,
          autoReleaseAt: deal.autoReleaseAt,
          now: new Date(),
          hasOpenDispute: deal.disputes.length > 0,
          adminOverride: true
        }
      );

      await fastify.paymentProvider.refund({
        paymentId: paidPayment.id,
        providerRef: paidPayment.providerRef ?? "",
        amountSatang: paidPayment.amountSatang,
        reason: body.reason
      });

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: paidPayment.id },
          data: { status: "REFUNDED" }
        }),
        prisma.deal.update({
          where: { id: deal.id },
          data: {
            status: nextStatus,
            resolvedAt: new Date()
          }
        }),
        prisma.reputationEvent.create({
          data: {
            sellerId: deal.sellerId,
            type: "negative",
            weight: 1.5,
            note: body.reason
          }
        })
      ]);

      await logDealEvent(deal.id, nextStatus, request.user.userId, `คืนเงิน: ${body.reason}`);
      await recalculateReputation(deal.sellerId);

      return reply.send({ ok: true });
    }
  );
}
