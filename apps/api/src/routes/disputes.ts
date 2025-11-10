import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../config/database";
import { authenticate, requireRole } from "../middleware/auth";
import { EscrowStateMachine } from "@essy/core";
import { logDealEvent } from "../utils/dealEvents";

const openDisputeSchema = z.object({
  dealId: z.string(),
  reasonText: z.string().min(10),
});

const addEvidenceSchema = z.object({
  url: z.string().url(),
  kind: z.enum(["image", "chatlog", "other"]),
  note: z.string().optional(),
});

const resolveDisputeSchema = z.object({
  resolution: z.enum(["RESOLVED_REFUND", "RESOLVED_RELEASE"]),
  resolutionNote: z.string().min(1),
});

export async function disputesRoutes(fastify: FastifyInstance) {
  // Open dispute
  fastify.post(
    "/disputes/:dealId/open",
    { preHandler: [authenticate, requireRole("buyer", "admin")] },
    async (request, reply) => {
      const { dealId } = request.params as { dealId: string };
      const userId = request.user!.id;
      const { reasonText } = openDisputeSchema.parse(request.body);

      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
      });

      if (!deal) {
        reply.code(404).send({ error: "Deal not found" });
        return;
      }

      if (deal.buyerId !== userId && request.user!.role !== "admin") {
        reply.code(403).send({ error: "Forbidden" });
        return;
      }

      // Check if dispute already exists
      const existing = await prisma.dispute.findFirst({
        where: { dealId, status: "OPEN" },
      });

      if (existing) {
        reply.code(400).send({ error: "Dispute already open" });
        return;
      }

      // Validate transition
      if (!EscrowStateMachine.canTransition(deal.status, "DISPUTE")) {
        reply.code(400).send({ error: `Cannot open dispute in status ${deal.status}` });
        return;
      }

      // Create dispute
      const dispute = await prisma.dispute.create({
        data: {
          dealId,
          openedBy: userId,
          reasonText,
          status: "OPEN",
        },
      });

      // Update deal status
      await prisma.deal.update({
        where: { id: dealId },
        data: { status: "DISPUTE" },
      });

      await logDealEvent(dealId, "DISPUTE_OPENED", deal.status, "DISPUTE", {
        disputeId: dispute.id,
      });

      return dispute;
    }
  );

  // Add evidence
  fastify.post(
    "/disputes/:id/evidence",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.id;
      const { url, kind, note } = addEvidenceSchema.parse(request.body);

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: { deal: true },
      });

      if (!dispute) {
        reply.code(404).send({ error: "Dispute not found" });
        return;
      }

      // Check access
      if (
        dispute.openedBy !== userId &&
        dispute.deal.sellerId !== userId &&
        request.user!.role !== "admin"
      ) {
        reply.code(403).send({ error: "Forbidden" });
        return;
      }

      const evidence = await prisma.evidence.create({
        data: {
          disputeId: id,
          uploadedBy: userId,
          url,
          kind,
          note: note || null,
        },
      });

      return evidence;
    }
  );

  // Resolve dispute (admin only)
  fastify.post(
    "/disputes/:id/resolve",
    { preHandler: [authenticate, requireRole("admin")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { resolution, resolutionNote } = resolveDisputeSchema.parse(request.body);

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: { deal: true },
      });

      if (!dispute) {
        reply.code(404).send({ error: "Dispute not found" });
        return;
      }

      if (dispute.status !== "OPEN" && dispute.status !== "NEED_MORE_INFO") {
        reply.code(400).send({ error: "Dispute already resolved" });
        return;
      }

      // Update dispute
      await prisma.dispute.update({
        where: { id },
        data: {
          status: resolution,
          resolutionNote,
          resolvedAt: new Date(),
        },
      });

      // Update deal and payment
      const targetStatus = resolution === "RESOLVED_REFUND" ? "REFUND" : "RELEASED";

      if (EscrowStateMachine.canTransition(dispute.deal.status, targetStatus)) {
        await prisma.deal.update({
          where: { id: dispute.dealId },
          data: { status: targetStatus },
        });

        if (targetStatus === "REFUND") {
          // Refund payment
          const payment = await prisma.payment.findFirst({
            where: { dealId: dispute.dealId, status: "PAID" },
          });

          if (payment) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: "REFUNDED" },
            });
          }
        }

        await logDealEvent(dispute.dealId, "DISPUTE_RESOLVED", dispute.deal.status, targetStatus, {
          disputeId: id,
          resolution,
        });
      }

      return { success: true, dispute };
    }
  );
}
