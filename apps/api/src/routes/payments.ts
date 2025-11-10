import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { paymentProvider } from "../lib/payment";
import { EscrowStateMachine } from "@thai-escrow/core";

const CreatePaymentSchema = z.object({
  paylink_token: z.string(),
});

const WebhookSchema = z.object({
  provider_ref: z.string(),
  status: z.string(),
  signature: z.string(),
});

export async function paymentRoutes(fastify: FastifyInstance) {
  // Create payment (generate QR)
  fastify.post("/payments/create", async (request, reply) => {
    const body = CreatePaymentSchema.parse(request.body);

    const deal = await prisma.deal.findUnique({
      where: { paylink_token: body.paylink_token },
      include: { seller: { include: { seller_profile: true } } },
    });

    if (!deal) {
      return reply.code(404).send({ error: "Deal not found" });
    }

    if (deal.status !== "PENDING") {
      return reply.code(400).send({ error: "Deal is not pending payment" });
    }

    if (!deal.seller.seller_profile?.promptpay_id) {
      return reply.code(400).send({ error: "Seller has not set up PromptPay" });
    }

    const result = await paymentProvider.createCharge({
      dealId: deal.id,
      amountSatang: deal.amount_satang,
      currency: deal.currency,
      description: deal.title,
      promptpayId: deal.seller.seller_profile.promptpay_id,
    });

    if (!result.success) {
      return reply.code(500).send({ error: result.error });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        deal_id: deal.id,
        provider: "mock_promptpay",
        provider_ref: result.providerRef,
        amount_satang: deal.amount_satang,
        status: "INIT",
      },
    });

    return reply.send({
      success: true,
      payment_id: payment.id,
      provider_ref: result.providerRef,
      qr_data_url: result.qrDataUrl,
      qr_string: result.qrString,
    });
  });

  // Webhook handler (mock)
  fastify.post("/payments/webhook/mock", async (request, reply) => {
    const body = WebhookSchema.parse(request.body);

    // Verify webhook
    const verification = await paymentProvider.verifyWebhook({
      event: "payment.success",
      providerRef: body.provider_ref,
      status: body.status,
      data: {},
      signature: body.signature,
    });

    if (!verification.valid) {
      return reply.code(401).send({ error: "Invalid webhook signature" });
    }

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { provider_ref: body.provider_ref },
      include: { deal: true },
    });

    if (!payment) {
      return reply.code(404).send({ error: "Payment not found" });
    }

    if (payment.status === "PAID") {
      return reply.send({ success: true, message: "Payment already processed" });
    }

    // Update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        paid_at: new Date(),
      },
    });

    // Update deal status to HOLD
    const updatedDeal = await prisma.deal.update({
      where: { id: payment.deal_id },
      data: {
        status: "HOLD",
      },
    });

    // Log event
    await prisma.dealEvent.create({
      data: {
        deal_id: payment.deal_id,
        event_type: "paid",
        from_status: "PENDING",
        to_status: "HOLD",
      },
    });

    return reply.send({ success: true, deal: updatedDeal });
  });

  // Refund payment (admin only)
  fastify.post(
    "/payments/:dealId/refund",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { dealId } = request.params as { dealId: string };
      const user = request.user as { userId: string; role: string };

      if (user.role !== "admin") {
        return reply.code(403).send({ error: "Admin only" });
      }

      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: { payments: true },
      });

      if (!deal) {
        return reply.code(404).send({ error: "Deal not found" });
      }

      const payment = deal.payments.find((p) => p.status === "PAID");
      if (!payment) {
        return reply.code(400).send({ error: "No paid payment found" });
      }

      // Execute refund via provider
      const result = await paymentProvider.refund({
        providerRef: payment.provider_ref,
        amountSatang: payment.amount_satang,
        reason: "Dispute resolved - refund",
      });

      if (!result.success) {
        return reply.code(500).send({ error: result.error });
      }

      // Update payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "REFUNDED",
          refunded_at: new Date(),
        },
      });

      // Update deal
      await prisma.deal.update({
        where: { id: dealId },
        data: { status: "REFUND" },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: dealId,
          event_type: "refunded",
          from_status: deal.status,
          to_status: "REFUND",
          actor_id: user.userId,
        },
      });

      return reply.send({ success: true, message: "Refund processed" });
    }
  );
}
