import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireRole } from "../lib/auth";
import { validateTransition } from "@essy/core";

const OpenDisputeSchema = z.object({
  reasonText: z.string().min(10),
});

const AddEvidenceSchema = z.object({
  url: z.string().url(),
  kind: z.enum(["image", "chatlog", "other"]),
  note: z.string().optional(),
});

const ResolveDisputeSchema = z.object({
  resolution: z.enum(["RESOLVED_REFUND", "RESOLVED_RELEASE"]),
  resolutionNote: z.string().optional(),
});

export async function disputeRoutes(fastify: FastifyInstance) {
  // Open dispute (buyer only)
  fastify.post(
    "/:dealId/open",
    { preHandler: requireRole("buyer", "admin") },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { dealId } = z.object({ dealId: z.string() }).parse(request.params);
      const data = OpenDisputeSchema.parse(request.body);

      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: { payment: true, disputes: { where: { status: "OPEN" } } },
      });

      if (!deal) {
        return reply.status(404).send({ error: "Deal not found" });
      }

      if (deal.buyerId !== user.id && user.role !== "admin") {
        return reply.status(403).send({ error: "Forbidden" });
      }

      if (deal.disputes.length > 0) {
        return reply.status(400).send({ error: "Dispute already open" });
      }

      const validation = validateTransition(deal.status, "DISPUTE", {
        status: deal.status,
        paymentStatus: deal.payment?.status,
        hasOpenDispute: false,
      });

      if (!validation.valid) {
        return reply.status(400).send({ error: validation.reason });
      }

      const dispute = await prisma.dispute.create({
        data: {
          dealId: deal.id,
          openedBy: user.id,
          reasonText: data.reasonText,
          status: "OPEN",
        },
      });

      await prisma.deal.update({
        where: { id: dealId },
        data: { status: "DISPUTE" },
      });

      await prisma.dealEvent.create({
        data: {
          dealId: deal.id,
          eventType: "DISPUTE_OPENED",
          metadata: { disputeId: dispute.id, reason: data.reasonText },
        },
      });

      return dispute;
    }
  );

  // Add evidence to dispute
  fastify.post(
    "/:id/evidence",
    { preHandler: requireRole("buyer", "seller", "admin") },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const data = AddEvidenceSchema.parse(request.body);

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: { dealRef: true },
      });

      if (!dispute) {
        return reply.status(404).send({ error: "Dispute not found" });
      }

      // Check access
      if (
        user.role !== "admin" &&
        dispute.openedBy !== user.id &&
        dispute.dealRef.sellerId !== user.id
      ) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const evidence = await prisma.evidence.create({
        data: {
          disputeId: dispute.id,
          uploadedBy: user.id,
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
    "/:id/resolve",
    { preHandler: requireRole("admin") },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const data = ResolveDisputeSchema.parse(request.body);

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: { dealRef: { include: { payment: true } } },
      });

      if (!dispute) {
        return reply.status(404).send({ error: "Dispute not found" });
      }

      if (dispute.status !== "OPEN" && dispute.status !== "NEED_MORE_INFO") {
        return reply.status(400).send({ error: "Dispute already resolved" });
      }

      const dealStatus = data.resolution === "RESOLVED_REFUND" ? "REFUND" : "RELEASED";

      await prisma.dispute.update({
        where: { id },
        data: {
          status: data.resolution,
          resolutionNote: data.resolutionNote,
          resolvedAt: new Date(),
        },
      });

      await prisma.deal.update({
        where: { id: dispute.dealId },
        data: { status: dealStatus },
      });

      if (data.resolution === "RESOLVED_REFUND" && dispute.dealRef.payment) {
        await prisma.payment.update({
          where: { id: dispute.dealRef.payment.id },
          data: { status: "REFUNDED" },
        });
      }

      await prisma.dealEvent.create({
        data: {
          dealId: dispute.dealId,
          eventType: "DISPUTE_RESOLVED",
          metadata: { disputeId: dispute.id, resolution: data.resolution },
        },
      });

      return { success: true };
    }
  );
}
