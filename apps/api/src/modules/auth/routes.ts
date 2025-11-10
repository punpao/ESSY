import { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import { randomInt } from "crypto";
import { UserRole } from "@escrow/core";

const lineCallbackSchema = z.object({
  line_sub: z.string().min(6),
  display_name: z.string().min(1),
  email: z.string().email().optional(),
  picture_url: z.string().url().optional(),
  role: z.enum(["buyer", "seller", "admin"]).default("buyer")
});

const emailRequestSchema = z.object({
  email: z.string().email(),
  role: z.enum(["buyer", "seller"]).default("buyer")
});

const emailVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  role: z.enum(["buyer", "seller"]).default("buyer")
});

function issueToken(fastify: FastifyInstance, userId: string, role: UserRole) {
  return fastify.jwt.sign({ userId, role }, { expiresIn: "7d" });
}

async function ensureSellerProfile(userId: string) {
  const existing = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!existing) {
    await prisma.sellerProfile.create({
      data: {
        userId,
        verified: false,
        promptpayId: "",
        promptpayName: "",
        reputationScore: 0,
        kycStatus: "unverified"
      }
    });
  }
}

export async function registerAuthRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/auth/line/callback",
    {
      schema: {
        body: lineCallbackSchema
      }
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof lineCallbackSchema>;

      let user = await prisma.user.findFirst({
        where: {
          OR: [{ lineSub: body.line_sub }, { email: body.email ?? undefined }]
        }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            role: body.role,
            displayName: body.display_name,
            lineSub: body.line_sub,
            email: body.email,
            phone: null,
            kycLevel: "none"
          }
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            lineSub: body.line_sub,
            displayName: body.display_name,
            email: body.email ?? user.email
          }
        });
      }

      if (user.role === "seller") {
        await ensureSellerProfile(user.id);
      }

      const token = issueToken(fastify, user.id, user.role as UserRole);
      return reply.send({ token, user });
    }
  );

  fastify.post(
    "/auth/email/request",
    {
      schema: {
        body: emailRequestSchema
      }
    },
    async (request, reply) => {
      const { email, role } = request.body as z.infer<typeof emailRequestSchema>;

      const code = randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

      await prisma.emailOtp.create({
        data: {
          email,
          code,
          role,
          expiresAt
        }
      });

      // In real world we would send email. For MVP echo.
      request.log.info({ email, code }, "Generated OTP");
      return reply.send({ ok: true, expiresAt });
    }
  );

  fastify.post(
    "/auth/email/verify",
    {
      schema: {
        body: emailVerifySchema
      }
    },
    async (request, reply) => {
      const { email, code, role } = request.body as z.infer<typeof emailVerifySchema>;

      const otp = await prisma.emailOtp.findFirst({
        where: {
          email,
          code,
          consumedAt: null,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: "desc" }
      });

      if (!otp) {
        return reply.badRequest("โค้ดไม่ถูกต้องหรือหมดอายุแล้ว");
      }

      await prisma.emailOtp.update({
        where: { id: otp.id },
        data: { consumedAt: new Date() }
      });

      let user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            displayName: email.split("@")[0] ?? "ผู้ใช้",
            role,
            kycLevel: "none",
            lineSub: null,
            phone: null
          }
        });
      } else if (role === "seller" && user.role !== "seller") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: "seller" }
        });
      }

      if (user.role === "seller") {
        await ensureSellerProfile(user.id);
      }

      const token = issueToken(fastify, user.id, user.role as UserRole);
      return reply.send({ token, user });
    }
  );
}
