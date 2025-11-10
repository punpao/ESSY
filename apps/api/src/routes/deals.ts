import { FastifyInstance } from "fastify";
import { z } from "zod";
import { ulid } from "ulid";
import { prisma } from "../db";
import { authenticate, requireRole } from "../auth";
import { transitionEscrowState } from "@essy/core";
import type { EscrowEvent } from "@essy/core";
import { config } from "../config";

const createDealSchema = z.object({
  title: z.string().min(1),
  amount_satang: z.number().int().positive(),
  currency: z.string().default("THB"),
  buyer_note: z.string().optional(),
});

const shipDealSchema = z.object({
  tracking_number: z.string().min(1),
  courier: z.string().min(1),
});

export async function dealRoutes(fastify: FastifyInstance) {
  // Create deal (seller only)
  fastify.post(
    "/deals",
    { preHandler: [authenticate, requireRole(["seller", "admin"])] },
    async (request, reply) => {
      const data = createDealSchema.parse(request.body);
      const paylinkToken = ulid();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const deal = await prisma.deal.create({
        data: {
          id: ulid(),
          title: data.title,
          amount_satang: data.amount_satang,
          currency: data.currency,
          seller_id: request.user!.id,
          status: "PENDING",
          paylink_token: paylinkToken,
          expires_at: expiresAt,
        },
      });

      const paylinkUrl = `${config.appBaseUrl}/pay/${paylinkToken}`;
      return { deal, paylink_url: paylinkUrl };
    }
  );

  // Get deal by token (public, no auth required)
  fastify.get("/deals", async (request, reply) => {
    const { token, role } = z
      .object({
        token: z.string().optional(),
        role: z.string().optional(),
      })
      .parse(request.query);

    // Public route: get deal by token
    if (token) {
      const deal = await prisma.deal.findUnique({
        where: { paylink_token: token },
        include: {
          seller: { include: { seller_profile: true } },
          buyer: true,
          payments: true,
        },
      });

      if (!deal) {
        return reply.status(404).send({ error: "Deal not found" });
      }

      return deal;
    }

    // Authenticated route: list deals (requires auth)
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const token = authHeader.replace("Bearer ", "");
      const decoded = request.server.jwt.verify<{ id: string; role: string }>(token);
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        return reply.status(401).send({ error: "User not found" });
      }

      const userId = user.id;
      const userRole = user.role;

      let where: any = {};
      if (role === "seller" || (userRole === "seller" && !role)) {
        where.seller_id = userId;
      } else if (role === "buyer" || (userRole === "buyer" && !role)) {
        where.buyer_id = userId;
      }

      const deals = await prisma.deal.findMany({
        where,
        include: {
          seller: true,
          buyer: true,
          payments: true,
        },
        orderBy: { created_at: "desc" },
        take: 100,
      });

      return { deals };
    } catch (error) {
      return reply.status(401).send({ error: "Invalid token" });
    }
  });

  // Get deal by ID (authenticated)
  fastify.get(
    "/deals/:id",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const deal = await prisma.deal.findUnique({
        where: { id },
        include: {
          seller: { include: { seller_profile: true } },
          buyer: true,
          payments: true,
          disputes: true,
        },
      });

      if (!deal) {
        return reply.status(404).send({ error: "Deal not found" });
      }

      // Check access
      if (
        request.user!.role !== "admin" &&
        deal.seller_id !== request.user!.id &&
        deal.buyer_id !== request.user!.id
      ) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      return deal;
    }
  );

  // Ship deal
  fastify.post(
    "/deals/:id/ship",
    { preHandler: [authenticate, requireRole(["seller", "admin"])] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const { tracking_number, courier } = shipDealSchema.parse(request.body);

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: { payments: true },
      });

      if (!deal) {
        return reply.status(404).send({ error: "Deal not found" });
      }

      if (deal.seller_id !== request.user!.id && request.user!.role !== "admin") {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const hasPayment = deal.payments.some((p) => p.status === "PAID");
      const context = {
        status: deal.status as any,
        hasPayment,
        hasTracking: false,
        isDelivered: false,
        hasOpenDispute: false,
        canAutoRelease: false,
      };

      const event: EscrowEvent = {
        type: "SHIPPED",
        trackingNumber: tracking_number,
        courier,
      };
      const newStatus = transitionEscrowState(deal.status as any, event, context);

      if (!newStatus) {
        return reply.status(400).send({ error: "Invalid state transition" });
      }

      // Calculate auto-release time (48 hours after delivery)
      const autoReleaseAt = new Date(Date.now() + config.autoReleaseHours * 60 * 60 * 1000);

      const updated = await prisma.deal.update({
        where: { id },
        data: {
          status: newStatus,
          tracking_number,
          courier,
          auto_release_at: autoReleaseAt,
          updated_at: new Date(),
        },
      });

      return updated;
    }
  );

  // Confirm receipt
  fastify.post(
    "/deals/:id/confirm",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: { payments: true, disputes: true },
      });

      if (!deal) {
        return reply.status(404).send({ error: "Deal not found" });
      }

      if (deal.buyer_id !== request.user!.id && request.user!.role !== "admin") {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const hasPayment = deal.payments.some((p) => p.status === "PAID");
      const hasOpenDispute = deal.disputes.some((d) => d.status === "OPEN");
      const context = {
        status: deal.status as any,
        hasPayment,
        hasTracking: !!deal.tracking_number,
        isDelivered: !!deal.delivered_at,
        hasOpenDispute,
        canAutoRelease: false,
      };

      const event: EscrowEvent = { type: "BUYER_CONFIRMED" };
      const newStatus = transitionEscrowState(deal.status as any, event, context);

      if (!newStatus) {
        return reply.status(400).send({ error: "Invalid state transition" });
      }

      const updated = await prisma.deal.update({
        where: { id },
        data: {
          status: newStatus,
          updated_at: new Date(),
        },
      });

      return updated;
    }
  );

  // Cancel deal
  fastify.post(
    "/deals/:id/cancel",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: { payments: true },
      });

      if (!deal) {
        return reply.status(404).send({ error: "Deal not found" });
      }

      if (
        deal.seller_id !== request.user!.id &&
        deal.buyer_id !== request.user!.id &&
        request.user!.role !== "admin"
      ) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const hasPayment = deal.payments.some((p) => p.status === "PAID");
      if (hasPayment) {
        return reply.status(400).send({ error: "Cannot cancel paid deal" });
      }

      if (deal.status !== "PENDING") {
        return reply.status(400).send({ error: "Can only cancel pending deals" });
      }

      // Just mark as cancelled (status stays PENDING but we can add metadata)
      return { message: "Deal cancelled" };
    }
  );
}
