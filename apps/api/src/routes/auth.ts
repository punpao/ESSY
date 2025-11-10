import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ulid } from "ulid";

const LineCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

const EmailRequestSchema = z.object({
  email: z.string().email(),
});

const EmailVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function authRoutes(fastify: FastifyInstance) {
  // LINE OAuth callback
  fastify.post("/line/callback", async (request: FastifyRequest, reply: FastifyReply) => {
    const body = LineCallbackSchema.parse(request.body);

    // Mock LINE OAuth - in production, exchange code for token
    const mockLineSub = `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockDisplayName = `User ${mockLineSub.slice(-6)}`;

    let user = await prisma.user.findUnique({
      where: { lineSub: mockLineSub },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          lineSub: mockLineSub,
          displayName: mockDisplayName,
          role: "buyer",
        },
      });
    }

    const token = fastify.jwt.sign({ id: user.id, role: user.role });

    return { token, user: { id: user.id, role: user.role, displayName: user.displayName } };
  });

  // Email OTP request
  fastify.post("/email/request", async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = EmailRequestSchema.parse(request.body);

    // Mock OTP - in production, send via email service
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[MOCK] OTP for ${email}: ${otp}`);

    // Store OTP in memory (in production, use Redis with TTL)
    (fastify as any).otpStore = (fastify as any).otpStore || {};
    (fastify as any).otpStore[email] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };

    return { message: "OTP sent (check console in dev mode)" };
  });

  // Email OTP verify
  fastify.post("/email/verify", async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, otp } = EmailVerifySchema.parse(request.body);

    const otpStore = (fastify as any).otpStore || {};
    const stored = otpStore[email];

    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
      return reply.status(400).send({ error: "Invalid or expired OTP" });
    }

    delete otpStore[email];

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          displayName: email.split("@")[0],
          role: "buyer",
        },
      });
    }

    const token = fastify.jwt.sign({ id: user.id, role: user.role });

    return { token, user: { id: user.id, role: user.role, displayName: user.displayName } };
  });
}
