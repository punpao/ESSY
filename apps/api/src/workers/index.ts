import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from '../index';
import { config } from '../config';
import { EscrowStateMachine } from '@essy/core';

const redis = new Redis(config.REDIS_URL);

// Auto-release queue
export const autoReleaseQueue = new Queue('auto-release', { connection: redis });

// Reputation queue
export const reputationQueue = new Queue('reputation', { connection: redis });

export async function setupWorkers() {
  // Worker: Auto-release deals
  const autoReleaseWorker = new Worker(
    'auto-release',
    async (job) => {
      const { dealId } = job.data;

      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: { dispute: true },
      });

      if (!deal) {
        return { success: false, reason: 'Deal not found' };
      }

      // Check if auto-release is allowed
      if (
        EscrowStateMachine.canAutoRelease(
          deal.status,
          deal.deliveredAt,
          deal.autoReleaseAt,
          !!deal.dispute && deal.dispute.status === 'OPEN'
        )
      ) {
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: 'RELEASED' },
        });

        await prisma.dealEvent.create({
          data: {
            dealId,
            fromStatus: deal.status,
            toStatus: 'RELEASED',
            reason: 'Auto-release after delivery',
          },
        });

        return { success: true };
      }

      return { success: false, reason: 'Auto-release conditions not met' };
    },
    { connection: redis }
  );

  // Worker: Recalculate reputation
  const reputationWorker = new Worker(
    'reputation',
    async (job) => {
      const { sellerId } = job.data;

      const seller = await prisma.sellerProfile.findUnique({
        where: { userId: sellerId },
        include: {
          reputationEvents: true,
          deals: {
            where: { status: 'RELEASED' },
          },
        },
      });

      if (!seller) {
        return { success: false, reason: 'Seller not found' };
      }

      // Simple reputation calculation
      const positiveWeight = seller.reputationEvents
        .filter((e) => e.type === 'positive')
        .reduce((sum, e) => sum + e.weight, 0);
      const negativeWeight = seller.reputationEvents
        .filter((e) => e.type === 'negative')
        .reduce((sum, e) => sum + e.weight, 0);

      const releasedDeals = seller.deals.length;
      const reputationScore = Math.max(
        0,
        Math.min(100, positiveWeight * 0.3 - negativeWeight * 1.0 + releasedDeals * 0.5)
      );

      await prisma.sellerProfile.update({
        where: { userId: sellerId },
        data: { reputationScore },
      });

      return { success: true, reputationScore };
    },
    { connection: redis }
  );

  // Schedule periodic check for auto-release (every 15 minutes)
  setInterval(async () => {
    const dealsToCheck = await prisma.deal.findMany({
      where: {
        status: 'SHIPPED',
        autoReleaseAt: { lte: new Date() },
      },
      include: { dispute: true },
    });

    for (const deal of dealsToCheck) {
      if (!deal.dispute || deal.dispute.status !== 'OPEN') {
        await autoReleaseQueue.add('check-auto-release', { dealId: deal.id });
      }
    }
  }, 15 * 60 * 1000); // 15 minutes

  console.log('✅ Background workers started');
}
