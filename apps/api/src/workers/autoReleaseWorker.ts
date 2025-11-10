import { shouldAutoRelease } from '@thai-social-escrow/core';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { createWorker, enqueue } from '../lib/redis';
import { recalcSellerReputation, transitionDeal } from '../services/dealService';

export async function scheduleRecurringJobs() {
  await enqueue('dealLifecycle', { task: 'auto-release-scan' }, { repeat: { every: 15 * 60 * 1000 } });
  await enqueue('dealLifecycle', { task: 'reputation-recalc' }, { repeat: { every: 60 * 60 * 1000 } });
}

export function startWorkers() {
  createWorker('dealLifecycle', async (job) => {
    if (job.data.task === 'auto-release-scan') {
      await runAutoReleaseScan();
    } else if (job.data.task === 'reputation-recalc') {
      await runReputationRecalc();
    } else if (job.data.task === 'single-auto-release' && job.data.dealId) {
      await autoReleaseDeal(job.data.dealId as string);
    }
  });
}

async function runAutoReleaseScan() {
  const now = new Date();
  const deals = await prisma.deal.findMany({
    where: {
      status: { in: ['HOLD', 'SHIPPED'] },
      deliveredAt: { not: null }
    },
    include: {
      payments: true
    }
  });

  for (const deal of deals) {
    const shouldRelease = shouldAutoRelease({
      deliveredAt: deal.deliveredAt ?? undefined,
      buyerConfirmedAt: deal.status === 'RELEASED' ? deal.updatedAt : undefined,
      now,
      silentForHours: config.autoReleaseHours
    });
    if (shouldRelease) {
      await autoReleaseDeal(deal.id);
    }
  }
}

async function autoReleaseDeal(dealId: string) {
  const updated = await transitionDeal({
    dealId,
    event: { type: 'AUTO_RELEASE' },
    context: { actorId: 'system', actorRole: 'system', note: 'Auto release after SLA' }
  });
  if (updated.sellerProfileId) {
    await recalcSellerReputation(updated.sellerProfileId);
  }
}

async function runReputationRecalc() {
  const sellers = await prisma.sellerProfile.findMany({
    select: { id: true }
  });
  for (const seller of sellers) {
    await recalcSellerReputation(seller.id);
  }
}
