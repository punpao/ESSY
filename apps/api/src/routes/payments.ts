import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../config/database";
import { authenticate, requireRole } from "../middleware/auth";
import { MockPromptPayProvider } from "@essy/payment";
import { getEnv } from "../config/env";
import { EscrowStateMachine } from "@essy/core";
import { logDealEvent } from "../utils/dealEvents";

const createPaymentSchema = z.object({
  dealId: z.string(),
});

const webhookSchema = z.object({
  provider: z.string(),
  event: z.string(),
  data: z.record(z.unknown()),
  signature: z.string().optional(),
});

export async function paymentsRoutes(fastify: FastifyInstance) {
  const paymentProvider = new MockPromptPayProvider(getEnv().PAYMENT_WEBHOOK_SECRET);

  // Create payment charge
  fastify.post("/payments/create", { preHandler: [authenticate] }, async (request, reply) => {
    const { dealId } = createPaymentSchema.parse(request.body);

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { payments: true },
    });

    if (!deal) {
      reply.code(404).send({ error: "Deal not found" });
      return;
    }

    // Check if payment already exists
    const existingPayment = deal.payments.find((p) => p.status === "INIT" || p.status === "PAID");
    if (existingPayment) {
      reply.code(400).send({ error: "Payment already exists" });
      return;
    }

    const charge = await paymentProvider.createCharge({
      dealId,
      amountSatang: deal.amountSatang,
      currency: deal.currency,
      description: deal.title,
    });

    const payment = await prisma.payment.create({
      data: {
        dealId,
        provider: "mock_promptpay",
        providerRef: charge.providerRef,
        status: "INIT",
      },
    });

    return {
      payment,
      qrString: charge.qrString,
      providerRef: charge.providerRef,
    };
  });

  // Mock webhook endpoint
  fastify.post("/payments/webhook/mock", async (request, reply) => {
    const payload = webhookSchema.parse(request.body);

    const verified = await paymentProvider.verifyWebhook(payload);
    if (!verified) {
      reply.code(401).send({ error: "Invalid signature" });
      return;
    }

    const parsed = await paymentProvider.parseWebhook(payload);

    // Find payment by provider ref
    const payment = await prisma.payment.findFirst({
      where: { providerRef: parsed.paymentRef },
      include: { deal: true },
    });

    if (!payment) {
      reply.code(404).send({ error: "Payment not found" });
      return;
    }

    if (parsed.status === "paid" && payment.status === "INIT") {
      // Update payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      // Update deal status to HOLD
      if (EscrowStateMachine.canTransition(payment.deal.status, "HOLD", { hasPayment: true })) {
        await prisma.deal.update({
          where: { id: payment.dealId },
          data: {
            status: "HOLD",
            // Set buyer if not set (first payment)
            buyerId: payment.deal.buyerId || undefined,
          },
        });

        await logDealEvent(payment.dealId, "PAYMENT_RECEIVED", payment.deal.status, "HOLD");
      }
    }

    return { success: true };
  });

  // Refund payment (admin only)
  fastify.post(
    "/payments/:dealId/refund",
    { preHandler: [authenticate, requireRole("admin")] },
    async (request, reply) => {
      const { dealId } = request.params as { dealId: string };

      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: { payments: true },
      });

      if (!deal) {
        reply.code(404).send({ error: "Deal not found" });
        return;
      }

      const payment = deal.payments.find((p) => p.status === "PAID");
      if (!payment) {
        reply.code(400).send({ error: "No paid payment found" });
        return;
      }

      // Process refund
      await paymentProvider.refund({
        paymentId: payment.id,
        amountSatang: deal.amountSatang,
        reason: "Admin refund",
      });

      // Update payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
      });

      // Update deal
      if (EscrowStateMachine.canTransition(deal.status, "REFUND")) {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "REFUND" },
        });

        await logDealEvent(dealId, "PAYMENT_REFUNDED", deal.status, "REFUND");
      }

      return { success: true };
    }
  );
}
