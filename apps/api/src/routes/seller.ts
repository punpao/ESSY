import { FastifyInstance } from "fastify";
import { VerifyBasicKycSchema } from "@thai-escrow/core";
import { prisma } from "../lib/prisma";
import { requireRole } from "../lib/jwt";

export async function sellerRoutes(fastify: FastifyInstance) {
  // Get seller profile
  fastify.get(
    "/seller/me",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const user = request.user as { userId: string; role: string };

      const profile = await prisma.sellerProfile.findUnique({
        where: { user_id: user.userId },
        include: {
          user: true,
          reputation_events: {
            orderBy: { created_at: "desc" },
            take: 10,
          },
        },
      });

      if (!profile) {
        // Create a default seller profile if user is seller
        const userData = await prisma.user.findUnique({ where: { id: user.userId } });
        if (userData?.role === "seller") {
          const newProfile = await prisma.sellerProfile.create({
            data: {
              user_id: user.userId,
            },
            include: {
              user: true,
            },
          });
          return reply.send({ profile: newProfile });
        }
        return reply.code(404).send({ error: "Seller profile not found" });
      }

      return reply.send({ profile });
    }
  );

  // Submit basic KYC verification
  fastify.post(
    "/seller/verify/basic",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const user = request.user as { userId: string; role: string };
      const body = VerifyBasicKycSchema.parse(request.body);

      // Update user role to seller if not already
      await prisma.user.update({
        where: { id: user.userId },
        data: { role: "seller", kyc_level: "basic" },
      });

      // Create or update seller profile
      const profile = await prisma.sellerProfile.upsert({
        where: { user_id: user.userId },
        update: {
          promptpay_id: body.promptpay_id,
          promptpay_name: body.promptpay_name,
          selfie_url: body.selfie_url,
          kyc_status: "pending",
        },
        create: {
          user_id: user.userId,
          promptpay_id: body.promptpay_id,
          promptpay_name: body.promptpay_name,
          selfie_url: body.selfie_url,
          kyc_status: "pending",
        },
      });

      return reply.send({
        success: true,
        profile,
        message: "KYC submitted for review",
      });
    }
  );

  // Admin: Approve KYC
  fastify.post(
    "/seller/verify/approve",
    {
      onRequest: [
        fastify.authenticate,
        async (request) => await requireRole(["admin"])(request),
      ],
    },
    async (request, reply) => {
      const { seller_id } = request.body as { seller_id: string };

      const profile = await prisma.sellerProfile.update({
        where: { id: seller_id },
        data: {
          verified: true,
          kyc_status: "verified",
        },
      });

      return reply.send({
        success: true,
        profile,
      });
    }
  );
}
