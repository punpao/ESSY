import { FastifyInstance } from "fastify";
import { z } from "zod";
import { ulid } from "ulid";
import { prisma } from "../db";
import { authenticate, requireRole } from "../auth";
import { transitionEscrowState } from "@essy/core";
import type { EscrowEvent } from "@essy/core";

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
  resolution_note: z.string().optional(),
});

export async function disputeRoutes(fastify: FastifyInstance) {
  // List disputes (for buyer or admin)
  fastify.get(
    "/disputes",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { dealId } = z.object({ dealId: z.string().optional() }).parse(request.query);
      const where: any = {};
      if (dealId) {
        where.deal_id = dealId;
      }
      if (request.user!.role !== "admin") {
        where.opened_by = request.user!.id;
      }

      const disputes = await prisma.dispute.findMany({
        where,
        include: {
          deal: true,
          evidence: true,
        },
        orderBy: { created_at: "desc" },
      });

      return { disputes };
    }
  );

  // Open dispute
  fastify.post(
    "/disputes/:dealId/open",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { dealId } = z.object({ dealId: z.string() }).parse(request.params);
      const { reason_text } = openDisputeSchema.parse(request.body);

      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: { payments: true, disputes: true },
      });

      if (!deal) {
        return reply.status(404).send({ error: "Deal not found" });
      }

      if (deal.buyer_id !== request.user!.id && request.user!.role !== "admin") {
        return reply.status(403).send({ error: "Only buyer can open dispute" });
      }

      const hasOpenDispute = deal.disputes.some((d) => d.status === "OPEN");
      if (hasOpenDispute) {
        return reply.status(400).send({ error: "Dispute already open" });
      }

      const dispute = await prisma.dispute.create({
        data: {
          id: ulid(),
          deal_id: dealId,
          opened_by: request.user!.id,
          reason_text,
          status: "OPEN",
        },
      });

      // Transition deal to DISPUTE
      const hasPayment = deal.payments.some((p) => p.status === "PAID");
      const context = {
        status: deal.status as any,
        hasPayment,
        hasTracking: !!deal.tracking_number,
        isDelivered: !!deal.delivered_at,
        hasOpenDispute: true,
        canAutoRelease: false,
      };

      const event: EscrowEvent = { type: "DISPUTE_OPENED" };
      const newStatus = transitionEscrowState(deal.status as any, event, context);

      if (newStatus) {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: newStatus, updated_at: new Date() },
        });
      }

      return dispute;
    }
  );

  // Add evidence
  fastify.post(
    "/disputes/:id/evidence",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const data = addEvidenceSchema.parse(request.body);

      const dispute = await prisma.dispute.findUnique({
        where: { id },
      });

      if (!dispute) {
        return reply.status(404).send({ error: "Dispute not found" });
      }

      // Check access
      if (
        dispute.opened_by !== request.user!.id &&
        request.user!.role !== "admin"
      ) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const evidence = await prisma.evidence.create({
        data: {
          id: ulid(),
          dispute_id: id,
          uploaded_by: request.user!.id,
          url: data.url,
          kind: data.kind,
          note: data.note,
        },
      });

      return evidence;
    }
  );

  // Resolve dispute (admin only)
  fastify.post(
    "/disputes/:id/resolve",
    { preHandler: [authenticate, requireRole(["admin"])] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const { resolution, resolution_note } = resolveDisputeSchema.parse(request.body);

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: { deal: { include: { payments: true } } },
      });

      if (!dispute) {
        return reply.status(404).send({ error: "Dispute not found" });
      }

      const deal = dispute.deal;
      const hasPayment = deal.payments.some((p) => p.status === "PAID");
      const context = {
        status: deal.status as any,
        hasPayment,
        hasTracking: !!deal.tracking_number,
        isDelivered: !!deal.delivered_at,
        hasOpenDispute: true,
        canAutoRelease: false,
      };

      const event: EscrowEvent =
        resolution === "RESOLVED_REFUND"
          ? { type: "ADMIN_RESOLVED_REFUND" }
          : { type: "ADMIN_RESOLVED_RELEASE" };

      const newStatus = transitionEscrowState(deal.status as any, event, context);

      if (!newStatus) {
        return reply.status(400).send({ error: "Invalid state transition" });
      }

      // Update dispute
      await prisma.dispute.update({
        where: { id },
        data: {
          status: resolution,
          resolution_note,
          resolved_at: new Date(),
        },
      });

      // Update deal
      await prisma.deal.update({
        where: { id: deal.id },
        data: { status: newStatus, updated_at: new Date() },
      });

      // If refund, also update payment
      if (resolution === "RESOLVED_REFUND") {
        const payment = deal.payments.find((p) => p.status === "PAID");
        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: "REFUNDED" },
          });
        }
      }

      return { success: true, dispute, deal };
    }
  );
}
