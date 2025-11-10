import { Deal, DealStatus } from '@prisma/client';
import { computeAutoReleaseAt, transitionStatus } from '@thai-social-escrow/core';
import { prisma } from '../lib/prisma';
import { config } from '../config';

export type DealWithRelations = Deal & {
  seller: { id: string; displayName: string; role: string };
  buyer?: { id: string; displayName: string; role: string } | null;
};

interface TransitionInput {
  dealId: string;
  event: Parameters<typeof transitionStatus>[1];
  context?: {
    actorId: string;
    actorRole: 'buyer' | 'seller' | 'admin' | 'system';
    note?: string;
    meta?: Record<string, unknown>;
  };
  data?: Partial<Deal>;
}

export async function transitionDeal({ dealId, event, context, data }: TransitionInput) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) {
    throw new Error('Deal not found');
  }

  const nextStatus = transitionStatus(deal.status as DealStatus, event);

  let autoReleaseAt: Date | null | undefined = deal.autoReleaseAt ?? undefined;
  if (event.type === 'AUTO_RELEASE' || nextStatus === 'RELEASED') {
    autoReleaseAt = null;
  }
  if (data?.deliveredAt) {
    autoReleaseAt = computeAutoReleaseAt(new Date(data.deliveredAt), config.autoReleaseHours);
  }

  const updated = await prisma.deal.update({
    where: { id: dealId },
    data: {
      status: nextStatus,
      ...data,
      autoReleaseAt
    }
  });

  await prisma.dealEvent.create({
    data: {
      dealId,
      from: deal.status,
      to: nextStatus,
      context: JSON.stringify({
        ...context,
        data
      })
    }
  });

  return updated;
}

export async function recalcSellerReputation(sellerProfileId: string) {
  const deals = await prisma.deal.findMany({
    where: { sellerProfileId },
    select: {
      status: true
    }
  });

  const released = deals.filter((d) => d.status === 'RELEASED').length;
  const disputes = deals.filter((d) => d.status === 'DISPUTE').length;
  const refunds = deals.filter((d) => d.status === 'REFUND').length;
  const score = sigmoid(released * 0.3 - disputes * 1.0 - refunds * 0.5);

  await prisma.sellerProfile.update({
    where: { id: sellerProfileId },
    data: {
      reputationScore: score
    }
  });

  await prisma.reputationEvent.create({
    data: {
      sellerId: sellerProfileId,
      type: score >= 0.6 ? 'positive' : score >= 0.4 ? 'neutral' : 'negative',
      weight: score,
      note: `auto-update-${new Date().toISOString()}`
    }
  });
}

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}
