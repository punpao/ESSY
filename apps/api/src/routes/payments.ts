import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ulid } from "ulid";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../lib/auth";
import { MockPromptPayProvider } from "@essy/payment";
import { validateTransition } from "@essy/core";

const paymentProvider = new MockPromptPayProvider();

export async function paymentRoutes(fastify: FastifyInstance) {
  // Create payment charge
  fastify.post("/create", { preHandler: requireAuth() }, async (request) => {
    const user = request.user!;
    const { dealId } = z.object({ dealId: z.string() }).parse(request.body);

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      throw new Error("Deal not found");
    }

    // Create charge via provider
    const charge = await paymentProvider.createCharge({
      deal,
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

    return {
      payment_id: payment.id,
      qr_string: charge.qrString,
      provider_ref: charge.providerRef,
      expires_at: charge.expiresAt,
    };
  });

  // Mock webhook endpoint
  fastify.post("/webhook/mock", async (request) => {
    const body = z
      .object({
        provider_ref: z.string(),
        status: z.enum(["PAID", "FAILED"]),
        buyer_id: z.string().optional(),
      })
      .parse(request.body);

    const payment = await prisma.payment.findFirst({
      where: { provider_ref: body.provider_ref },
      include: { deal: true },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (body.status === "PAID") {
      // Update payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          paid_at: new Date(),
        },
      });

      // Update deal status to HOLD
      const transition = validateTransition(payment.deal.status, "PAYMENT_RECEIVED");
      if (transition.valid && transition.nextStatus) {
        await prisma.deal.update({
          where: { id: payment.deal_id },
          data: {
            status: transition.nextStatus,
            buyer_id: body.buyer_id || payment.deal.buyer_id,
          },
        });

        await prisma.dealEvent.create({
          data: {
            deal_id: payment.deal_id,
            event_type: "PAYMENT_RECEIVED",
            from_status: payment.deal.status,
            to_status: transition.nextStatus,
            metadata: { payment_id: payment.id },
          },
        });
      }
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
    }

    return { success: true };
  });

  // Refund payment (admin/resolver)
  fastify.post("/:dealId/refund", { preHandler: requireAuth(["admin"]) }, async (request) => {
    const admin = request.user!;
    const { dealId } = z.object({ dealId: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { payments: true },
    });

    if (!deal) {
      throw new Error("Deal not found");
    }

    const payment = deal.payments.find((p) => p.status === "PAID");
    if (!payment) {
      throw new Error("No paid payment found");
    }

    // Refund via provider
    await paymentProvider.refund({
      paymentId: payment.id,
      amountSatang: deal.amount_satang,
      reason: "Admin refund",
    });

    // Update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED" },
    });

    // Update deal
    const transition = validateTransition(deal.status, "DISPUTE_RESOLVED_REFUND");
    if (transition.valid && transition.nextStatus) {
      await prisma.deal.update({
        where: { id: dealId },
        data: { status: transition.nextStatus },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: dealId,
          event_type: "DISPUTE_RESOLVED_REFUND",
          from_status: deal.status,
          to_status: transition.nextStatus,
          created_by: admin.id,
        },
      });
    }

    return { success: true };
  });
}
