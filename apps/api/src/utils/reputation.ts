import { PrismaClient } from "@prisma/client";

export async function recordReputationEvent(params: {
  prisma: PrismaClient;
  sellerUserId: string;
  type: "positive" | "neutral" | "negative";
  weight: number;
  note?: string;
}) {
  const profile = await params.prisma.sellerProfile.findUnique({
    where: { userId: params.sellerUserId }
  });

  if (!profile) {
    return null;
  }

  const event = await params.prisma.reputationEvent.create({
    data: {
      sellerId: profile.id,
      type: params.type,
      weight: params.weight,
      note: params.note
    }
  });

  return event;
}
