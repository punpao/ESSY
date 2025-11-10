import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { config } from "../config";

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
  // LINE OAuth callback (mock implementation)
  fastify.post("/auth/line/callback", async (request, reply) => {
    const body = lineCallbackSchema.parse(request.body);
    // Mock LINE user data
    const mockLineUser = {
      sub: `line_${Date.now()}`,
      name: "LINE User",
      email: `line_${Date.now()}@example.com`,
    };

    let user = await prisma.user.findUnique({
      where: { line_sub: mockLineUser.sub },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          line_sub: mockLineUser.sub,
          email: mockLineUser.email,
          display_name: mockLineUser.name,
          role: "buyer",
        },
      });
    }

    const token = fastify.jwt.sign({
      id: user.id,
      role: user.role,
      email: user.email,
      display_name: user.display_name,
    });

    return { token, user };
  });

  // Email OTP request (mock - just generates OTP)
  fastify.post("/auth/email/request", async (request, reply) => {
    const { email } = emailRequestSchema.parse(request.body);
    // In production, send OTP via email/SMS
    // For MVP, return mock OTP
    const otp = "123456"; // Mock OTP
    return { otp, message: "OTP sent (mock)" };
  });

  // Email OTP verify
  fastify.post("/auth/email/verify", async (request, reply) => {
    const { email, otp } = emailVerifySchema.parse(request.body);
    // Mock verification
    if (otp !== "123456") {
      return reply.status(400).send({ error: "Invalid OTP" });
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
      display_name: user.display_name,
    });

    return { token, user };
  });
}
