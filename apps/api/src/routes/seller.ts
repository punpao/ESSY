import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth } from '../auth';

const verifyBasicSchema = z.object({
  promptpayId: z.string().min(10),
  promptpayName: z.string().min(2),
  selfieUrl: z.string().url().optional(),
});

const approveSchema = z.object({
  sellerProfileId: z.string().uuid(),
});

export const sellerRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /seller/me - Get seller profile
  fastify.get('/me', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = requireAuth(request);

      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { user_id: user.id },
        include: {
          reputation_events: {
            orderBy: { created_at: 'desc' },
            take: 10,
          },
        },
      });

      if (!sellerProfile) {
        return reply.code(404).send({ error: 'Seller profile not found' });
      }

      return sellerProfile;
    },
  });

  // POST /seller/verify/basic - Submit basic KYC
  fastify.post('/verify/basic', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = requireAuth(request);
      const { promptpayId, promptpayName, selfieUrl } = verifyBasicSchema.parse(request.body);

      // Update user to seller role if not already
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'seller',
          kyc_level: 'basic',
        },
      });

      // Create or update seller profile
      const sellerProfile = await prisma.sellerProfile.upsert({
        where: { user_id: user.id },
        create: {
          user_id: user.id,
          promptpay_id: promptpayId,
          promptpay_name: promptpayName,
          kyc_status: 'pending',
          verified: false,
          reputation_score: 0,
        },
        update: {
          promptpay_id: promptpayId,
          promptpay_name: promptpayName,
          kyc_status: 'pending',
        },
      });

      return {
        success: true,
        sellerProfile,
        message: 'KYC submitted for review',
      };
    },
  });

  // POST /seller/verify/approve - Admin approves seller (admin only)
  fastify.post('/verify/approve', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = requireAuth(request);
      if (user.role !== 'admin') {
        return reply.code(403).send({ error: 'Admin only' });
      }

      const { sellerProfileId } = approveSchema.parse(request.body);

      const sellerProfile = await prisma.sellerProfile.update({
        where: { id: sellerProfileId },
        data: {
          kyc_status: 'verified',
          verified: true,
        },
      });

      return {
        success: true,
        sellerProfile,
      };
    },
  });
};
