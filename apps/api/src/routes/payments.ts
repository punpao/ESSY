import { FastifyInstance } from "fastify";
import { z } from "zod";
import { ulid } from "ulid";
import { prisma } from "../db";
import { authenticate, requireRole } from "../auth";
import { MockPromptPayProvider } from "@essy/payment";
import { config } from "../config";
import { transitionEscrowState } from "@essy/core";
import type { EscrowEvent } from "@essy/core";
import { autoReleaseQueue } from "../queue";

const provider = new MockPromptPayProvider(config.paymentWebhookSecret);

export async function paymentRoutes(fastify: FastifyInstance) {
  // Create payment charge
  fastify.post("/payments/create", async (request, reply) => {
    const { dealId } = z.object({ dealId: z.string() }).parse(request.body);

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return reply.status(404).send({ error: "Deal not found" });
    }

    const charge = await provider.createCharge({
      dealId: deal.id,
      amountSatang: deal.amount_satang,
      currency: deal.currency,
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        id: ulid(),
        deal_id: dealId,
        provider: "mock_promptpay",
        provider_ref: charge.providerRef,
        status: "INIT",
      },
    });

    return { qrString: charge.qrString, providerRef: charge.providerRef, payment };
  });

  // Mock webhook (simulates payment gateway callback)
  fastify.post("/payments/webhook/mock", async (request, reply) => {
    const { providerRef, dealId } = z
      .object({
        providerRef: z.string().optional(),
        dealId: z.string().optional(),
      })
      .parse(request.body);

    let payment;
    if (dealId && providerRef) {
      payment = await prisma.payment.findFirst({
        where: { deal_id: dealId, provider_ref: providerRef },
        include: { deal: true },
      });
    } else if (dealId) {
      payment = await prisma.payment.findFirst({
        where: { deal_id: dealId },
        include: { deal: true },
      });
    } else if (providerRef) {
      payment = await prisma.payment.findFirst({
        where: { provider_ref: providerRef },
        include: { deal: true },
      });
    } else {
      return reply.status(400).send({ error: "dealId or providerRef required" });
    }

    if (!payment) {
      return reply.status(404).send({ error: "Payment not found" });
    }

    // Update payment to PAID
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", paid_at: new Date() },
    });

    // Update deal to HOLD and set buyer_id if not set
    const deal = payment.deal;
    const context = {
      status: deal.status as any,
      hasPayment: true,
      hasTracking: false,
      isDelivered: false,
      hasOpenDispute: false,
      canAutoRelease: false,
    };

    const event: EscrowEvent = { type: "PAYMENT_RECEIVED" };
    const newStatus = transitionEscrowState(deal.status as any, event, context);

    if (newStatus) {
      await prisma.deal.update({
        where: { id: deal.id },
        data: {
          status: newStatus,
          updated_at: new Date(),
          // Set buyer_id if not set (first payment)
          buyer_id: deal.buyer_id || undefined, // Will be set by frontend
        },
      });
    }

    // Schedule auto-release check
    if (newStatus === "HOLD") {
      await autoReleaseQueue.add("check-auto-release", { dealId: deal.id }, { delay: 1000 });
    }

    return { success: true, payment, deal };
  });

  // Refund (admin only)
  fastify.post(
    "/payments/:dealId/refund",
    { preHandler: [authenticate, requireRole(["admin"])] },
    async (request, reply) => {
      const { dealId } = z.object({ dealId: z.string() }).parse(request.params);

      const payment = await prisma.payment.findFirst({
        where: { deal_id: dealId, status: "PAID" },
      });

      if (!payment) {
        return reply.status(404).send({ error: "Payment not found" });
      }

      await provider.refund({ paymentId: payment.id });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
      });

      return { success: true };
    }
  );
}
