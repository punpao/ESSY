import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { config } from "dotenv";
import { prisma } from "../lib/prisma";
import { EscrowStateMachine } from "@thai-escrow/core";

config();

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// Create queue
export const autoReleaseQueue = new Queue("auto-release", { connection });

// Worker to process auto-release
const worker = new Worker(
  "auto-release",
  async (job) => {
    console.log(`[AutoRelease] Processing job ${job.id}`);

    // Find deals that should be auto-released
    const now = new Date();
    const dealsToRelease = await prisma.deal.findMany({
      where: {
        status: { in: ["HOLD", "SHIPPED"] },
        auto_release_at: {
          lte: now,
        },
      },
      include: {
        disputes: {
          where: {
            status: { in: ["OPEN", "NEED_MORE_INFO"] },
          },
        },
      },
    });

    console.log(`[AutoRelease] Found ${dealsToRelease.length} deals eligible for auto-release`);

    for (const deal of dealsToRelease) {
      // Skip if there's an open dispute
      if (deal.disputes.length > 0) {
        console.log(`[AutoRelease] Skipping deal ${deal.id} - has open dispute`);
        continue;
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

      const result = EscrowStateMachine.transition(context, "AUTO_RELEASE");
      if (!result.success) {
        console.log(`[AutoRelease] Cannot auto-release deal ${deal.id}: ${result.error}`);
        continue;
      }

      // Update deal
      await prisma.deal.update({
        where: { id: deal.id },
        data: { status: result.newStatus },
      });

      // Log event
      await prisma.dealEvent.create({
        data: {
          deal_id: deal.id,
          event_type: "auto_released",
          from_status: deal.status,
          to_status: result.newStatus!,
          metadata: JSON.stringify({ auto: true }),
        },
      });

      // Add positive reputation
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
              note: `Deal ${deal.id} auto-released`,
            },
          });

          // Recalculate reputation score
          const events = await prisma.reputationEvent.findMany({
            where: { seller_id: sellerProfile.id },
          });

          const score = calculateReputationScore(events);

          await prisma.sellerProfile.update({
            where: { id: sellerProfile.id },
            data: { reputation_score: score },
          });
        }
      }

      console.log(`[AutoRelease] ✅ Deal ${deal.id} auto-released`);
    }

    return { processed: dealsToRelease.length };
  },
  {
    connection,
    concurrency: 1,
  }
);

worker.on("completed", (job) => {
  console.log(`[AutoRelease] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[AutoRelease] Job ${job?.id} failed:`, err);
});

// Schedule recurring job (every 15 minutes)
async function scheduleAutoRelease() {
  await autoReleaseQueue.add(
    "check-auto-release",
    {},
    {
      repeat: {
        pattern: "*/15 * * * *", // Every 15 minutes
      },
    }
  );
  console.log("[AutoRelease] Scheduled recurring job (every 15 minutes)");
}

/**
 * Calculate reputation score using sigmoid function
 * score = sigmoid(#released * 0.3 - #disputes * 1.0)
 */
function calculateReputationScore(
  events: Array<{ type: string; weight: number }>
): number {
  const totalWeight = events.reduce((sum, e) => {
    if (e.type === "positive") return sum + e.weight * 0.3;
    if (e.type === "negative") return sum + e.weight * 1.0;
    return sum;
  }, 0);

  // Sigmoid: 1 / (1 + e^(-x))
  // Scale to 0-5 stars
  const sigmoid = 1 / (1 + Math.exp(-totalWeight));
  return Math.round(sigmoid * 5 * 10) / 10; // Round to 1 decimal
}

// Start worker
if (require.main === module) {
  console.log("🔄 Starting auto-release worker...");
  scheduleAutoRelease().catch(console.error);
}

export { worker };
