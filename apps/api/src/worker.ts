import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { db } from './lib/db';
import { calculateReputationScore } from '@escrow/core';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Job types
interface AutoReleaseJob {
  type: 'auto_release';
}

interface ReputationUpdateJob {
  type: 'reputation_update';
  sellerId: string;
}

type JobData = AutoReleaseJob | ReputationUpdateJob;

// Create queue
const escrowQueue = new Queue<JobData>('escrow', { connection });

/**
 * Start the background worker
 */
export function startWorker() {
  // Worker to process jobs
  const worker = new Worker<JobData>(
    'escrow',
    async (job) => {
      console.log(`Processing job ${job.id}: ${job.data.type}`);

      if (job.data.type === 'auto_release') {
        await processAutoRelease();
      } else if (job.data.type === 'reputation_update') {
        await processReputationUpdate(job.data.sellerId);
      }
    },
    { connection }
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  // Schedule recurring jobs
  escrowQueue.add(
    'auto_release',
    { type: 'auto_release' },
    {
      repeat: {
        pattern: '*/15 * * * *', // Every 15 minutes
      },
      jobId: 'auto_release_recurring',
    }
  );

  console.log('Worker started with recurring jobs');
}

/**
 * Process auto-release for deals
 * Checks all SHIPPED deals where autoReleaseAt has passed
 */
async function processAutoRelease() {
  const now = new Date();

  // Find deals eligible for auto-release
  const deals = await db.deal.findMany({
    where: {
      status: 'SHIPPED',
      autoReleaseAt: {
        lte: now,
      },
    },
    include: {
      disputes: {
        where: {
          status: 'OPEN',
        },
      },
    },
  });

  console.log(`Found ${deals.length} deals eligible for auto-release`);

  for (const deal of deals) {
    // Skip if there's an open dispute
    if (deal.disputes.length > 0) {
      console.log(`Skipping deal ${deal.id} - has open dispute`);
      continue;
    }

    try {
      // Auto-release the deal
      await db.deal.update({
        where: { id: deal.id },
        data: {
          status: 'RELEASED',
          deliveredAt: new Date(),
        },
      });

      // Log event
      await db.dealEvent.create({
        data: {
          dealId: deal.id,
          eventType: 'AUTO_RELEASE',
          fromState: 'SHIPPED',
          toState: 'RELEASED',
          metadata: { autoReleased: true },
        },
      });

      // Create positive reputation event
      await db.reputationEvent.create({
        data: {
          sellerId: deal.sellerId,
          type: 'positive',
          weight: 1.0,
          note: `Deal ${deal.id} auto-released`,
        },
      });

      // Trigger reputation update
      await escrowQueue.add('reputation_update', {
        type: 'reputation_update',
        sellerId: deal.sellerId,
      });

      console.log(`Auto-released deal ${deal.id}`);
    } catch (error) {
      console.error(`Failed to auto-release deal ${deal.id}:`, error);
    }
  }
}

/**
 * Recalculate reputation score for a seller
 */
async function processReputationUpdate(sellerId: string) {
  const sellerProfile = await db.sellerProfile.findUnique({
    where: { id: sellerId },
  });

  if (!sellerProfile) {
    console.log(`Seller profile ${sellerId} not found`);
    return;
  }

  // Get all deals for this seller
  const [releasedCount, refundCount] = await Promise.all([
    db.deal.count({
      where: {
        sellerId: sellerProfile.userId,
        status: 'RELEASED',
      },
    }),
    db.deal.count({
      where: {
        sellerId: sellerProfile.userId,
        status: 'REFUND',
      },
    }),
  ]);

  // Get dispute count
  const disputeCount = await db.dispute.count({
    where: {
      deal: {
        sellerId: sellerProfile.userId,
      },
    },
  });

  // Calculate new reputation score
  const newScore = calculateReputationScore({
    releasedCount,
    disputeCount,
    neutralCount: refundCount,
  });

  // Update seller profile
  await db.sellerProfile.update({
    where: { id: sellerId },
    data: { reputationScore: newScore },
  });

  console.log(
    `Updated reputation for seller ${sellerId}: ${newScore} (${releasedCount} released, ${disputeCount} disputes)`
  );
}

/**
 * Manually trigger a job (useful for testing)
 */
export async function triggerJob(data: JobData) {
  return escrowQueue.add(data.type, data);
}
