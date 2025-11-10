import { PrismaClient } from '@prisma/client';

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export class ReputationService {
  constructor(private prisma: PrismaClient) {}

  async recalcSellerScore(sellerId: string) {
    const [releasedCount, disputeCount] = await Promise.all([
      this.prisma.deal.count({ where: { sellerId, status: 'RELEASED' } }),
      this.prisma.dispute.count({ where: { deal: { sellerId } } }),
    ]);

    const score = sigmoid(releasedCount * 0.3 - disputeCount * 1.0);

    await this.prisma.sellerProfile.updateMany({
      where: { userId: sellerId },
      data: { reputationScore: score },
    });

    await this.prisma.reputationEvent.create({
      data: {
        sellerId,
        type: 'positive',
        weight: score,
        note: `Auto recalculated score with ${releasedCount} released and ${disputeCount} disputes`,
      },
    });

    return score;
  }
}
