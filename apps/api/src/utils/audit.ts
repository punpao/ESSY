import { PrismaClient } from '@prisma/client';

export const recordDealEvent = async (
  prisma: PrismaClient,
  dealId: string,
  event: string,
  metadata: Record<string, unknown> = {}
) => {
  await prisma.dealEvent.create({
    data: {
      dealId,
      event,
      metadata,
    },
  });
};
