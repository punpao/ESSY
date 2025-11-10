import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../lib/auth";

const lineCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

const emailRequestSchema = z.object({
  email: z.string().email(),
});

const emailVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function authRoutes(fastify: FastifyInstance) {
  // LINE OAuth callback
  fastify.post("/line/callback", async (request: FastifyRequest) => {
    const body = lineCallbackSchema.parse(request.body);

    // Mock LINE OAuth - in production, exchange code for token
    const mockLineSub = `line_${Date.now()}`;
    const mockDisplayName = `User_${mockLineSub.slice(-6)}`;

    let user = await prisma.user.findUnique({
      where: { line_sub: mockLineSub },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          line_sub: mockLineSub,
          display_name: mockDisplayName,
          role: "buyer",
        },
      });
    }

    const token = fastify.jwt.sign({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    return { token, user: { id: user.id, role: user.role, display_name: user.display_name } };
  });

  // Email OTP request
  fastify.post("/email/request", async (request: FastifyRequest) => {
    const { email } = emailRequestSchema.parse(request.body);

    // Mock OTP - in production, send email
    const mockOtp = "123456";
    console.log(`[MOCK] OTP for ${email}: ${mockOtp}`);

    return { success: true, message: "OTP sent (check console)" };
  });

  // Email OTP verify
  fastify.post("/email/verify", async (request: FastifyRequest) => {
    const { email, otp } = emailVerifySchema.parse(request.body);

    // Mock verification - accept any 6-digit OTP
    if (otp.length !== 6) {
      return { success: false, error: "Invalid OTP" };
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          display_name: email.split("@")[0],
          role: "buyer",
        },
      });
    }

    const token = fastify.jwt.sign({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    return { token, user: { id: user.id, role: user.role, display_name: user.display_name } };
  });

  // Get current user
  fastify.get("/me", { preHandler: requireAuth() }, async (request) => {
    const user = request.user!;
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        role: true,
        email: true,
        line_sub: true,
        display_name: true,
        kyc_level: true,
      },
    });

    return dbUser;
  });
}
