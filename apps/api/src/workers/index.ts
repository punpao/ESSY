import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "../lib/prisma";
import { validateTransition } from "@essy/core";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");

// Auto-release queue
export const autoReleaseQueue = new Queue("auto-release", { connection });

// Reputation queue
export const reputationQueue = new Queue("reputation", { connection });

export function startWorkers() {
  // Auto-release worker
  const autoReleaseWorker = new Worker(
    "auto-release",
    async (job) => {
      const { dealId } = job.data;

      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: {
          disputes: {
            where: { status: "OPEN" },
          },
        },
      });

      if (!deal) {
        return { success: false, error: "Deal not found" };
      }

      // Check if there's an open dispute
      if (deal.disputes.length > 0) {
        return { success: false, error: "Open dispute exists" };
      }

      // Check if auto_release_at has passed
      if (!deal.auto_release_at || deal.auto_release_at > new Date()) {
        return { success: false, error: "Auto-release time not reached" };
      }

      // Only auto-release if status is SHIPPED
      if (deal.status !== "SHIPPED") {
        return { success: false, error: "Deal not in SHIPPED status" };
      }

      const transition = validateTransition(deal.status, "AUTO_RELEASE_TRIGGERED");
      if (!transition.valid) {
        return { success: false, error: transition.error };
      }

      await prisma.deal.update({
        where: { id: dealId },
        data: { status: transition.nextStatus! },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: dealId,
          event_type: "AUTO_RELEASE_TRIGGERED",
          from_status: deal.status,
          to_status: transition.nextStatus!,
          metadata: { auto: true },
        },
      });

      return { success: true, dealId, newStatus: transition.nextStatus };
    },
    { connection }
  );

  // Reputation calculation worker
  const reputationWorker = new Worker(
    "reputation",
    async (job) => {
      const { sellerId } = job.data;

      const seller = await prisma.sellerProfile.findUnique({
        where: { user_id: sellerId },
        include: {
          reputation_events: {
            orderBy: { created_at: "desc" },
          },
          deals: {
            where: {
              status: {
                in: ["RELEASED", "REFUND"],
              },
            },
          },
        },
      });

      if (!seller) {
        return { success: false, error: "Seller not found" };
      }

      // Calculate reputation score
      // Simple weighted sum: released deals +0.3, disputes -1.0
      let score = 0;
      const releasedCount = seller.deals.filter((d) => d.status === "RELEASED").length;
      const refundedCount = seller.deals.filter((d) => d.status === "REFUND").length;

      score = releasedCount * 0.3 - refundedCount * 1.0;

      // Apply sigmoid normalization (optional)
      const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
      const normalizedScore = sigmoid(score) * 100; // Scale to 0-100

      await prisma.sellerProfile.update({
        where: { user_id: sellerId },
        data: { reputation_score: normalizedScore },
      });

      return { success: true, sellerId, score: normalizedScore };
    },
    { connection }
  );

  // Scheduled job: Check for deals that need auto-release
  setInterval(async () => {
    const deals = await prisma.deal.findMany({
      where: {
        status: "SHIPPED",
        auto_release_at: {
          lte: new Date(),
        },
        disputes: {
          none: {
            status: "OPEN",
          },
        },
      },
    });

    for (const deal of deals) {
      await autoReleaseQueue.add("check-auto-release", { dealId: deal.id });
    }
  }, 15 * 60 * 1000); // Every 15 minutes

  console.log("✅ Background workers started");
}
