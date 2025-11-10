import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../config/database";
import { generateToken } from "../utils/jwt";

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
  fastify.post("/auth/line/callback", async (request, reply) => {
    const body = lineCallbackSchema.parse(request.body);

    // Mock LINE OAuth - in production, exchange code for access token
    // For MVP, just create/find user with line_sub
    const lineSub = `line_${Date.now()}`; // Mock LINE user ID

    let user = await prisma.user.findUnique({
      where: { lineSub },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          lineSub,
          role: "buyer",
          displayName: `LINE User ${lineSub.substring(0, 8)}`,
        },
      });
    }

    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email || undefined,
    });

    return { token, user: { id: user.id, role: user.role, displayName: user.displayName } };
  });

  // Email OTP request
  fastify.post("/auth/email/request", async (request, reply) => {
    const { email } = emailRequestSchema.parse(request.body);

    // Mock OTP - in production, send email with OTP
    // For MVP, just return success (OTP would be sent via email service)
    return {
      success: true,
      message: "OTP sent to email (mock - check console in dev)",
      // In dev, you might log the OTP
      otp: process.env.NODE_ENV === "development" ? "123456" : undefined,
    };
  });

  // Email OTP verify
  fastify.post("/auth/email/verify", async (request, reply) => {
    const { email, otp } = emailVerifySchema.parse(request.body);

    // Mock verification - in production, verify OTP from store
    if (otp !== "123456" && process.env.NODE_ENV !== "development") {
      reply.code(400).send({ error: "Invalid OTP" });
      return;
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          role: "buyer",
          displayName: email.split("@")[0],
        },
      });
    }

    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email || undefined,
    });

    return { token, user: { id: user.id, role: user.role, displayName: user.displayName } };
  });
}
