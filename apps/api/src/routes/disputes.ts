import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ulid } from "ulid";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../lib/auth";
import { validateTransition } from "@essy/core";

const openDisputeSchema = z.object({
  reason_text: z.string().min(10),
});

const addEvidenceSchema = z.object({
  url: z.string().url(),
  kind: z.enum(["image", "chatlog", "other"]),
  note: z.string().optional(),
});

const resolveDisputeSchema = z.object({
  resolution: z.enum(["RESOLVED_REFUND", "RESOLVED_RELEASE"]),
  resolution_note: z.string().min(10),
});

export async function disputeRoutes(fastify: FastifyInstance) {
  // Open dispute
  fastify.post("/:dealId/open", { preHandler: requireAuth() }, async (request) => {
    const user = request.user!;
    const { dealId } = z.object({ dealId: z.string() }).parse(request.params);
    const body = openDisputeSchema.parse(request.body);

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      throw new Error("Deal not found");
    }

    if (deal.buyer_id !== user.id) {
      throw new Error("Only buyer can open dispute");
    }

    // Check if dispute already exists
    const existing = await prisma.dispute.findFirst({
      where: { deal_id: dealId, status: "OPEN" },
    });

    if (existing) {
      throw new Error("Dispute already open");
    }

    const transition = validateTransition(deal.status, "DISPUTE_OPENED");
    if (!transition.valid) {
      throw new Error(transition.error || "Cannot open dispute in current state");
    }

    const dispute = await prisma.dispute.create({
      data: {
        id: ulid(),
        deal_id: dealId,
        opened_by: user.id,
        reason_text: body.reason_text,
        status: "OPEN",
      },
    });

    await prisma.deal.update({
      where: { id: dealId },
      data: { status: "DISPUTE" },
    });

    await prisma.dealEvent.create({
      data: {
        deal_id: dealId,
        event_type: "DISPUTE_OPENED",
        from_status: deal.status,
        to_status: "DISPUTE",
        created_by: user.id,
      },
    });

    return dispute;
  });

  // Add evidence
  fastify.post("/:id/evidence", { preHandler: requireAuth() }, async (request) => {
    const user = request.user!;
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = addEvidenceSchema.parse(request.body);

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: { deal: true },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    // Check authorization
    if (
      dispute.opened_by !== user.id &&
      dispute.deal.seller_id !== user.id &&
      user.role !== "admin"
    ) {
      throw new Error("Forbidden");
    }

    const evidence = await prisma.evidence.create({
      data: {
        id: ulid(),
        dispute_id: id,
        uploaded_by: user.id,
        kind: body.kind,
        url: body.url,
        note: body.note,
      },
    });

    return evidence;
  });

  // Resolve dispute (admin)
  fastify.post("/:id/resolve", { preHandler: requireAuth(["admin"]) }, async (request) => {
    const admin = request.user!;
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = resolveDisputeSchema.parse(request.body);

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: { deal: true },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    if (dispute.status !== "OPEN") {
      throw new Error("Dispute already resolved");
    }

    const transition = validateTransition(
      dispute.deal.status,
      body.resolution === "RESOLVED_REFUND"
        ? "DISPUTE_RESOLVED_REFUND"
        : "DISPUTE_RESOLVED_RELEASE"
    );

    if (!transition.valid) {
      throw new Error(transition.error || "Invalid transition");
    }

    // Update dispute
    await prisma.dispute.update({
      where: { id },
      data: {
        status: body.resolution,
        resolution_note: body.resolution_note,
        resolved_at: new Date(),
      },
    });

    // Update deal
    await prisma.deal.update({
      where: { id: dispute.deal_id },
      data: { status: transition.nextStatus! },
    });

    // If refund, also update payment
    if (body.resolution === "RESOLVED_REFUND") {
      const payment = await prisma.payment.findFirst({
        where: { deal_id: dispute.deal_id, status: "PAID" },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "REFUNDED" },
        });
      }
    }

    await prisma.dealEvent.create({
      data: {
        deal_id: dispute.deal_id,
        event_type: body.resolution,
        from_status: dispute.deal.status,
        to_status: transition.nextStatus!,
        created_by: admin.id,
      },
    });

    return { success: true, dispute };
  });

  // Get dispute details
  fastify.get("/:id", { preHandler: requireAuth() }, async (request) => {
    const user = request.user!;
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        deal: true,
        evidence: {
          include: {
            uploader: {
              select: {
                id: true,
                display_name: true,
              },
            },
          },
        },
        opener: {
          select: {
            id: true,
            display_name: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    // Check authorization
    if (
      dispute.opened_by !== user.id &&
      dispute.deal.seller_id !== user.id &&
      user.role !== "admin"
    ) {
      throw new Error("Forbidden");
    }

    return dispute;
  });
}
