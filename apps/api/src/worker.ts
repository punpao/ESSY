import { Worker, Queue } from 'bullmq';
import { PrismaClient, DisputeStatus } from '@prisma/client';
import { loadConfig } from './config.js';
import { redis as createRedis } from './services/redis.js';
import { applyDealTransition } from './services/dealState.js';

const config = loadConfig();
const prisma = new PrismaClient();
const connection = createRedis(config.redisUrl);

const reputationQueue = new Queue('reputation', {
  connection: connection.duplicate()
});

const autoReleaseWorker = new Worker(
  'auto-release',
  async () => {
    const now = new Date();
    const deals = await prisma.deal.findMany({
      where: {
        status: 'SHIPPED',
        autoReleaseAt: {
          lte: now
        }
      },
      include: {
        dispute: true
      }
    });

    for (const deal of deals) {
      if (
        deal.dispute &&
        [DisputeStatus.OPEN, DisputeStatus.NEED_MORE_INFO].includes(deal.dispute.status)
      ) {
        continue;
      }

      try {
        await applyDealTransition(
          prisma,
          deal,
          { type: 'AUTO_RELEASE' },
          null,
          { autoReleaseAt: null }
        );

        await prisma.dealEvent.create({
          data: {
            dealId: deal.id,
            actorId: null,
            event: 'AUTO_RELEASE',
            note: 'ครบกำหนด 48 ชม. หลังจัดส่ง ระบบโอนเงินให้ผู้ขายอัตโนมัติ'
          }
        });

        await reputationQueue.add('recalculate', { sellerId: deal.sellerId });
      } catch (error) {
        console.error('Auto release failed', deal.id, error);
      }
    }
  },
  {
    connection
  }
);

const reputationWorker = new Worker(
  'reputation',
  async (job) => {
    const { sellerId } = job.data as { sellerId: string };
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: sellerId }
    });
    if (!profile) {
      return;
    }

    const releasedCount = await prisma.deal.count({
      where: { sellerId, status: 'RELEASED' }
    });
    const disputeRefunds = await prisma.dispute.count({
      where: {
        deal: { sellerId },
        status: 'RESOLVED_REFUND'
      }
    });

    const rawScore = releasedCount * 0.3 - disputeRefunds * 1.0;
    const score = 1 / (1 + Math.exp(-rawScore));

    await prisma.sellerProfile.update({
      where: { id: profile.id },
      data: { reputationScore: score }
    });
  },
  {
    connection: connection.duplicate()
  }
);

const shutdown = async () => {
  await autoReleaseWorker.close();
  await reputationWorker.close();
  await reputationQueue.close();
  await prisma.$disconnect();
  await connection.quit();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
