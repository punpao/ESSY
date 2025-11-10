import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from './db';
import { escrowMachine } from '@thai-escrow/core';
import { calculateReputationScore } from '@thai-escrow/core';
import { config } from './config';

const connection = new IORedis(config.redis.url, {
  maxRetriesPerRequest: null,
});

// Queue for auto-release checks
export const autoReleaseQueue = new Queue('auto-release', { connection });

// Queue for reputation recalculation
export const reputationQueue = new Queue('reputation', { connection });

/**
 * Worker: Auto-release deals
 * 
 * Checks for deals that should be auto-released after X hours
 */
export const autoReleaseWorker = new Worker(
  'auto-release',
  async () => {
    console.log('[Worker] Checking for auto-release deals...');
    
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
    
    console.log(`[Worker] Found ${deals.length} deals eligible for auto-release`);
    
    for (const deal of deals) {
      const context = {
        status: deal.status,
        auto_release_at: deal.auto_release_at,
        has_open_dispute: deal.disputes.length > 0,
      };
      
      if (escrowMachine.shouldAutoRelease(context)) {
        console.log(`[Worker] Auto-releasing deal ${deal.id}`);
        
        const newStatus = escrowMachine.transition(context, 'auto_release');
        
        await prisma.deal.update({
          where: { id: deal.id },
          data: {
            status: newStatus,
            delivered_at: new Date(),
          },
        });
        
        await prisma.dealEvent.create({
          data: {
            deal_id: deal.id,
            event_type: 'auto_released',
            metadata: { auto_release_at: deal.auto_release_at },
          },
        });
        
        // Add positive reputation
        await prisma.reputationEvent.create({
          data: {
            seller_id: deal.seller_id,
            type: 'positive',
            weight: 0.3,
            note: `Deal ${deal.id} auto-released`,
          },
        });
        
        // Queue reputation recalculation
        await reputationQueue.add('recalculate', { seller_id: deal.seller_id });
      }
    }
    
    return { processed: deals.length };
  },
  { connection }
);

/**
 * Worker: Recalculate seller reputation
 */
export const reputationWorker = new Worker(
  'reputation',
  async (job) => {
    const { seller_id } = job.data;
    
    console.log(`[Worker] Recalculating reputation for seller ${seller_id}`);
    
    const events = await prisma.reputationEvent.findMany({
      where: { seller_id },
      orderBy: { created_at: 'desc' },
    });
    
    const score = calculateReputationScore(
      events.map((e) => ({ type: e.type as any, weight: e.weight }))
    );
    
    await prisma.sellerProfile.update({
      where: { id: seller_id },
      data: { reputation_score: score },
    });
    
    console.log(`[Worker] Updated reputation for ${seller_id}: ${score}`);
    
    return { seller_id, score };
  },
  { connection }
);

/**
 * Setup recurring jobs
 */
export async function setupRecurringJobs() {
  // Run auto-release check every 15 minutes
  await autoReleaseQueue.add(
    'check',
    {},
    {
      repeat: {
        pattern: '*/15 * * * *', // Every 15 minutes
      },
    }
  );
  
  console.log('[Worker] Recurring jobs setup complete');
}

// Error handlers
autoReleaseWorker.on('failed', (job, err) => {
  console.error(`[Worker] Auto-release job failed:`, err);
});

reputationWorker.on('failed', (job, err) => {
  console.error(`[Worker] Reputation job failed:`, err);
});
