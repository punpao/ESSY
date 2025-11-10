import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

const verifySchema = z.object({
  promptpayId: z.string().min(5),
  promptpayName: z.string().min(2),
  selfieUrl: z.string().url().optional()
});

const approveSchema = z.object({
  userId: z.string().uuid()
});

export async function sellerRoutes(app: FastifyInstance) {
  app.get(
    '/me',
    { preHandler: app.authorize(['seller', 'admin']) },
    async (request) => {
      const seller = await prisma.user.findUnique({
        where: { id: request.user.id },
        include: {
          sellerProfile: true
        }
      });
      return { seller };
    }
  );

  app.post(
    '/verify/basic',
    { preHandler: app.authorize(['seller']) },
    async (request, reply) => {
      const body = verifySchema.parse(request.body);
      const profile = await prisma.sellerProfile.upsert({
        where: { userId: request.user.id },
        update: {
          promptpayId: body.promptpayId,
          promptpayName: body.promptpayName,
          kycStatus: 'pending'
        },
        create: {
          userId: request.user.id,
          promptpayId: body.promptpayId,
          promptpayName: body.promptpayName,
          kycStatus: 'pending'
        }
      });
      app.log.info({ userId: request.user.id, profileId: profile.id }, 'Seller submitted basic KYC');
      return reply.send({ profile });
    }
  );

  app.get(
    '/deals',
    { preHandler: app.authorize(['seller']) },
    async (request) => {
      const deals = await prisma.deal.findMany({
        where: { sellerId: request.user.id },
        include: {
          buyer: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return { deals };
    }
  );

  app.post(
    '/verify/approve',
    { preHandler: app.authorize(['admin']) },
    async (request) => {
      const body = approveSchema.parse(request.body);
      const profile = await prisma.sellerProfile.update({
        where: { userId: body.userId },
        data: {
          kycStatus: 'verified',
          verified: true
        }
      });
      await prisma.user.update({
        where: { id: body.userId },
        data: {
          kycLevel: 'full'
        }
      });
      return { profile };
    }
  );
}
