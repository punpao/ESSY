import { prisma } from "../config/database";
import type { DealStatus } from "@essy/core";

export async function logDealEvent(
  dealId: string,
  eventType: string,
  fromStatus?: DealStatus,
  toStatus?: DealStatus,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.dealEvent.create({
    data: {
      dealId,
      eventType,
      fromStatus: fromStatus || null,
      toStatus: toStatus || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
