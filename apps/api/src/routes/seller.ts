import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireRole } from "../lib/auth";

const VerifyBasicSchema = z.object({
  promptpayId: z.string().min(10).max(13),
  promptpayName: z.string().min(1),
  selfieUrl: z.string().url().optional(), // In production, handle file upload
});

export async function sellerRoutes(fastify: FastifyInstance) {
  // Get seller profile
  fastify.get(
    "/me",
    { preHandler: requireRole("seller", "admin") },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const profile = await prisma.sellerProfile.findUnique({
        where: { userId: user.id },
        include: { user: { select: { id: true, displayName: true, email: true } } },
      });

      if (!profile) {
        return reply.status(404).send({ error: "Seller profile not found" });
      }

      return profile;
    }
  );

  // Submit basic KYC (PromptPay + selfie)
  fastify.post(
    "/verify/basic",
    { preHandler: requireRole("seller", "admin") },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const data = VerifyBasicSchema.parse(request.body);

      // Update or create seller profile
      const profile = await prisma.sellerProfile.upsert({
        where: { userId: user.id },
        update: {
          promptpayId: data.promptpayId,
          promptpayName: data.promptpayName,
          kycStatus: "pending",
        },
        create: {
          userId: user.id,
          promptpayId: data.promptpayId,
          promptpayName: data.promptpayName,
          kycStatus: "pending",
          verified: false,
        },
      });

      // Update user role if needed
      if (user.role === "buyer") {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "seller", kycLevel: "basic" },
        });
      }

      return profile;
    }
  );

  // Admin approve seller verification
  fastify.post(
    "/verify/approve",
    { preHandler: requireRole("admin") },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = z.object({ userId: z.string().uuid() }).parse(request.body);

      const profile = await prisma.sellerProfile.update({
        where: { userId },
        data: {
          verified: true,
          kycStatus: "verified",
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { kycLevel: "full" },
      });

      return profile;
    }
  );
}
