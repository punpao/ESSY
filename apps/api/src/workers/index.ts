import { Queue, Worker } from 'bullmq';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { transitionDealStatus } from '../lib/escrow';

export const autoReleaseQueue = new Queue('auto-release', {
  connection: redis,
});

export const reputationQueue = new Queue('reputation', {
  connection: redis,
});

export function startWorkers() {
  // Auto-release worker
  const autoReleaseWorker = new Worker(
    'auto-release',
    async (job) => {
      const { dealId } = job.data;

      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: {
          payment: true,
          dispute: true,
        },
      });

      if (!deal) {
        return;
      }

      // Check if auto-release conditions are met
      const autoReleaseHours = parseInt(process.env.AUTO_RELEASE_HOURS || '48', 10);
      const now = new Date();

      if (
        deal.status === 'SHIPPED' &&
        deal.auto_release_at &&
        deal.auto_release_at <= now &&
        (!deal.dispute || deal.dispute.status !== 'OPEN')
      ) {
        await transitionDealStatus(deal.id, { type: 'AUTO_RELEASE' }, 'system');
      }
    },
    {
      connection: redis,
    }
  );

  // Reputation calculation worker
  const reputationWorker = new Worker(
    'reputation',
    async (job) => {
      const { sellerId } = job.data;

      const seller = await prisma.sellerProfile.findUnique({
        where: { user_id: sellerId },
        include: {
          reputation_events: true,
          deals: {
            where: {
              status: {
                in: ['RELEASED', 'REFUND'],
              },
            },
          },
        },
      });

      if (!seller) {
        return;
      }

      // Calculate reputation: sigmoid(#released * 0.3 - #disputes * 1.0)
      const releasedCount = seller.deals.filter((d) => d.status === 'RELEASED').length;
      const disputes = await prisma.dispute.findMany({
        where: {
          deal: {
            seller_id: sellerId,
          },
          status: {
            in: ['RESOLVED_REFUND'],
          },
        },
      });

      const score = releasedCount * 0.3 - disputes.length * 1.0;
      // Sigmoid: 1 / (1 + e^(-x))
      const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
      const reputationScore = Math.max(0, Math.min(100, sigmoid(score) * 100));

      await prisma.sellerProfile.update({
        where: { user_id: sellerId },
        data: {
          reputation_score: reputationScore,
        },
      });
    },
    {
      connection: redis,
    }
  );

  // Schedule auto-release checks every 15 minutes
  setInterval(async () => {
    const deals = await prisma.deal.findMany({
      where: {
        status: 'SHIPPED',
        auto_release_at: {
          not: null,
        },
      },
    });

    for (const deal of deals) {
      if (deal.auto_release_at) {
        await autoReleaseQueue.add('check-auto-release', {
          dealId: deal.id,
        });
      }
    }
  }, 15 * 60 * 1000); // 15 minutes

  console.log('Workers started');
}
