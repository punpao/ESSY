import { prisma } from "./prisma";

export async function updateSellerReputation(sellerId: string) {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: sellerId },
    include: {
      deals: {
        where: { status: "RELEASED" },
      },
    },
  });

  if (!sellerProfile) return;

  const releasedCount = sellerProfile.deals.length;
  const disputes = await prisma.dispute.count({
    where: {
      dealRef: { sellerId },
      status: { in: ["OPEN", "RESOLVED_REFUND"] },
    },
  });

  // Simple reputation: sigmoid(released * 0.3 - disputes * 1.0)
  const rawScore = releasedCount * 0.3 - disputes * 1.0;
  const reputationScore = (1 / (1 + Math.exp(-rawScore))) * 100; // Scale to 0-100

  await prisma.sellerProfile.update({
    where: { userId: sellerId },
    data: { reputationScore },
  });
}
