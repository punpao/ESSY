import { Queue, Worker } from "bullmq";
import { redis } from "../config/redis";
import { prisma } from "../config/database";
import { EscrowStateMachine } from "@essy/core";
import { logDealEvent } from "../utils/dealEvents";
import { getEnv } from "../config/env";

// Auto-release queue
export const autoReleaseQueue = new Queue("auto-release", {
  connection: redis,
});

// Reputation queue
export const reputationQueue = new Queue("reputation", {
  connection: redis,
});

export function startWorkers() {
  // Auto-release worker
  const autoReleaseWorker = new Worker(
    "auto-release",
    async (job) => {
      const { dealId } = job.data;

      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: { disputes: { where: { status: "OPEN" } } },
      });

      if (!deal) {
        return { success: false, reason: "Deal not found" };
      }

      // Check if can auto-release
      if (
        deal.status === "SHIPPED" &&
        deal.autoReleaseAt &&
        new Date() >= deal.autoReleaseAt &&
        deal.disputes.length === 0
      ) {
        if (EscrowStateMachine.canTransition(deal.status, "RELEASED")) {
          await prisma.deal.update({
            where: { id: dealId },
            data: { status: "RELEASED" },
          });

          await logDealEvent(dealId, "AUTO_RELEASED", deal.status, "RELEASED");

          // Update reputation
          await reputationQueue.add("update-reputation", {
            sellerId: deal.sellerId,
          });

          return { success: true, dealId, status: "RELEASED" };
        }
      }

      return { success: false, reason: "Cannot auto-release" };
    },
    { connection: redis }
  );

  // Reputation worker
  const reputationWorker = new Worker(
    "reputation",
    async (job) => {
      const { sellerId } = job.data;

      const events = await prisma.reputationEvent.findMany({
        where: { sellerId },
      });

      const score = events.reduce((sum, event) => {
        const weight = event.type === "positive" ? 0.3 : event.type === "negative" ? -1.0 : 0;
        return sum + event.weight * weight;
      }, 0);

      // Sigmoid normalization
      const normalizedScore = 1 / (1 + Math.exp(-score / 10));

      await prisma.sellerProfile.updateMany({
        where: { userId: sellerId },
        data: { reputationScore: normalizedScore },
      });

      return { success: true, sellerId, score: normalizedScore };
    },
    { connection: redis }
  );

  // Schedule auto-release check every 15 minutes
  setInterval(async () => {
    const deals = await prisma.deal.findMany({
      where: {
        status: "SHIPPED",
        autoReleaseAt: { lte: new Date() },
      },
      include: {
        disputes: { where: { status: "OPEN" } },
      },
    });

    for (const deal of deals) {
      if (deal.disputes.length === 0) {
        await autoReleaseQueue.add("check-auto-release", { dealId: deal.id });
      }
    }
  }, 15 * 60 * 1000); // 15 minutes

  console.log("✅ Workers started");
}
