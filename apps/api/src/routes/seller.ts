import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../lib/auth';
import { z } from 'zod';

export async function sellerRoutes(fastify: FastifyInstance) {
  // Get seller profile
  fastify.get('/seller/me', async (request, reply) => {
    const user = await requireRole(request, reply, ['seller', 'admin']);

    const profile = await prisma.sellerProfile.findUnique({
      where: { user_id: user.id },
      include: {
        user: true,
      },
    });

    if (!profile) {
      reply.code(404).send({ error: 'Seller profile not found' });
      return;
    }

    return profile;
  });

  // Submit basic KYC (PromptPay + selfie)
  fastify.post('/seller/verify/basic', async (request, reply) => {
    const user = await requireRole(request, reply, ['seller', 'admin']);

    const body = z
      .object({
        promptpay_id: z.string().min(10),
        promptpay_name: z.string().min(1),
        selfie_url: z.string().url().optional(), // Mock - accept URL
      })
      .parse(request.body);

    let profile = await prisma.sellerProfile.findUnique({
      where: { user_id: user.id },
    });

    if (profile) {
      profile = await prisma.sellerProfile.update({
        where: { user_id: user.id },
        data: {
          promptpay_id: body.promptpay_id,
          promptpay_name: body.promptpay_name,
          kyc_status: 'pending',
        },
      });
    } else {
      profile = await prisma.sellerProfile.create({
        data: {
          user_id: user.id,
          promptpay_id: body.promptpay_id,
          promptpay_name: body.promptpay_name,
          kyc_status: 'pending',
          verified: false,
        },
      });
    }

    // Update user KYC level
    await prisma.user.update({
      where: { id: user.id },
      data: {
        kyc_level: 'basic',
      },
    });

    return profile;
  });

  // Admin approve seller verification
  fastify.post('/seller/verify/approve', async (request, reply) => {
    const admin = await requireRole(request, reply, ['admin']);

    const body = z
      .object({
        seller_id: z.string().uuid(),
      })
      .parse(request.body);

    const profile = await prisma.sellerProfile.update({
      where: { user_id: body.seller_id },
      data: {
        verified: true,
        kyc_status: 'verified',
      },
    });

    await prisma.user.update({
      where: { id: body.seller_id },
      data: {
        kyc_level: 'full',
      },
    });

    return profile;
  });
}
