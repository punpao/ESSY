import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { authenticate, requireRole } from "../auth";

const verifyBasicSchema = z.object({
  promptpay_id: z.string().min(10).max(13),
  promptpay_name: z.string().min(1),
});

export async function sellerRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/seller/me",
    { preHandler: [authenticate, requireRole(["seller", "admin"])] },
    async (request, reply) => {
      const profile = await prisma.sellerProfile.findUnique({
        where: { user_id: request.user!.id },
        include: { user: true },
      });

      if (!profile) {
        return reply.status(404).send({ error: "Seller profile not found" });
      }

      return profile;
    }
  );

  fastify.post(
    "/seller/verify/basic",
    { preHandler: [authenticate, requireRole(["seller", "admin"])] },
    async (request, reply) => {
      const { promptpay_id, promptpay_name } = verifyBasicSchema.parse(request.body);
      // Mock selfie upload - in production, validate liveness
      const selfieUrl = "https://mock-s3.com/selfie.jpg"; // Mock URL

      let profile = await prisma.sellerProfile.findUnique({
        where: { user_id: request.user!.id },
      });

      if (profile) {
        profile = await prisma.sellerProfile.update({
          where: { user_id: request.user!.id },
          data: {
            promptpay_id,
            promptpay_name,
            kyc_status: "pending",
          },
        });
      } else {
        profile = await prisma.sellerProfile.create({
          data: {
            user_id: request.user!.id,
            promptpay_id,
            promptpay_name,
            kyc_status: "pending",
            verified: false,
          },
        });
      }

      return { profile, selfieUrl };
    }
  );

  fastify.post(
    "/seller/verify/approve",
    { preHandler: [authenticate, requireRole(["admin"])] },
    async (request, reply) => {
      const { userId } = z.object({ userId: z.string() }).parse(request.body);
      const profile = await prisma.sellerProfile.update({
        where: { user_id: userId },
        data: {
          verified: true,
          kyc_status: "verified",
        },
      });

      return profile;
    }
  );
}
