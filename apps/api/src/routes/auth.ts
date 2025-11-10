import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const EmailRequestSchema = z.object({
  email: z.string().email(),
});

const EmailVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const LineCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

// Mock OTP storage (in production, use Redis with TTL)
const otpStore = new Map<string, string>();

export async function authRoutes(fastify: FastifyInstance) {
  // Request email OTP (magic link simulation)
  fastify.post("/auth/email/request", async (request, reply) => {
    const body = EmailRequestSchema.parse(request.body);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(body.email, otp);

    // In production, send email via SendGrid/Mailgun
    console.log(`[OTP] Email: ${body.email}, Code: ${otp}`);

    // Auto-expire after 10 minutes
    setTimeout(() => otpStore.delete(body.email), 10 * 60 * 1000);

    return reply.send({
      success: true,
      message: "OTP sent to email (check console in dev mode)",
      dev_otp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  });

  // Verify email OTP
  fastify.post("/auth/email/verify", async (request, reply) => {
    const body = EmailVerifySchema.parse(request.body);

    const storedOtp = otpStore.get(body.email);
    if (!storedOtp || storedOtp !== body.otp) {
      return reply.code(401).send({ error: "Invalid or expired OTP" });
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: body.email,
          display_name: body.email.split("@")[0],
          role: "buyer",
          kyc_level: "none",
        },
      });
    }

    // Clear OTP
    otpStore.delete(body.email);

    // Sign JWT
    const token = fastify.jwt.sign({
      userId: user.id,
      role: user.role,
    });

    return reply.send({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
      },
    });
  });

  // LINE OAuth callback
  fastify.post("/auth/line/callback", async (request, reply) => {
    const body = LineCallbackSchema.parse(request.body);

    // In production, exchange code for LINE access token
    // and fetch user profile from LINE API
    // For now, mock it:
    const mockLineSub = `LINE_${Date.now()}`;
    const mockProfile = {
      displayName: "Thai User",
      pictureUrl: "https://example.com/avatar.jpg",
    };

    // Find or create user
    let user = await prisma.user.findUnique({ where: { line_sub: mockLineSub } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          line_sub: mockLineSub,
          display_name: mockProfile.displayName,
          role: "buyer",
          kyc_level: "none",
        },
      });
    }

    // Sign JWT
    const token = fastify.jwt.sign({
      userId: user.id,
      role: user.role,
    });

    return reply.send({
      success: true,
      token,
      user: {
        id: user.id,
        display_name: user.display_name,
        role: user.role,
      },
    });
  });

  // Get current user
  fastify.get(
    "/auth/me",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const payload = request.user as { userId: string; role: string };
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          seller_profile: true,
        },
      });

      if (!user) {
        return reply.code(404).send({ error: "User not found" });
      }

      return reply.send({ user });
    }
  );
}
