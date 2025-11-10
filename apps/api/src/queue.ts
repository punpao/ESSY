import { Queue, Worker } from "bullmq";
import { config } from "./config";
import { prisma } from "./db";
import { transitionEscrowState } from "@essy/core";
import type { EscrowEvent } from "@essy/core";

const connection = {
  host: new URL(config.redisUrl).hostname,
  port: parseInt(new URL(config.redisUrl).port || "6379", 10),
};

export const autoReleaseQueue = new Queue("auto-release", { connection });

export function startWorkers() {
  // Auto-release worker
  const autoReleaseWorker = new Worker(
    "auto-release",
    async (job) => {
      const { dealId } = job.data;
      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: { payments: true },
      });

      if (!deal) {
        throw new Error(`Deal ${dealId} not found`);
      }

      if (deal.status !== "SHIPPED") {
        return; // Not in shipped state
      }

      if (deal.auto_release_at && new Date() >= deal.auto_release_at) {
        const hasPayment = deal.payments.some((p) => p.status === "PAID");
        const isDelivered = deal.delivered_at !== null;
        const hasOpenDispute = await prisma.dispute.findFirst({
          where: { deal_id: dealId, status: "OPEN" },
        });

        const context = {
          status: deal.status as any,
          hasPayment,
          hasTracking: !!deal.tracking_number,
          isDelivered,
          hasOpenDispute: !!hasOpenDispute,
          canAutoRelease: true,
        };

        const event: EscrowEvent = { type: "AUTO_RELEASE_TRIGGERED" };
        const newStatus = transitionEscrowState(deal.status as any, event, context);

        if (newStatus === "RELEASED") {
          await prisma.deal.update({
            where: { id: dealId },
            data: { status: newStatus, updated_at: new Date() },
          });
        }
      }
    },
    { connection }
  );

  // Reputation calculation worker
  const reputationWorker = new Worker(
    "reputation",
    async (job) => {
      const { sellerId } = job.data;
      const events = await prisma.reputationEvent.findMany({
        where: { seller_id: sellerId },
      });

      // Simple weighted sum
      let score = 0;
      for (const event of events) {
        score += event.weight;
      }

      // Sigmoid normalization (0-100 scale)
      const normalized = 100 / (1 + Math.exp(-score * 0.1));

      await prisma.sellerProfile.update({
        where: { user_id: sellerId },
        data: { reputation_score: normalized },
      });
    },
    { connection }
  );

  return { autoReleaseWorker, reputationWorker };
}
