import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../auth';
import { z } from 'zod';

const verifyBasicSchema = z.object({
  promptpayId: z.string().min(10).max(13),
  promptpayName: z.string().min(1),
  selfieUrl: z.string().url().optional(), // In production, handle file upload
});

export async function sellerRoutes(fastify: FastifyInstance) {
  // Get seller profile
  fastify.get('/seller/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await requireAuth(request);

    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      include: { user: true },
    });

    if (!profile) {
      return reply.code(404).send({ error: 'Seller profile not found' });
    }

    return profile;
  });

  // Submit basic KYC
  fastify.post('/seller/verify/basic', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await requireAuth(request);
    const { promptpayId, promptpayName, selfieUrl } = verifyBasicSchema.parse(request.body);

    // Mock liveness check - in production, verify selfie
    const kycStatus = selfieUrl ? 'pending' : 'unverified';

    let profile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });

    if (profile) {
      profile = await prisma.sellerProfile.update({
        where: { userId: user.id },
        data: {
          promptpayId,
          promptpayName,
          kycStatus: kycStatus as any,
        },
      });
    } else {
      profile = await prisma.sellerProfile.create({
        data: {
          userId: user.id,
          promptpayId,
          promptpayName,
          kycStatus: kycStatus as any,
        },
      });
    }

    // Update user KYC level
    await prisma.user.update({
      where: { id: user.id },
      data: { kycLevel: 'basic' },
    });

    return profile;
  });

  // Admin approve seller verification
  fastify.post('/seller/verify/approve', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await requireRole(request, 'admin');
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

    return profile;
  });
}
