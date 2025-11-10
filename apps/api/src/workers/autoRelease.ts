import { Queue, Worker } from 'bullmq';
import { prisma } from '../db';
import { EscrowStateMachine } from '@essy/core';
import { config } from '../config';
import IORedis from 'ioredis';

const connection = new IORedis(config.redisUrl);

export const autoReleaseQueue = new Queue('auto-release', { connection });

export function startAutoReleaseWorker() {
  const worker = new Worker(
    'auto-release',
    async (job) => {
      const { dealId } = job.data;

      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: { dispute: true },
      });

      if (!deal) {
        return;
      }

      // Skip if dispute is open
      if (deal.dispute && deal.dispute.status === 'OPEN') {
        return;
      }

      // Check if auto-release time has passed
      if (deal.autoReleaseAt && deal.autoReleaseAt <= new Date()) {
        if (EscrowStateMachine.canTransition(deal.status, 'RELEASED')) {
          await prisma.deal.update({
            where: { id: dealId },
            data: { status: 'RELEASED' },
          });

          // Trigger reputation update
          await updateSellerReputation(deal.sellerId);
        }
      }
    },
    { connection, concurrency: 5 }
  );

  // Schedule periodic check
  setInterval(async () => {
    const deals = await prisma.deal.findMany({
      where: {
        status: 'SHIPPED',
        autoReleaseAt: { lte: new Date() },
      },
      include: { dispute: true },
    });

    for (const deal of deals) {
      if (!deal.dispute || deal.dispute.status !== 'OPEN') {
        await autoReleaseQueue.add('check-deal', { dealId: deal.id });
      }
    }
  }, 15 * 60 * 1000); // Every 15 minutes

  return worker;
}

async function updateSellerReputation(sellerId: string) {
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: sellerId },
    include: {
      user: {
        include: {
          dealsAsSeller: {
            where: { status: 'RELEASED' },
          },
        },
      },
    },
  });

  if (!profile) {
    return;
  }

  const releasedCount = profile.user.dealsAsSeller.length;
  const disputes = await prisma.dispute.findMany({
    where: {
      deal: { sellerId },
      status: { in: ['RESOLVED_REFUND'] },
    },
  });

  // Simple reputation: released deals * 0.3 - disputes * 1.0
  const score = Math.max(0, releasedCount * 0.3 - disputes.length * 1.0);

  await prisma.sellerProfile.update({
    where: { userId: sellerId },
    data: { reputationScore: score },
  });
}
