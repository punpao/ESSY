import { prisma } from "../../lib/prisma";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export async function recalculateReputation(sellerId: string): Promise<number> {
  const [released, disputes] = await Promise.all([
    prisma.deal.count({ where: { sellerId, status: "RELEASED" } }),
    prisma.dispute.count({
      where: {
        deal: { sellerId },
        status: { in: ["OPEN", "RESOLVED_REFUND"] }
      }
    })
  ]);

  const score = sigmoid(released * 0.3 - disputes * 1.0);
  const rounded = Number(score.toFixed(3));

  await prisma.sellerProfile.update({
    where: { userId: sellerId },
    data: { reputationScore: rounded }
  });

  return rounded;
}
