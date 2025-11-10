import { prisma } from './prisma';

export async function logDealEvent(
  dealId: string,
  eventType: string,
  oldStatus: string,
  newStatus: string,
  metadata?: Record<string, unknown>
) {
  await prisma.dealEvent.create({
    data: {
      id: require('ulid').ulid(),
      deal_id: dealId,
      event_type: eventType,
      old_status: oldStatus,
      new_status: newStatus,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
