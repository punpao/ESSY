import { FastifyInstance } from "fastify";
import { OpenDisputeSchema, ResolveDisputeSchema, UploadEvidenceSchema } from "@thai-escrow/core";
import { prisma } from "../lib/prisma";
import { requireRole } from "../lib/jwt";

export async function disputeRoutes(fastify: FastifyInstance) {
  // Open dispute (buyer only)
  fastify.post(
    "/disputes/:dealId/open",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { dealId } = request.params as { dealId: string };
      const user = request.user as { userId: string; role: string };
      const body = OpenDisputeSchema.parse(request.body);

      const deal = await prisma.deal.findUnique({ where: { id: dealId } });
      if (!deal) {
        return reply.code(404).send({ error: "Deal not found" });
      }

      if (deal.buyer_id !== user.userId) {
        return reply.code(403).send({ error: "Only buyer can open dispute" });
      }

      if (deal.status !== "HOLD" && deal.status !== "SHIPPED") {
        return reply.code(400).send({ error: "Cannot dispute deal in current state" });
      }

      // Check if dispute already exists
      const existing = await prisma.dispute.findFirst({
        where: { deal_id: dealId, status: { in: ["OPEN", "NEED_MORE_INFO"] } },
      });

      if (existing) {
        return reply.code(400).send({ error: "Dispute already open for this deal" });
      }

      const dispute = await prisma.dispute.create({
        data: {
          deal_id: dealId,
          opened_by: user.userId,
          reason: body.reason,
          reason_text: body.reason_text,
          status: "OPEN",
        },
      });

      // Update deal status
      await prisma.deal.update({
        where: { id: dealId },
        data: { status: "DISPUTE" },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: dealId,
          event_type: "disputed",
          from_status: deal.status,
          to_status: "DISPUTE",
          actor_id: user.userId,
        },
      });

      // Add negative reputation event
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { user_id: deal.seller_id },
      });
      if (sellerProfile) {
        await prisma.reputationEvent.create({
          data: {
            seller_id: sellerProfile.id,
            type: "negative",
            weight: -0.5,
            note: `Dispute opened for deal ${dealId}`,
          },
        });
      }

      return reply.send({ success: true, dispute });
    }
  );

  // Upload evidence
  fastify.post(
    "/disputes/:id/evidence",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as { userId: string; role: string };
      const body = UploadEvidenceSchema.parse(request.body);

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: { deal: true },
      });

      if (!dispute) {
        return reply.code(404).send({ error: "Dispute not found" });
      }

      // Only buyer or seller can upload evidence
      if (
        user.userId !== dispute.opened_by &&
        user.userId !== dispute.deal.seller_id &&
        user.role !== "admin"
      ) {
        return reply.code(403).send({ error: "Not authorized" });
      }

      const evidence = await prisma.evidence.create({
        data: {
          dispute_id: id,
          uploaded_by: user.userId,
          kind: body.kind,
          url: body.url,
          note: body.note,
        },
      });

      return reply.send({ success: true, evidence });
    }
  );

  // Resolve dispute (admin only)
  fastify.post(
    "/disputes/:id/resolve",
    {
      onRequest: [
        fastify.authenticate,
        async (request) => await requireRole(["admin"])(request),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as { userId: string; role: string };
      const body = ResolveDisputeSchema.parse(request.body);

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: { deal: true },
      });

      if (!dispute) {
        return reply.code(404).send({ error: "Dispute not found" });
      }

      if (dispute.status !== "OPEN" && dispute.status !== "NEED_MORE_INFO") {
        return reply.code(400).send({ error: "Dispute already resolved" });
      }

      const newDisputeStatus =
        body.resolution === "refund" ? "RESOLVED_REFUND" : "RESOLVED_RELEASE";
      const newDealStatus = body.resolution === "refund" ? "REFUND" : "RELEASED";

      // Update dispute
      await prisma.dispute.update({
        where: { id },
        data: {
          status: newDisputeStatus,
          resolution_note: body.resolution_note,
          resolved_at: new Date(),
        },
      });

      // Update deal
      await prisma.deal.update({
        where: { id: dispute.deal_id },
        data: { status: newDealStatus },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: dispute.deal_id,
          event_type: body.resolution === "refund" ? "refunded" : "released",
          from_status: "DISPUTE",
          to_status: newDealStatus,
          actor_id: user.userId,
          metadata: JSON.stringify({ resolution: body.resolution, note: body.resolution_note }),
        },
      });

      // Handle refund if needed
      if (body.resolution === "refund") {
        const payment = await prisma.payment.findFirst({
          where: { deal_id: dispute.deal_id, status: "PAID" },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "REFUNDED",
              refunded_at: new Date(),
            },
          });
        }
      }

      return reply.send({
        success: true,
        message: `Dispute resolved: ${body.resolution}`,
      });
    }
  );

  // Get dispute by ID
  fastify.get(
    "/disputes/:id",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as { userId: string; role: string };

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: {
          deal: { include: { seller: true, buyer: true } },
          evidence: { include: { user: true }, orderBy: { created_at: "desc" } },
        },
      });

      if (!dispute) {
        return reply.code(404).send({ error: "Dispute not found" });
      }

      // Auth check
      if (
        user.role !== "admin" &&
        user.userId !== dispute.opened_by &&
        user.userId !== dispute.deal.seller_id
      ) {
        return reply.code(403).send({ error: "Not authorized" });
      }

      return reply.send({ dispute });
    }
  );
}
