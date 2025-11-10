import { Worker } from "bullmq";
import { createRedisConnection } from "./redis";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { nextEscrowState } from "../modules/shared/utils";
import { DealStatus } from "@escrow/core";
import { env } from "../config/env";
import { recalculateReputation } from "../modules/shared/reputation";

async function main() {
  const connection = await createRedisConnection();

  const worker = new Worker(
    "auto-release",
    async (job) => {
      if (job.name === "enforce") {
        const dealId = job.data.dealId as string;
        const deal = await prisma.deal.findUnique({
          where: { id: dealId },
          include: { payments: true, disputes: { where: { status: "OPEN" } } }
        });

        if (!deal) {
          logger.warn({ dealId }, "Deal not found during auto-release");
          return;
        }

        if (deal.disputes.length > 0) {
          logger.info({ dealId }, "Skipping auto release due to open dispute");
          return;
        }

        if (!deal.autoReleaseAt || deal.autoReleaseAt.getTime() > Date.now()) {
          logger.info({ dealId }, "Auto release not due yet");
          return;
        }

        const paid = deal.payments.some((p) => p.status === "PAID");
        if (!paid) {
          logger.info({ dealId }, "No paid payment, skipping");
          return;
        }

        const nextStatus = nextEscrowState(
          deal.status as DealStatus,
          { type: "AUTO_RELEASE" },
          {
            hasPayment: true,
            deliveredAt: deal.deliveredAt,
            autoReleaseAt: deal.autoReleaseAt,
            now: new Date(),
            hasOpenDispute: false
          }
        );

        await prisma.deal.update({
          where: { id: deal.id },
          data: { status: nextStatus, releasedAt: new Date() }
        });

        await recalculateReputation(deal.sellerId);
        logger.info({ dealId }, "Auto released deal");
      }
    },
    { connection }
  );

  worker.on("error", (err) => {
    logger.error({ err }, "Worker error");
  });

  logger.info({ env: env.nodeEnv }, "Auto release worker started");
}

void main();
