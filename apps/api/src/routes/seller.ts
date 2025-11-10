import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import { authenticate, requireRole } from '../lib/auth';

const sellerRoutes: FastifyPluginAsync = async (fastify) => {
  // Get seller profile
  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;

    let sellerProfile = await db.sellerProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
        reputationEvents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    // Create seller profile if doesn't exist
    if (!sellerProfile && (user.role === 'seller' || user.role === 'admin')) {
      sellerProfile = await db.sellerProfile.create({
        data: {
          userId: user.id,
          verified: false,
          kycStatus: 'unverified',
          reputationScore: 50.0,
        },
        include: {
          user: true,
          reputationEvents: true,
        },
      });
    }

    if (!sellerProfile) {
      return reply.status(404).send({ error: 'Not a seller' });
    }

    return sellerProfile;
  });

  // Submit basic KYC verification
  fastify.post(
    '/verify/basic',
    { preHandler: authenticate },
    async (request, reply) => {
      const schema = z.object({
        promptpayId: z.string().min(10),
        promptpayName: z.string(),
        selfieUrl: z.string().url().optional(),
      });

      const { promptpayId, promptpayName, selfieUrl } = schema.parse(request.body);
      const user = request.user!;

      // Get or create seller profile
      let sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!sellerProfile) {
        sellerProfile = await db.sellerProfile.create({
          data: {
            userId: user.id,
            verified: false,
            kycStatus: 'unverified',
          },
        });
      }

      // Update with KYC info
      const updated = await db.sellerProfile.update({
        where: { id: sellerProfile.id },
        data: {
          promptpayId,
          promptpayName,
          kycStatus: 'pending',
        },
      });

      // Also update user KYC level
      await db.user.update({
        where: { id: user.id },
        data: { kycLevel: 'basic' },
      });

      return updated;
    }
  );

  // Admin: Approve KYC verification
  fastify.post(
    '/verify/approve',
    { preHandler: requireRole('admin') },
    async (request, reply) => {
      const schema = z.object({
        sellerId: z.string().uuid(),
      });

      const { sellerId } = schema.parse(request.body);

      const sellerProfile = await db.sellerProfile.update({
        where: { id: sellerId },
        data: {
          verified: true,
          kycStatus: 'verified',
        },
      });

      return sellerProfile;
    }
  );
};

export default sellerRoutes;
