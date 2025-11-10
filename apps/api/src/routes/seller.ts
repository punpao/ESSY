import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate } from '../auth';

const VerifyBasicSchema = z.object({
  promptpay_id: z.string().min(10),
  promptpay_name: z.string().min(1),
  selfie_url: z.string().url().optional(),
});

export default async function sellerRoutes(fastify: FastifyInstance) {
  // Get seller profile
  fastify.get('/seller/me', async (request, reply) => {
    const user = await authenticate(request);
    
    let profile = await prisma.sellerProfile.findUnique({
      where: { user_id: user.id },
      include: {
        reputation_events: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });
    
    // Create profile if doesn't exist
    if (!profile) {
      profile = await prisma.sellerProfile.create({
        data: {
          user_id: user.id,
          verified: false,
          kyc_status: 'unverified',
          reputation_score: 0,
        },
        include: {
          reputation_events: true,
        },
      });
      
      // Update user role to seller
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'seller' },
      });
    }
    
    return { profile };
  });

  // Submit basic verification
  fastify.post('/seller/verify/basic', async (request, reply) => {
    const user = await authenticate(request);
    const body = VerifyBasicSchema.parse(request.body);
    
    let profile = await prisma.sellerProfile.findUnique({
      where: { user_id: user.id },
    });
    
    if (!profile) {
      profile = await prisma.sellerProfile.create({
        data: {
          user_id: user.id,
          verified: false,
          kyc_status: 'pending',
          promptpay_id: body.promptpay_id,
          promptpay_name: body.promptpay_name,
        },
      });
    } else {
      profile = await prisma.sellerProfile.update({
        where: { user_id: user.id },
        data: {
          kyc_status: 'pending',
          promptpay_id: body.promptpay_id,
          promptpay_name: body.promptpay_name,
        },
      });
    }
    
    // Update user KYC level
    await prisma.user.update({
      where: { id: user.id },
      data: { kyc_level: 'basic' },
    });
    
    return { profile, message: 'Verification submitted. Pending admin approval.' };
  });

  // Approve verification (admin only)
  fastify.post('/seller/verify/approve', async (request, reply) => {
    const user = await authenticate(request);
    const { seller_id } = request.body as { seller_id: string };
    
    if (user.role !== 'admin') {
      return reply.code(403).send({ error: 'Admin only' });
    }
    
    const profile = await prisma.sellerProfile.findUnique({
      where: { user_id: seller_id },
    });
    
    if (!profile) {
      return reply.code(404).send({ error: 'Seller profile not found' });
    }
    
    const updatedProfile = await prisma.sellerProfile.update({
      where: { user_id: seller_id },
      data: {
        verified: true,
        kyc_status: 'verified',
      },
    });
    
    return { profile: updatedProfile };
  });
}
