import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { ulid } from "ulid";
import { prisma } from "../lib/prisma";
import { requireRole, authenticate } from "../lib/auth";
import { validateTransition, calculateAutoReleaseAt } from "@essy/core";

const CreateDealSchema = z.object({
  title: z.string().min(1).max(200),
  amountSatang: z.number().int().positive(),
  currency: z.string().default("THB"),
  buyerNote: z.string().optional(),
});

const ShipDealSchema = z.object({
  trackingNumber: z.string().min(1),
  courier: z.string().min(1),
});

export async function dealRoutes(fastify: FastifyInstance) {
  // Create deal (seller only)
  fastify.post(
    "/",
    { preHandler: requireRole("seller", "admin") },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const data = CreateDealSchema.parse(request.body);

      // Check seller profile exists
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!sellerProfile) {
        return reply.status(400).send({ error: "Seller profile not found. Complete KYC first." });
      }

      const dealId = ulid();
      const paylinkToken = `pay_${ulid()}`;

      const deal = await prisma.deal.create({
        data: {
          id: dealId,
          title: data.title,
          amountSatang: data.amountSatang,
          currency: data.currency,
          sellerId: user.id,
          status: "PENDING",
          paylinkToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          dealId: deal.id,
          provider: "mock_promptpay",
          status: "INIT",
        },
      });

      // Log event
      await prisma.dealEvent.create({
        data: {
          dealId: deal.id,
          eventType: "DEAL_CREATED",
          metadata: { sellerId: user.id },
        },
      });

      const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
      return {
        ...deal,
        paylinkUrl: `${baseUrl}/pay/${paylinkToken}`,
      };
    }
  );

  // Get deal by paylink token (public)
  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const query = z
      .object({
        paylinkToken: z.string().optional(),
        id: z.string().optional(),
      })
      .parse(request.query);

    if (query.paylinkToken) {
      const deal = await prisma.deal.findUnique({
        where: { paylinkToken: query.paylinkToken },
        include: {
          seller: { include: { sellerProfile: true } },
          buyer: true,
          payment: true,
          disputes: { include: { evidence: true } },
        },
      });

      if (!deal) {
        return reply.status(404).send({ error: "Deal not found" });
      }

      return deal;
    }

    // List deals (requires auth)
    const user = await authenticate(request, reply).catch(() => null);
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const deals = await prisma.deal.findMany({
      where: {
        OR: [{ sellerId: user.id }, { buyerId: user.id }],
      },
      include: {
        seller: { include: { sellerProfile: true } },
        buyer: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return deals;
  });

  // Get deal by ID
  fastify.get(
    "/:id",
    { preHandler: requireRole("buyer", "seller", "admin") },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = z.object({ id: z.string() }).parse(request.params);

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: {
          seller: { include: { sellerProfile: true } },
          buyer: true,
          payment: true,
          disputes: { include: { evidence: true } },
        },
      });

      if (!deal) {
        return reply.status(404).send({ error: "Deal not found" });
      }

      // Check access
      if (
        user.role !== "admin" &&
        deal.sellerId !== user.id &&
        deal.buyerId !== user.id
      ) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      return deal;
    }
  );

  // Add tracking (seller only, transitions to SHIPPED)
  fastify.post(
    "/:id/ship",
    { preHandler: requireRole("seller", "admin") },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const data = ShipDealSchema.parse(request.body);

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: { payment: true },
      });

      if (!deal) {
        return reply.status(404).send({ error: "Deal not found" });
      }

      if (deal.sellerId !== user.id && user.role !== "admin") {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const validation = validateTransition(deal.status, "SHIPPED", {
        status: deal.status,
        paymentStatus: deal.payment?.status,
        trackingNumber: data.trackingNumber,
      });

      if (!validation.valid) {
        return reply.status(400).send({ error: validation.reason });
      }

      const updated = await prisma.deal.update({
        where: { id },
        data: {
          status: "SHIPPED",
          trackingNumber: data.trackingNumber,
          courier: data.courier,
        },
      });

      await prisma.dealEvent.create({
        data: {
          dealId: deal.id,
          eventType: "DEAL_SHIPPED",
          metadata: { trackingNumber: data.trackingNumber, courier: data.courier },
        },
      });

      return updated;
    }
  );

  // Buyer confirms receipt (transitions to RELEASED)
  fastify.post(
    "/:id/confirm",
    { preHandler: requireRole("buyer", "admin") },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = z.object({ id: z.string() }).parse(request.params);

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: { payment: true },
      });

      if (!deal) {
        return reply.status(404).send({ error: "Deal not found" });
      }

      if (deal.buyerId !== user.id && user.role !== "admin") {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const validation = validateTransition(deal.status, "RELEASED", {
        status: deal.status,
        paymentStatus: deal.payment?.status,
        deliveredAt: deal.deliveredAt,
      });

      if (!validation.valid) {
        return reply.status(400).send({ error: validation.reason });
      }

      const updated = await prisma.deal.update({
        where: { id },
        data: {
          status: "RELEASED",
        },
      });

      await prisma.dealEvent.create({
        data: {
          dealId: deal.id,
          eventType: "DEAL_RELEASED",
          metadata: { confirmedBy: user.id },
        },
      });

      // Update reputation
      const { updateSellerReputation } = await import("../lib/updateReputation");
      await updateSellerReputation(deal.sellerId);

      return updated;
    }
  );

  // Cancel deal (only if PENDING and unpaid)
  fastify.post(
    "/:id/cancel",
    { preHandler: requireRole("seller", "admin") },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = z.object({ id: z.string() }).parse(request.params);

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: { payment: true },
      });

      if (!deal) {
        return reply.status(404).send({ error: "Deal not found" });
      }

      if (deal.sellerId !== user.id && user.role !== "admin") {
        return reply.status(403).send({ error: "Forbidden" });
      }

      if (deal.status !== "PENDING" || deal.payment?.status === "PAID") {
        return reply.status(400).send({ error: "Cannot cancel deal in current state" });
      }

      await prisma.deal.delete({ where: { id } });

      return { message: "Deal cancelled" };
    }
  );
}
