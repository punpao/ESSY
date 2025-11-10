import { Worker, Queue } from 'bullmq';
import { redis } from './redis';
import { prisma } from './db';
import { EscrowStateMachine } from '@thai-escrow/core';

const autoReleaseQueue = new Queue('auto-release', {
  connection: redis,
});

export function startWorker() {
  const worker = new Worker(
    'auto-release',
    async (job) => {
      console.log(`[Worker] Processing job ${job.name}`);

      if (job.name === 'check-auto-release') {
        await checkAndAutoRelease();
      }
    },
    {
      connection: redis,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err);
  });

  // Schedule recurring job every 15 minutes
  autoReleaseQueue.add(
    'check-auto-release',
    {},
    {
      repeat: {
        pattern: '*/15 * * * *', // Every 15 minutes
      },
    }
  );

  console.log('🔄 Auto-release worker started');
}

async function checkAndAutoRelease() {
  const now = new Date();

  // Find deals eligible for auto-release
  const deals = await prisma.deal.findMany({
    where: {
      status: 'SHIPPED',
      auto_release_at: {
        lte: now,
      },
    },
    include: {
      disputes: {
        where: {
          status: { in: ['OPEN', 'NEED_MORE_INFO'] },
        },
      },
    },
  });

  console.log(`[AutoRelease] Found ${deals.length} deals eligible for auto-release`);

  for (const deal of deals) {
    // Skip if there's an open dispute
    if (deal.disputes.length > 0) {
      console.log(`[AutoRelease] Skipping deal ${deal.id} - has open dispute`);
      continue;
    }

    try {
      // Transition to RELEASED
      const newStatus = EscrowStateMachine.transition('SHIPPED', 'AUTO_RELEASE', {
        currentStatus: 'SHIPPED',
        autoReleaseReady: true,
        hasOpenDispute: false,
      });

      await prisma.deal.update({
        where: { id: deal.id },
        data: { status: newStatus },
      });

      await prisma.dealEvent.create({
        data: {
          deal_id: deal.id,
          event_type: 'auto_released',
          from_status: 'SHIPPED',
          to_status: newStatus,
          metadata: JSON.stringify({ auto_release_at: deal.auto_release_at }),
        },
      });

      console.log(`[AutoRelease] Deal ${deal.id} auto-released`);

      // Update seller reputation
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { user_id: deal.seller_id },
      });

      if (sellerProfile) {
        await prisma.reputationEvent.create({
          data: {
            seller_id: sellerProfile.id,
            type: 'positive',
            weight: 1.0,
            note: `Deal ${deal.id} auto-released`,
          },
        });

        // Recalculate reputation
        const releasedCount = await prisma.deal.count({
          where: {
            seller_id: deal.seller_id,
            status: 'RELEASED',
          },
        });

        const disputeCount = await prisma.dispute.count({
          where: {
            deal: {
              seller_id: deal.seller_id,
            },
          },
        });

        const newScore = releasedCount * 10 - disputeCount * 5;

        await prisma.sellerProfile.update({
          where: { id: sellerProfile.id },
          data: {
            reputation_score: Math.max(0, newScore),
          },
        });
      }
    } catch (error) {
      console.error(`[AutoRelease] Error processing deal ${deal.id}:`, error);
    }
  }
}
