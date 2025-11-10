import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppConfig } from '../config.js';

const sellerProfileResponse = (profile: any) => ({
  id: profile.id,
  verified: profile.verified,
  promptpayId: profile.promptpayId,
  promptpayName: profile.promptpayName,
  kycStatus: profile.kycStatus,
  reputationScore: profile.reputationScore,
  kycSelfieUrl: profile.kycSelfieUrl,
  promptpayProofUrl: profile.promptpayProofUrl,
  createdAt: profile.createdAt
});

export const sellerRoutes = async (fastify: FastifyInstance, _config: AppConfig) => {
  fastify.get(
    '/api/v1/seller/me',
    { preHandler: [fastify.authenticate, fastify.authorize(['seller', 'admin'])] },
    async (request, reply) => {
      const profile = await fastify.prisma.sellerProfile.findUnique({
        where: { userId: request.user.id }
      });
      if (!profile) {
        return reply.code(404).send({ message: 'ยังไม่ได้ส่งข้อมูล KYC' });
      }
      return reply.send({
        seller: sellerProfileResponse(profile)
      });
    }
  );

  fastify.get(
    '/api/v1/seller/deals',
    { preHandler: [fastify.authenticate, fastify.authorize(['seller'])] },
    async (request, reply) => {
      const deals = await fastify.prisma.deal.findMany({
        where: { sellerId: request.user.id },
        include: {
          payment: true,
          dispute: true
        },
        orderBy: { createdAt: 'desc' },
        take: 30
      });

      return reply.send({ deals });
    }
  );

  const verifySchema = z.object({
    promptpayId: z.string().min(6),
    promptpayName: z.string().min(2),
    selfieUrl: z.string().url(),
    promptpayProofUrl: z.string().url().optional()
  });

  fastify.post(
    '/api/v1/seller/verify/basic',
    { preHandler: [fastify.authenticate, fastify.authorize(['buyer', 'seller'])] },
    async (request, reply) => {
      const { promptpayId, promptpayName, selfieUrl, promptpayProofUrl } = verifySchema.parse(
        request.body
      );

      const seller = await fastify.prisma.sellerProfile.upsert({
        where: { userId: request.user.id },
        update: {
          promptpayId,
          promptpayName,
          kycSelfieUrl: selfieUrl,
          promptpayProofUrl: promptpayProofUrl ?? null,
          kycStatus: 'PENDING'
        },
        create: {
          userId: request.user.id,
          promptpayId,
          promptpayName,
          kycSelfieUrl: selfieUrl,
          promptpayProofUrl: promptpayProofUrl ?? null,
          kycStatus: 'PENDING'
        }
      });

      await fastify.prisma.user.update({
        where: { id: request.user.id },
        data: {
          role: 'seller',
          kycLevel: 'BASIC'
        }
      });

      return reply.send({
        message: 'ส่งข้อมูลยืนยันตัวตนเรียบร้อย ทีมงานจะตรวจสอบภายใน 1 วันทำการ',
        seller: sellerProfileResponse(seller)
      });
    }
  );

  const approveSchema = z.object({
    sellerUserId: z.string().uuid(),
    verifiedPromptpayName: z.string().min(2)
  });

  fastify.post(
    '/api/v1/seller/verify/approve',
    { preHandler: [fastify.authenticate, fastify.authorize(['admin'])] },
    async (request, reply) => {
      const { sellerUserId, verifiedPromptpayName } = approveSchema.parse(request.body);

      const seller = await fastify.prisma.sellerProfile.update({
        where: { userId: sellerUserId },
        data: {
          verified: true,
          kycStatus: 'VERIFIED',
          promptpayName: verifiedPromptpayName
        }
      });

      await fastify.prisma.user.update({
        where: { id: sellerUserId },
        data: {
          role: 'seller',
          kycLevel: 'FULL'
        }
      });

      return reply.send({
        message: 'ยืนยันผู้ขายแล้ว',
        seller: sellerProfileResponse(seller)
      });
    }
  );
};
