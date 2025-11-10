import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../lib/auth";

const verifyBasicSchema = z.object({
  promptpay_id: z.string().min(10).max(13),
  promptpay_name: z.string().min(1),
});

export async function sellerRoutes(fastify: FastifyInstance) {
  // Get seller profile
  fastify.get("/me", { preHandler: requireAuth(["seller", "admin"]) }, async (request) => {
    const user = await requireAuth(["seller", "admin"])(request);

    let profile = await prisma.sellerProfile.findUnique({
      where: { user_id: user.id },
    });

    if (!profile) {
      // Create profile if doesn't exist
      profile = await prisma.sellerProfile.create({
        data: {
          user_id: user.id,
          promptpay_id: "",
          promptpay_name: "",
        },
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    return {
      ...profile,
      user: {
        id: dbUser?.id,
        display_name: dbUser?.display_name,
        kyc_level: dbUser?.kyc_level,
      },
    };
  });

  // Submit basic KYC
  fastify.post("/verify/basic", { preHandler: requireAuth() }, async (request) => {
    const user = await requireAuth()(request);
    const body = verifyBasicSchema.parse(request.body);

    // Mock file upload - in production, upload to S3
    const data = await request.file();
    const selfieUrl = data
      ? `https://mock-s3.example.com/kyc/${user.id}/${Date.now()}.jpg`
      : null;

    let profile = await prisma.sellerProfile.findUnique({
      where: { user_id: user.id },
    });

    if (!profile) {
      profile = await prisma.sellerProfile.create({
        data: {
          user_id: user.id,
          promptpay_id: body.promptpay_id,
          promptpay_name: body.promptpay_name,
          kyc_status: "pending",
        },
      });
    } else {
      profile = await prisma.sellerProfile.update({
        where: { user_id: user.id },
        data: {
          promptpay_id: body.promptpay_id,
          promptpay_name: body.promptpay_name,
          kyc_status: "pending",
        },
      });
    }

    // Update user KYC level
    await prisma.user.update({
      where: { id: user.id },
      data: { kyc_level: "basic" },
    });

    return {
      success: true,
      profile,
      selfie_url: selfieUrl,
      message: "KYC submitted for review",
    };
  });

  // Admin approve KYC
  fastify.post("/verify/approve", { preHandler: requireAuth(["admin"]) }, async (request) => {
    const admin = request.user!;
    const { userId } = z.object({ userId: z.string().uuid() }).parse(request.body);

    const profile = await prisma.sellerProfile.update({
      where: { user_id: userId },
      data: {
        verified: true,
        kyc_status: "verified",
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { kyc_level: "full" },
    });

    return { success: true, profile };
  });
}

  });
}
