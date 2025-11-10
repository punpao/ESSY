import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ulid } from "ulid";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../lib/auth";
import { validateTransition } from "@essy/core";

const createDealSchema = z.object({
  title: z.string().min(1).max(200),
  amount_satang: z.number().int().positive(),
  buyer_note: z.string().optional(),
});

const shipDealSchema = z.object({
  tracking_number: z.string().min(1),
  courier: z.string().min(1),
});

export async function dealRoutes(fastify: FastifyInstance) {
  // Create deal (seller only)
  fastify.post("/", { preHandler: requireAuth() }, async (request) => {
    const user = request.user!;

    // Check if user has seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { user_id: user.id },
    });

    if (!sellerProfile) {
      throw new Error("Seller profile required");
    }

    const body = createDealSchema.parse(request.body);
    const paylinkToken = ulid();

    const deal = await prisma.deal.create({
      data: {
        id: ulid(),
        title: body.title,
        amount_satang: body.amount_satang,
        seller_id: user.id,
        paylink_token: paylinkToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    const paylinkUrl = `${process.env.APP_BASE_URL || "http://localhost:3000"}/pay/${paylinkToken}`;

    return {
      deal,
      paylink_url: paylinkUrl,
    };
  });

  // Get deal by ID
  fastify.get("/:id", { preHandler: requireAuth() }, async (request) => {
    const user = request.user!;
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            display_name: true,
          },
        },
        buyer: {
          select: {
            id: true,
            display_name: true,
          },
        },
        payments: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
        disputes: {
          where: { status: "OPEN" },
        },
      },
    });

    if (!deal) {
      throw new Error("Deal not found");
    }

    // Check authorization
    if (deal.seller_id !== user.id && deal.buyer_id !== user.id && user.role !== "admin") {
      throw new Error("Forbidden");
    }

    return deal;
  });

  // Add tracking (seller only)
  fastify.post("/:id/ship", { preHandler: requireAuth() }, async (request) => {
    const user = request.user!;
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = shipDealSchema.parse(request.body);

    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      throw new Error("Deal not found");
    }

    if (deal.seller_id !== user.id) {
      throw new Error("Forbidden");
    }

    const transition = validateTransition(deal.status, "TRACKING_ADDED");
    if (!transition.valid) {
      throw new Error(transition.error || "Invalid transition");
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        status: transition.nextStatus!,
        tracking_number: body.tracking_number,
        courier: body.courier,
      },
    });

    await prisma.dealEvent.create({
      data: {
        deal_id: id,
        event_type: "TRACKING_ADDED",
        from_status: deal.status,
        to_status: transition.nextStatus!,
        metadata: { tracking_number: body.tracking_number, courier: body.courier },
        created_by: user.id,
      },
    });

    return updated;
  });

  // Buyer confirm receipt
  fastify.post("/:id/confirm", { preHandler: requireAuth() }, async (request) => {
    const user = request.user!;
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      throw new Error("Deal not found");
    }

    if (deal.buyer_id !== user.id) {
      throw new Error("Forbidden");
    }

    const transition = validateTransition(deal.status, "BUYER_CONFIRMED");
    if (!transition.valid) {
      throw new Error(transition.error || "Invalid transition");
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        status: transition.nextStatus!,
      },
    });

    await prisma.dealEvent.create({
      data: {
        deal_id: id,
        event_type: "BUYER_CONFIRMED",
        from_status: deal.status,
        to_status: transition.nextStatus!,
        created_by: user.id,
      },
    });

    return updated;
  });

  // Cancel deal (only if PENDING and unpaid)
  fastify.post("/:id/cancel", { preHandler: requireAuth() }, async (request) => {
    const user = request.user!;
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!deal) {
      throw new Error("Deal not found");
    }

    if (deal.seller_id !== user.id && user.role !== "admin") {
      throw new Error("Forbidden");
    }

    if (deal.status !== "PENDING") {
      throw new Error("Can only cancel pending deals");
    }

    const hasPaid = deal.payments.some((p) => p.status === "PAID");
    if (hasPaid) {
      throw new Error("Cannot cancel paid deal");
    }

    // Mark as cancelled (status stays PENDING but we can add cancelled flag)
    await prisma.dealEvent.create({
      data: {
        deal_id: id,
        event_type: "CANCELLED",
        from_status: deal.status,
        to_status: deal.status,
        created_by: user.id,
      },
    });

    return { success: true, message: "Deal cancelled" };
  });
}
