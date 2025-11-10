import type { FastifyInstance } from "fastify";
import { z } from "zod";

export default async function sellerRoutes(app: FastifyInstance) {
  app.get(
    "/seller/me",
    {
      preHandler: [app.authenticate]
    },
    async (request, reply) => {
      if (!request.user) {
        reply.code(401).send({ message: "กรุณาเข้าสู่ระบบ" });
        return;
      }

      const profile = await app.prisma.sellerProfile.findUnique({
        where: { userId: request.user.sub },
        include: {
          user: true
        }
      });

      if (!profile) {
        reply.code(404).send({ message: "ยังไม่มีโปรไฟล์ผู้ขาย" });
        return;
      }

      reply.send({
        profile
      });
    }
  );

  app.post(
    "/seller/verify/basic",
    {
      preHandler: [app.authenticate, app.authorize(["seller"])],
      schema: {
        body: z.object({
          promptPayId: z.string().min(5, "ระบุ PromptPay ID"),
          promptPayName: z.string().min(2, "ระบุชื่อบัญชี PromptPay"),
          selfieUrl: z.string().url("ใส่ URL รูปเซลฟี่"),
          note: z.string().optional()
        })
      }
    },
    async (request, reply) => {
      const sellerId = request.user?.sub;
      if (!sellerId) {
        reply.code(401).send({ message: "กรุณาเข้าสู่ระบบ" });
        return;
      }

      const { promptPayId, promptPayName, selfieUrl, note } = request.body as {
        promptPayId: string;
        promptPayName: string;
        selfieUrl: string;
        note?: string;
      };

      const profile = await app.prisma.sellerProfile.upsert({
        where: { userId: sellerId },
        update: {
          promptPayId,
          promptPayName,
          kycStatus: "pending",
          kycSelfieUrl: selfieUrl,
          kycSubmittedAt: new Date()
        },
        create: {
          userId: sellerId,
          promptPayId,
          promptPayName,
          kycStatus: "pending",
          kycSelfieUrl: selfieUrl,
          kycSubmittedAt: new Date()
        }
      });

      reply.send({
        message: "ส่งข้อมูลยืนยันตัวตนเรียบร้อย ทีมงานจะตรวจสอบภายใน 24 ชม.",
        profile
      });
    }
  );

  app.post(
    "/seller/verify/approve",
    {
      preHandler: [app.authenticate, app.authorize(["admin"])],
      schema: {
        body: z.object({
          sellerUserId: z.string().uuid()
        })
      }
    },
    async (request, reply) => {
      const { sellerUserId } = request.body as { sellerUserId: string };

      const profile = await app.prisma.sellerProfile.update({
        where: { userId: sellerUserId },
        data: {
          verified: true,
          kycStatus: "verified"
        }
      });

      await app.prisma.user.update({
        where: { id: sellerUserId },
        data: {
          kycLevel: "full"
        }
      });

      reply.send({
        message: "อนุมัติผู้ขายแล้ว",
        profile
      });
    }
  );
}
