import { PrismaClient, Deal, DisputeStatus, Prisma } from '@prisma/client';
import { EscrowEvent, EscrowState, transitionEscrow } from '@thai-escrow/core';

const isDisputeOpen = (deal: Deal & { dispute: { status: DisputeStatus } | null }) =>
  !!deal.dispute && ['OPEN', 'NEED_MORE_INFO'].includes(deal.dispute.status);

type PrismaClientLike = PrismaClient | Prisma.TransactionClient;

export const applyDealTransition = async (
  prisma: PrismaClientLike,
  deal: Deal & { dispute: { status: DisputeStatus } | null },
  event: EscrowEvent,
  actorId: string | null,
  additionalData: Partial<Deal> = {},
  contextOverride?: { delivered?: boolean; hasOpenDispute?: boolean }
) => {
  const snapshot = transitionEscrow(
    {
      state: deal.status as EscrowState,
      context: {
        delivered: contextOverride?.delivered ?? Boolean(additionalData.deliveredAt ?? deal.deliveredAt),
        hasOpenDispute:
          contextOverride?.hasOpenDispute ?? isDisputeOpen(deal)
      }
    },
    event
  );

  const updatedDeal = await prisma.deal.update({
    where: { id: deal.id },
    data: {
      status: snapshot.state,
      ...additionalData
    }
  });

  await prisma.dealEvent.create({
    data: {
      dealId: deal.id,
      actorId,
      event: event.type,
      note: `สถานะเปลี่ยนเป็น ${snapshot.state}`
    }
  });

  return updatedDeal;
};
