import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../lib/auth";
import { validateTransition } from "@essy/core";

export async function adminRoutes(fastify: FastifyInstance) {
  // List deals with filters
  fastify.get("/deals", { preHandler: requireAuth(["admin"]) }, async (request) => {
    const { status, limit = "50", offset = "0" } = z
      .object({
        status: z.string().optional(),
        limit: z.string().optional(),
        offset: z.string().optional(),
      })
      .parse(request.query);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const deals = await prisma.deal.findMany({
      where,
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
          take: 1,
          orderBy: { created_at: "desc" },
        },
        disputes: {
          where: { status: "OPEN" },
        },
      },
      orderBy: { created_at: "desc" },
      take: parseInt(limit, 10),
      skip: parseInt(offset, 10),
    });

    return { deals, count: deals.length };
  });

  // List disputes
  fastify.get("/disputes", { preHandler: requireAuth(["admin"]) }, async (request) => {
    const { status, limit = "50", offset = "0" } = z
      .object({
        status: z.string().optional(),
        limit: z.string().optional(),
        offset: z.string().optional(),
      })
      .parse(request.query);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        deal: {
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
          },
        },
        evidence: true,
        opener: {
          select: {
            id: true,
            display_name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: parseInt(limit, 10),
      skip: parseInt(offset, 10),
    });

    return { disputes, count: disputes.length };
  });

  // Force release deal
  fastify.post("/deals/:id/release", { preHandler: requireAuth(["admin"]) }, async (request) => {
    const admin = request.user!;
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      throw new Error("Deal not found");
    }

    const transition = validateTransition(deal.status, "DISPUTE_RESOLVED_RELEASE");
    if (!transition.valid) {
      // Try auto-release transition
      const autoTransition = validateTransition(deal.status, "AUTO_RELEASE_TRIGGERED");
      if (!autoTransition.valid) {
        throw new Error("Cannot release deal in current state");
      }

      await prisma.deal.update({
        where: { id },
        data: { status: autoTransition.nextStatus! },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: id,
          event_type: "AUTO_RELEASE_TRIGGERED",
          from_status: deal.status,
          to_status: autoTransition.nextStatus!,
          created_by: admin.id,
          metadata: { forced: true },
        },
      });

      return { success: true, deal: { ...deal, status: autoTransition.nextStatus! } };
    }

    await prisma.deal.update({
      where: { id },
      data: { status: transition.nextStatus! },
    });

    await prisma.dealEvent.create({
      data: {
        deal_id: id,
        event_type: "DISPUTE_RESOLVED_RELEASE",
        from_status: deal.status,
        to_status: transition.nextStatus!,
        created_by: admin.id,
        metadata: { forced: true },
      },
    });

    return { success: true, deal: { ...deal, status: transition.nextStatus! } };
  });
}
