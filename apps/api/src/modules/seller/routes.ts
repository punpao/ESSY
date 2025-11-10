import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";

const sellerVerifySchema = z.object({
  promptpay_id: z.string().min(4),
  promptpay_name: z.string().min(2),
  selfie_url: z.string().url(),
  phone: z.string().min(8).max(12).optional()
});

const sellerApproveSchema = z.object({
  seller_id: z.string().uuid()
});

export async function registerSellerRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/seller/me",
    { preHandler: fastify.authorize(["seller", "admin"]) },
    async (request) => {
      const userId = request.user.userId;

      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId },
        include: {
          user: true
        }
      });

      if (!sellerProfile) {
        return {
          profile: null
        };
      }

      return {
        profile: sellerProfile
      };
    }
  );

  fastify.post(
    "/seller/verify/basic",
    {
      preHandler: fastify.authorize(["seller"]),
      schema: {
        body: sellerVerifySchema
      }
    },
    async (request, reply) => {
      const sellerId = request.user.userId;
      const body = request.body as z.infer<typeof sellerVerifySchema>;

      const profile = await prisma.sellerProfile.upsert({
        where: { userId: sellerId },
        update: {
          promptpayId: body.promptpay_id,
          promptpayName: body.promptpay_name,
          kycStatus: "pending",
          selfieUrl: body.selfie_url
        },
        create: {
          userId: sellerId,
          verified: false,
          promptpayId: body.promptpay_id,
          promptpayName: body.promptpay_name,
          selfieUrl: body.selfie_url,
          reputationScore: 0,
          kycStatus: "pending"
        }
      });

      if (body.phone) {
        await prisma.user.update({
          where: { id: sellerId },
          data: { phone: body.phone }
        });
      }

      return reply.send({ profile, message: "ยื่นข้อมูลเรียบร้อย ทีมงานจะตรวจสอบภายใน 1 วันทำการ" });
    }
  );

  fastify.post(
    "/seller/verify/approve",
    {
      preHandler: fastify.authorize(["admin"]),
      schema: {
        body: sellerApproveSchema
      }
    },
    async (request) => {
      const { seller_id } = request.body as z.infer<typeof sellerApproveSchema>;

      const profile = await prisma.sellerProfile.update({
        where: { userId: seller_id },
        data: {
          verified: true,
          kycStatus: "verified"
        }
      });

      await prisma.user.update({
        where: { id: seller_id },
        data: { kycLevel: "basic" }
      });

      return { profile, message: "Seller verified" };
    }
  );

  fastify.get(
    "/seller/deals",
    {
      preHandler: fastify.authorize(["seller"]),
      schema: {
        querystring: z.object({
          status: z.string().optional()
        })
      }
    },
    async (request) => {
      const sellerId = request.user.userId;
      const { status } = request.query as { status?: string };

      const deals = await prisma.deal.findMany({
        where: {
          sellerId,
          status: status as any
        },
        orderBy: { createdAt: "desc" },
        include: {
          payments: true,
          disputes: true
        }
      });

      return { deals };
    }
  );
}
