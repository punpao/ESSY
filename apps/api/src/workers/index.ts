import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { prisma } from "../lib/prisma";
import { validateTransition, calculateAutoReleaseAt } from "@essy/core";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Auto-release queue
export const autoReleaseQueue = new Queue("auto-release", {
  connection: redis,
});

// Reputation queue
export const reputationQueue = new Queue("reputation", {
  connection: redis,
});

export function startWorkers() {
  // Auto-release worker: checks deals that should auto-release
  const autoReleaseWorker = new Worker(
    "auto-release",
    async (job) => {
      const now = new Date();

      // Find deals that should auto-release
      const deals = await prisma.deal.findMany({
        where: {
          status: { in: ["SHIPPED"] },
          autoReleaseAt: { lte: now },
          disputes: { none: { status: "OPEN" } },
        },
        include: { payment: true },
      });

      for (const deal of deals) {
        const validation = validateTransition(deal.status, "RELEASED", {
          status: deal.status,
          paymentStatus: deal.payment?.status,
          deliveredAt: deal.deliveredAt,
          autoReleaseAt: deal.autoReleaseAt,
        });

        if (validation.valid) {
          await prisma.deal.update({
            where: { id: deal.id },
            data: { status: "RELEASED" },
          });

          await prisma.dealEvent.create({
            data: {
              dealId: deal.id,
              eventType: "AUTO_RELEASED",
              metadata: { autoReleaseAt: deal.autoReleaseAt },
            },
          });

          // Update reputation
          const { updateSellerReputation } = await import("../lib/updateReputation");
          await updateSellerReputation(deal.sellerId);
        }
      }
    },
    { connection: redis }
  );

  // Reputation worker
  const reputationWorker = new Worker(
    "reputation",
    async (job) => {
      const { sellerId } = job.data;
      const { updateSellerReputation } = await import("../lib/updateReputation");
      await updateSellerReputation(sellerId);
    },
    { connection: redis }
  );

  // Schedule auto-release check every 15 minutes
  setInterval(async () => {
    await autoReleaseQueue.add("check-auto-release", {}, { repeat: { every: 15 * 60 * 1000 } });
  }, 15 * 60 * 1000);

  console.log("✅ Background workers started");
}
