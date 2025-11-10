import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { requireRole } from '../utils/auth';

const verifyBasicSchema = z.object({
  promptpayId: z.string().min(10).max(10),
  promptpayName: z.string().min(1),
});

export async function sellerRoutes(fastify: FastifyInstance) {
  // Get seller profile
  fastify.get('/me', async (request, reply) => {
    const user = await requireRole(request, reply, ['seller', 'admin']);

    let profile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      include: { user: true },
    });

    if (!profile && user.role === 'seller') {
      // Create profile if doesn't exist
      profile = await prisma.sellerProfile.create({
        data: {
          userId: user.id,
        },
        include: { user: true },
      });
    }

    return profile;
  });

  // Submit basic KYC (PromptPay ID + selfie)
  fastify.post('/verify/basic', async (request, reply) => {
    const user = await requireRole(request, reply, ['seller']);

    const data = verifyBasicSchema.parse(request.body);

    // Mock file upload - in production, upload to S3
    const selfieUrl = `${process.env.S3_BUCKET_URL}/selfies/${user.id}_${Date.now()}.jpg`;

    const profile = await prisma.sellerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        promptpayId: data.promptpayId,
        promptpayName: data.promptpayName,
        kycStatus: 'pending',
      },
      update: {
        promptpayId: data.promptpayId,
        promptpayName: data.promptpayName,
        kycStatus: 'pending',
      },
    });

    // Update user KYC level
    await prisma.user.update({
      where: { id: user.id },
      data: { kycLevel: 'basic' },
    });

    return { success: true, profile };
  });

  // Admin: Approve seller verification
  fastify.post('/verify/approve', async (request, reply) => {
    const admin = await requireRole(request, reply, ['admin']);

    const { userId } = z.object({ userId: z.string().uuid() }).parse(request.body);

    const profile = await prisma.sellerProfile.update({
      where: { userId },
      data: {
        verified: true,
        kycStatus: 'verified',
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { kycLevel: 'full' },
    });

    return { success: true, profile };
  });
}
