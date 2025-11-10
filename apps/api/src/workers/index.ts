import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import type { FastifyInstance } from 'fastify';
import { DealService } from '../services/dealService';
import { ReputationService } from '../services/reputationService';

export const registerWorkers = (app: FastifyInstance, env: { REDIS_URL: string; AUTO_RELEASE_HOURS: number }) => {
  const connection = new IORedis(env.REDIS_URL);
  const queue = new Queue('escrow-jobs', { connection });
  const dealService = new DealService(app.prisma, env.AUTO_RELEASE_HOURS);
  const reputationService = new ReputationService(app.prisma);

  const worker = new Worker(
    'escrow-jobs',
    async (job) => {
      if (job.name === 'auto-release-check') {
        const now = new Date();
        const dueDeals = await app.prisma.deal.findMany({
          where: {
            status: 'SHIPPED',
            autoReleaseAt: { lte: now },
            OR: [
              { dispute: null },
              {
                dispute: {
                  status: { notIn: ['OPEN', 'NEED_MORE_INFO'] },
                },
              },
            ],
          },
        });

        for (const deal of dueDeals) {
          try {
            const result = await dealService.transitionState(
              deal,
              { type: 'AUTO_RELEASE_CHECK' },
              {
                hasPayment: true,
                hasTracking: Boolean(deal.trackingNumber),
                deliveredAt: deal.deliveredAt ?? undefined,
                autoReleaseHours: env.AUTO_RELEASE_HOURS,
                now,
              }
            );
            if (result.changed && result.to === 'RELEASED') {
              await reputationService.recalcSellerScore(deal.sellerId);
            }
          } catch (error) {
            app.log.error(
              { error, dealId: deal.id },
              'Failed auto release transition'
            );
          }
        }
      }
    },
    { connection }
  );

  queue
    .add('auto-release-check', {}, { repeat: { every: 15 * 60 * 1000 } })
    .catch((err) => app.log.error(err, 'Failed to schedule auto release job'));

  app.addHook('onClose', async () => {
    await worker.close();
    await queue.close();
    await connection.quit();
  });
};
