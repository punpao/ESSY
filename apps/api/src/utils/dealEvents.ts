import { PrismaClient } from "@prisma/client";

export async function logDealEvent(
  prisma: PrismaClient,
  params: { dealId: string; type: string; payload?: unknown; actorId?: string | null }
) {
  await prisma.dealEvent.create({
    data: {
      dealId: params.dealId,
      type: params.type,
      actorId: params.actorId ?? undefined,
      payload: params.payload as any
    }
  });
}
