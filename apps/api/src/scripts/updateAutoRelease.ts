import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

/**
 * Update autoReleaseAt for SHIPPED deals when delivered_at is set
 * This should be called when tracking shows "delivered"
 */
export async function updateAutoReleaseTimestamps() {
  const deals = await prisma.deal.findMany({
    where: {
      status: 'SHIPPED',
      deliveredAt: { not: null },
      autoReleaseAt: null,
    },
  });

  for (const deal of deals) {
    if (deal.deliveredAt) {
      const autoReleaseAt = new Date(
        deal.deliveredAt.getTime() + config.AUTO_RELEASE_HOURS * 60 * 60 * 1000
      );

      await prisma.deal.update({
        where: { id: deal.id },
        data: { autoReleaseAt },
      });

      console.log(`Updated auto-release for deal ${deal.id}: ${autoReleaseAt}`);
    }
  }
}

if (require.main === module) {
  updateAutoReleaseTimestamps()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
