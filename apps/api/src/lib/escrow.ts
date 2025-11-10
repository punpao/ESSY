import { prisma } from './prisma';
import { escrowTransition, type EscrowEvent, type EscrowContext } from '@essy/core';

export async function transitionDealStatus(
  dealId: string,
  event: EscrowEvent,
  userId: string
): Promise<void> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      payment: true,
      dispute: true,
    },
  });

  if (!deal) {
    throw new Error('Deal not found');
  }

  const context: EscrowContext = {
    status: deal.status as any,
    hasPayment: deal.payment?.status === 'PAID',
    hasTracking: !!deal.tracking_number,
    isDelivered: !!deal.delivered_at,
    hasOpenDispute: deal.dispute?.status === 'OPEN',
  };

  const newStatus = escrowTransition(deal.status as any, event, context);

  if (newStatus === deal.status) {
    throw new Error(`Invalid transition from ${deal.status} with event ${event.type}`);
  }

  // Update deal
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      status: newStatus,
      updated_at: new Date(),
    },
  });

  // Log event
  const { ulid } = require('ulid');
  await prisma.dealEvent.create({
    data: {
      id: ulid(),
      deal_id: dealId,
      event_type: event.type,
      old_status: deal.status,
      new_status: newStatus,
      metadata: JSON.stringify(event),
    },
  });
}
