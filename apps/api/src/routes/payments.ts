import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireRole } from "../lib/auth";
import { MockPromptPayProvider } from "@essy/payment";
import { validateTransition } from "@essy/core";

const paymentProvider = new MockPromptPayProvider(
  process.env.PAYMENT_WEBHOOK_SECRET || "mock_secret"
);

export async function paymentRoutes(fastify: FastifyInstance) {
  // Create payment charge (returns QR)
  fastify.post(
    "/create",
    { preHandler: requireRole("buyer", "seller", "admin") },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { dealId } = z.object({ dealId: z.string() }).parse(request.body);

      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: { payment: true },
      });

      if (!deal) {
        return reply.status(404).send({ error: "Deal not found" });
      }

      if (deal.payment?.status === "PAID") {
        return reply.status(400).send({ error: "Payment already completed" });
      }

      const charge = await paymentProvider.createCharge({
        dealId: deal.id,
        amountSatang: deal.amountSatang,
        currency: deal.currency,
        description: deal.title,
      });

      // Update payment record
      await prisma.payment.update({
        where: { dealId },
        data: {
          providerRef: charge.providerRef,
          status: "INIT",
        },
      });

      return charge;
    }
  );

  // Mock webhook (simulates payment gateway callback)
  fastify.post("/webhook/mock", async (request: FastifyRequest, reply: FastifyReply) => {
    const body = z
      .object({
        providerRef: z.string(),
        status: z.enum(["PAID", "FAILED"]),
        amountSatang: z.number(),
        buyerId: z.string().optional(),
      })
      .parse(request.body);

    const payment = await prisma.payment.findFirst({
      where: { providerRef: body.providerRef },
      include: { deal: true },
    });

    if (!payment) {
      return reply.status(404).send({ error: "Payment not found" });
    }

    if (body.status === "PAID") {
      // Update payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      // Update deal: set buyer and transition to HOLD
      const deal = await prisma.deal.update({
        where: { id: payment.dealId },
        data: {
          buyerId: body.buyerId || undefined,
          status: "HOLD",
        },
      });

      await prisma.dealEvent.create({
        data: {
          dealId: deal.id,
          eventType: "PAYMENT_RECEIVED",
          metadata: { providerRef: body.providerRef },
        },
      });
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
    }

    return { success: true };
  });

  // Refund payment (admin only, for disputes)
  fastify.post(
    "/:dealId/refund",
    { preHandler: requireRole("admin") },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { dealId } = z.object({ dealId: z.string() }).parse(request.params);
      const { reason } = z.object({ reason: z.string().optional() }).parse(request.body);

      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: { payment: true },
      });

      if (!deal || !deal.payment) {
        return reply.status(404).send({ error: "Deal or payment not found" });
      }

      if (deal.payment.status !== "PAID") {
        return reply.status(400).send({ error: "Payment not paid" });
      }

      const refund = await paymentProvider.refund({
        paymentId: deal.payment.id,
        reason,
      });

      await prisma.payment.update({
        where: { id: deal.payment.id },
        data: { status: "REFUNDED" },
      });

      await prisma.deal.update({
        where: { id: dealId },
        data: { status: "REFUND" },
      });

      await prisma.dealEvent.create({
        data: {
          dealId: deal.id,
          eventType: "PAYMENT_REFUNDED",
          metadata: { refundId: refund.refundId, reason },
        },
      });

      return { success: true, refundId: refund.refundId };
    }
  );
}
