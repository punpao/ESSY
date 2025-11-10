import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../config/database";
import { authenticate, requireRole } from "../middleware/auth";
import { generateULID, generatePaylinkToken } from "../utils/ulid";
import { logDealEvent } from "../utils/dealEvents";
import { EscrowStateMachine } from "@essy/core";
import { getEnv } from "../config/env";

const createDealSchema = z.object({
  title: z.string().min(1),
  amountSatang: z.number().int().positive(),
  currency: z.string().default("THB"),
  buyerNote: z.string().optional(),
});

const shipDealSchema = z.object({
  trackingNumber: z.string().min(1),
  courier: z.string().min(1),
});

export async function dealsRoutes(fastify: FastifyInstance) {
  // Create deal
  fastify.post(
    "/deals",
    { preHandler: [authenticate, requireRole("seller", "admin")] },
    async (request, reply) => {
      const sellerId = request.user!.id;
      const { title, amountSatang, currency, buyerNote } = createDealSchema.parse(request.body);

      const deal = await prisma.deal.create({
        data: {
          id: generateULID(),
          title,
          amountSatang,
          currency,
          sellerId,
          paylinkToken: generatePaylinkToken(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      await logDealEvent(deal.id, "DEAL_CREATED", undefined, "PENDING");

      const paylinkUrl = `${getEnv().APP_BASE_URL}/pay/${deal.paylinkToken}`;

      return { deal, paylinkUrl };
    }
  );

  // Get deal by paylink token (public)
  fastify.get("/deals", async (request, reply) => {
    const { paylinkToken } = request.query as { paylinkToken?: string };

    if (paylinkToken) {
      const deal = await prisma.deal.findUnique({
        where: { paylinkToken },
        include: {
          seller: { select: { id: true, displayName: true } },
          buyer: { select: { id: true, displayName: true } },
          payments: true,
        },
      });

      if (!deal) {
        reply.code(404).send({ error: "Deal not found" });
        return;
      }

      return { deal };
    }

    reply.code(400).send({ error: "paylinkToken required" });
  });

  // Get deal by ID
  fastify.get("/deals/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, displayName: true } },
        buyer: { select: { id: true, displayName: true } },
        payments: true,
        disputes: { include: { evidence: true } },
      },
    });

    if (!deal) {
      reply.code(404).send({ error: "Deal not found" });
      return;
    }

    // Check access
    if (
      deal.sellerId !== userId &&
      deal.buyerId !== userId &&
      request.user!.role !== "admin"
    ) {
      reply.code(403).send({ error: "Forbidden" });
      return;
    }

    return deal;
  });

  // Ship deal
  fastify.post(
    "/deals/:id/ship",
    { preHandler: [authenticate, requireRole("seller", "admin")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.id;
      const { trackingNumber, courier } = shipDealSchema.parse(request.body);

      const deal = await prisma.deal.findUnique({
        where: { id },
      });

      if (!deal) {
        reply.code(404).send({ error: "Deal not found" });
        return;
      }

      if (deal.sellerId !== userId && request.user!.role !== "admin") {
        reply.code(403).send({ error: "Forbidden" });
        return;
      }

      // Validate transition
      if (!EscrowStateMachine.canTransition(deal.status, "SHIPPED", { hasTracking: true })) {
        reply.code(400).send({ error: `Cannot ship deal in status ${deal.status}` });
        return;
      }

      const updated = await prisma.deal.update({
        where: { id },
        data: {
          status: "SHIPPED",
          trackingNumber,
          courier,
          autoReleaseAt: new Date(
            Date.now() + parseInt(getEnv().AUTO_RELEASE_HOURS) * 60 * 60 * 1000
          ),
        },
      });

      await logDealEvent(deal.id, "DEAL_SHIPPED", deal.status, "SHIPPED", {
        trackingNumber,
        courier,
      });

      return updated;
    }
  );

  // Confirm receipt
  fastify.post(
    "/deals/:id/confirm",
    { preHandler: [authenticate, requireRole("buyer", "admin")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.id;

      const deal = await prisma.deal.findUnique({
        where: { id },
      });

      if (!deal) {
        reply.code(404).send({ error: "Deal not found" });
        return;
      }

      if (deal.buyerId !== userId && request.user!.role !== "admin") {
        reply.code(403).send({ error: "Forbidden" });
        return;
      }

      // Validate transition
      if (!EscrowStateMachine.canTransition(deal.status, "RELEASED")) {
        reply.code(400).send({ error: `Cannot confirm deal in status ${deal.status}` });
        return;
      }

      const updated = await prisma.deal.update({
        where: { id },
        data: {
          status: "RELEASED",
        },
      });

      await logDealEvent(deal.id, "DEAL_CONFIRMED", deal.status, "RELEASED");

      // Trigger reputation update
      // This would be handled by a job in production
      await updateSellerReputation(deal.sellerId);

      return updated;
    }
  );

  // Cancel deal
  fastify.post(
    "/deals/:id/cancel",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.id;

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: { payments: true },
      });

      if (!deal) {
        reply.code(404).send({ error: "Deal not found" });
        return;
      }

      if (deal.sellerId !== userId && request.user!.role !== "admin") {
        reply.code(403).send({ error: "Forbidden" });
        return;
      }

      // Only allow cancellation if PENDING and no payment
      if (deal.status !== "PENDING" || deal.payments.some((p) => p.status === "PAID")) {
        reply.code(400).send({ error: "Cannot cancel deal with payment" });
        return;
      }

      await prisma.deal.delete({
        where: { id },
      });

      await logDealEvent(deal.id, "DEAL_CANCELLED", deal.status, undefined);

      return { success: true };
    }
  );
}

async function updateSellerReputation(sellerId: string): Promise<void> {
  // Simple reputation calculation
  const events = await prisma.reputationEvent.findMany({
    where: { sellerId },
  });

  const score = events.reduce((sum, event) => {
    const weight = event.type === "positive" ? 0.3 : event.type === "negative" ? -1.0 : 0;
    return sum + event.weight * weight;
  }, 0);

  // Sigmoid function for score normalization
  const normalizedScore = 1 / (1 + Math.exp(-score / 10));

  await prisma.sellerProfile.updateMany({
    where: { userId: sellerId },
    data: { reputationScore: normalizedScore },
  });
}
