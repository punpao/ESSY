import fp from "fastify-plugin";
import { Queue, Worker, QueueScheduler } from "bullmq";
import IORedis from "ioredis";
import { transition } from "@escrow/core";
import { prisma } from "../lib/prisma";
import { logDealEvent } from "../utils/dealEvents";
import { recordReputationEvent } from "../utils/reputation";

export type JobManager = {
  enqueueAutoReleaseScan(): Promise<void>;
  enqueueReputation(sellerUserId: string): Promise<void>;
};

declare module "fastify" {
  interface FastifyInstance {
    jobs: JobManager;
  }
}

type JobPayloads = {
  "auto-release-scan": {};
  "recalculate-reputation": { sellerUserId: string };
};

export default fp(async (fastify) => {
  const connection = new IORedis(fastify.config.REDIS_URL);
  const queueName = "escrow-jobs";
  const queue = new Queue<JobPayloads[keyof JobPayloads]>(queueName, { connection });
  const scheduler = new QueueScheduler(queueName, { connection });

  const worker = new Worker<JobPayloads[keyof JobPayloads]>(
    queueName,
    async (job) => {
      switch (job.name as keyof JobPayloads) {
        case "auto-release-scan": {
          const now = new Date();
          const candidates = await prisma.deal.findMany({
            where: {
              status: "SHIPPED",
              autoReleaseAt: {
                not: null,
                lte: now
              }
            },
            include: {
              dispute: true
            }
          });

          for (const deal of candidates) {
            const hasOpenDispute =
              deal.dispute &&
              (deal.dispute.status === "OPEN" || deal.dispute.status === "NEED_MORE_INFO");
            if (hasOpenDispute) {
              continue;
            }

            const nextStatus = transition(deal.status, { type: "AUTO_RELEASE" });
            await prisma.deal.update({
              where: { id: deal.id },
              data: {
                status: nextStatus,
                autoReleaseAt: null,
                deliveredAt: deal.deliveredAt ?? now
              }
            });

            await logDealEvent(prisma, {
              dealId: deal.id,
              type: "deal.auto_released",
              payload: { at: now.toISOString() }
            });

            await recordReputationEvent({
              prisma,
              sellerUserId: deal.sellerId,
              type: "positive",
              weight: 0.7,
              note: "Auto release after delivery window"
            });

            await queue.add(
              "recalculate-reputation",
              { sellerUserId: deal.sellerId },
              {
                jobId: `reputation-${deal.sellerId}`,
                removeOnComplete: true,
                removeOnFail: false
              }
            );
          }
          break;
        }
        case "recalculate-reputation": {
          const { sellerUserId } = job.data as JobPayloads["recalculate-reputation"];
          const released = await prisma.deal.count({
            where: { sellerId: sellerUserId, status: "RELEASED" }
          });
          const refunds = await prisma.deal.count({
            where: { sellerId: sellerUserId, status: "REFUND" }
          });
          const openDisputes = await prisma.dispute.count({
            where: {
              deal: { sellerId: sellerUserId },
              status: { in: ["OPEN", "NEED_MORE_INFO"] }
            }
          });

          const weighted = released * 0.3 - (refunds + openDisputes) * 1.0;
          const sigmoid = 1 / (1 + Math.exp(-weighted));
          const score = Number((sigmoid * 5).toFixed(2));

          await prisma.sellerProfile.updateMany({
            where: { userId: sellerUserId },
            data: {
              reputationScore: score
            }
          });
          break;
        }
        default:
          job.log(`Unknown job ${job.name}`);
      }
    },
    { connection }
  );

  await queue.add(
    "auto-release-scan",
    {},
    {
      repeat: {
        every: 15 * 60 * 1000
      },
      jobId: "auto-release-scan"
    }
  );

  const manager: JobManager = {
    async enqueueAutoReleaseScan() {
      await queue.add("auto-release-scan", {}, { jobId: `auto-release-manual-${Date.now()}` });
    },
    async enqueueReputation(sellerUserId: string) {
      await queue.add(
        "recalculate-reputation",
        { sellerUserId },
        { jobId: `reputation-${sellerUserId}`, removeOnComplete: true }
      );
    }
  };

  fastify.decorate("jobs", manager);

  fastify.addHook("onClose", async () => {
    await worker.close();
    await queue.close();
    await scheduler.close();
    await connection.quit();
  });
});
