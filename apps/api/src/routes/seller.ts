import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../config/database";
import { authenticate, requireRole } from "../middleware/auth";

const verifyBasicSchema = z.object({
  promptpayId: z.string().min(10),
  promptpayName: z.string().min(1),
  selfieUrl: z.string().url().optional(), // In production, handle file upload
});

const approveVerifySchema = z.object({
  userId: z.string().uuid(),
  approved: z.boolean(),
});

export async function sellerRoutes(fastify: FastifyInstance) {
  // Get seller profile
  fastify.get(
    "/seller/me",
    { preHandler: [authenticate, requireRole("seller", "admin")] },
    async (request, reply) => {
      const userId = request.user!.id;

      let profile = await prisma.sellerProfile.findUnique({
        where: { userId },
        include: { user: true },
      });

      if (!profile) {
        // Create default profile
        profile = await prisma.sellerProfile.create({
          data: {
            userId,
            promptpayId: "",
            promptpayName: "",
          },
          include: { user: true },
        });
      }

      return profile;
    }
  );

  // Submit basic KYC
  fastify.post(
    "/seller/verify/basic",
    { preHandler: [authenticate, requireRole("seller", "admin")] },
    async (request, reply) => {
      const userId = request.user!.id;
      const { promptpayId, promptpayName, selfieUrl } = verifyBasicSchema.parse(request.body);

      // Update or create seller profile
      const profile = await prisma.sellerProfile.upsert({
        where: { userId },
        create: {
          userId,
          promptpayId,
          promptpayName,
          kycStatus: "pending",
        },
        update: {
          promptpayId,
          promptpayName,
          kycStatus: "pending",
        },
      });

      // Update user KYC level
      await prisma.user.update({
        where: { id: userId },
        data: { kycLevel: "basic" },
      });

      return { success: true, profile };
    }
  );

  // Admin approve verification
  fastify.post(
    "/seller/verify/approve",
    { preHandler: [authenticate, requireRole("admin")] },
    async (request, reply) => {
      const { userId, approved } = approveVerifySchema.parse(request.body);

      const profile = await prisma.sellerProfile.update({
        where: { userId },
        data: {
          verified: approved,
          kycStatus: approved ? "verified" : "unverified",
        },
      });

      if (approved) {
        await prisma.user.update({
          where: { id: userId },
          data: { kycLevel: "full" },
        });
      }

      return { success: true, profile };
    }
  );
}
