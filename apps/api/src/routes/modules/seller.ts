import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const sellerVerifySchema = z.object({
  promptpayId: z.string().min(5).max(30),
  promptpayName: z.string().min(2).max(100),
  selfieUrl: z.string().url(),
});

const sellerApproveSchema = z.object({
  sellerId: z.string().uuid(),
});

export const sellerRoutes: FastifyPluginAsync = async (app) => {
  app.get('/me', { preHandler: [app.authenticate] }, async (request) => {
    const { userId } = request.user;
    const user = await app.prisma.user.findUnique({
      where: { id: userId },
      include: { sellerProfile: true },
    });
    if (!user) {
      throw app.httpErrors.notFound('User not found');
    }
    return user;
  });

  app.post(
    '/verify/basic',
    { preHandler: [app.authorize(['seller'])] },
    async (request) => {
      const body = sellerVerifySchema.parse(request.body);
      const { userId } = request.user;

      const profile = await app.prisma.sellerProfile.upsert({
        where: { userId },
        update: {
          promptpayId: body.promptpayId,
          promptpayName: body.promptpayName,
          selfieUrl: body.selfieUrl,
          kycStatus: 'pending',
        },
        create: {
          userId,
          promptpayId: body.promptpayId,
          promptpayName: body.promptpayName,
          selfieUrl: body.selfieUrl,
          verified: false,
          kycStatus: 'pending',
        },
      });

      return {
        message: 'ส่งข้อมูลยืนยันตัวตนเรียบร้อย รอตรวจสอบภายใน 1 วัน',
        profile,
      };
    }
  );

  app.post(
    '/verify/approve',
    { preHandler: [app.authorize(['admin'])] },
    async (request) => {
      const body = sellerApproveSchema.parse(request.body);
      const profile = await app.prisma.sellerProfile.update({
        where: { userId: body.sellerId },
        data: {
          verified: true,
          kycStatus: 'verified',
        },
      });
      return { profile };
    }
  );
};
