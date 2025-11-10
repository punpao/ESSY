import { FastifyInstance } from "fastify";
import { CreateDealSchema, AddTrackingSchema, EscrowStateMachine, DealStatus } from "@thai-escrow/core";
import { prisma } from "../lib/prisma";
import { ulid } from "ulid";

export async function dealRoutes(fastify: FastifyInstance) {
  // Create deal (seller only)
  fastify.post(
    "/deals",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const user = request.user as { userId: string; role: string };
      const body = CreateDealSchema.parse(request.body);

      // Ensure user is a seller
      const userData = await prisma.user.findUnique({ where: { id: user.userId } });
      if (userData?.role !== "seller") {
        return reply.code(403).send({ error: "Only sellers can create deals" });
      }

      const paylinkToken = ulid().toLowerCase();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const deal = await prisma.deal.create({
        data: {
          title: body.title,
          amount_satang: body.amount_satang,
          currency: body.currency,
          seller_id: user.userId,
          status: DealStatus.PENDING,
          paylink_token: paylinkToken,
          expires_at: expiresAt,
          buyer_note: (body as any).buyer_note,
        },
      });

      // Log event
      await prisma.dealEvent.create({
        data: {
          deal_id: deal.id,
          event_type: "created",
          to_status: DealStatus.PENDING,
          actor_id: user.userId,
        },
      });

      const paylinkUrl = `${process.env.APP_BASE_URL}/pay/${paylinkToken}`;

      return reply.send({
        success: true,
        deal,
        paylink_url: paylinkUrl,
      });
    }
  );

  // Get deal by ID
  fastify.get(
    "/deals/:id",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as { userId: string; role: string };

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: {
          seller: { include: { seller_profile: true } },
          buyer: true,
          payments: true,
          disputes: { include: { evidence: true } },
        },
      });

      if (!deal) {
        return reply.code(404).send({ error: "Deal not found" });
      }

      // Auth check: only seller, buyer, or admin can view
      if (
        user.role !== "admin" &&
        deal.seller_id !== user.userId &&
        deal.buyer_id !== user.userId
      ) {
        return reply.code(403).send({ error: "Not authorized to view this deal" });
      }

      return reply.send({ deal });
    }
  );

  // Add tracking (seller only)
  fastify.post(
    "/deals/:id/ship",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as { userId: string; role: string };
      const body = AddTrackingSchema.parse(request.body);

      const deal = await prisma.deal.findUnique({ where: { id } });
      if (!deal) {
        return reply.code(404).send({ error: "Deal not found" });
      }

      if (deal.seller_id !== user.userId) {
        return reply.code(403).send({ error: "Only seller can add tracking" });
      }

      // Check state machine
      const context = {
        status: deal.status as any,
        buyer_id: deal.buyer_id,
        payment_paid: true,
        tracking_number: deal.tracking_number,
        delivered_at: deal.delivered_at,
        auto_release_at: deal.auto_release_at,
        has_open_dispute: false,
      };

      const result = EscrowStateMachine.transition(context, "SHIP");
      if (!result.success) {
        return reply.code(400).send({ error: result.error });
      }

      const deliveredAt = new Date();
      const autoReleaseHours = parseInt(process.env.AUTO_RELEASE_HOURS || "48");
      const autoReleaseAt = EscrowStateMachine.calculateAutoReleaseAt(deliveredAt, autoReleaseHours);

      const updatedDeal = await prisma.deal.update({
        where: { id },
        data: {
          status: result.newStatus,
          tracking_number: body.tracking_number,
          courier: body.courier,
          delivered_at: deliveredAt,
          auto_release_at: autoReleaseAt,
        },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: deal.id,
          event_type: "shipped",
          from_status: deal.status,
          to_status: result.newStatus!,
          actor_id: user.userId,
          metadata: JSON.stringify({ tracking: body.tracking_number, courier: body.courier }),
        },
      });

      return reply.send({ success: true, deal: updatedDeal });
    }
  );

  // Confirm receipt (buyer only)
  fastify.post(
    "/deals/:id/confirm",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as { userId: string; role: string };

      const deal = await prisma.deal.findUnique({
        where: { id },
        include: { disputes: { where: { status: "OPEN" } } },
      });

      if (!deal) {
        return reply.code(404).send({ error: "Deal not found" });
      }

      if (deal.buyer_id !== user.userId) {
        return reply.code(403).send({ error: "Only buyer can confirm receipt" });
      }

      const context = {
        status: deal.status as any,
        buyer_id: deal.buyer_id,
        payment_paid: true,
        tracking_number: deal.tracking_number,
        delivered_at: deal.delivered_at,
        auto_release_at: deal.auto_release_at,
        has_open_dispute: deal.disputes.length > 0,
      };

      const result = EscrowStateMachine.transition(context, "CONFIRM");
      if (!result.success) {
        return reply.code(400).send({ error: result.error });
      }

      const updatedDeal = await prisma.deal.update({
        where: { id },
        data: { status: result.newStatus },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: deal.id,
          event_type: "released",
          from_status: deal.status,
          to_status: result.newStatus!,
          actor_id: user.userId,
        },
      });

      // Add positive reputation event
      if (deal.seller_id) {
        const sellerProfile = await prisma.sellerProfile.findUnique({
          where: { user_id: deal.seller_id },
        });
        if (sellerProfile) {
          await prisma.reputationEvent.create({
            data: {
              seller_id: sellerProfile.id,
              type: "positive",
              weight: 1.0,
              note: `Deal ${deal.id} completed successfully`,
            },
          });
        }
      }

      return reply.send({ success: true, deal: updatedDeal });
    }
  );

  // Cancel deal (seller only, PENDING state)
  fastify.post(
    "/deals/:id/cancel",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as { userId: string; role: string };

      const deal = await prisma.deal.findUnique({ where: { id } });
      if (!deal) {
        return reply.code(404).send({ error: "Deal not found" });
      }

      if (deal.seller_id !== user.userId) {
        return reply.code(403).send({ error: "Only seller can cancel deal" });
      }

      if (deal.status !== DealStatus.PENDING) {
        return reply.code(400).send({ error: "Can only cancel pending deals" });
      }

      await prisma.deal.delete({ where: { id } });

      return reply.send({ success: true, message: "Deal cancelled" });
    }
  );
}
