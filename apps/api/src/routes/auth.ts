import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createAccessToken } from "../utils/auth";
import { UserRole } from "@prisma/client";

export default async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/line/callback",
    {
      schema: {
        body: z.object({
          code: z.string(),
          role: z.nativeEnum(UserRole).optional(),
          profile: z
            .object({
              lineSub: z.string().optional(),
              displayName: z.string().optional(),
              email: z.string().email().optional()
            })
            .optional()
        })
      }
    },
    async (request, reply) => {
      const body = request.body as {
        code: string;
        role?: UserRole;
        profile?: { lineSub?: string; displayName?: string; email?: string };
      };

      const desiredRole = body.role && body.role !== "admin" ? body.role : "buyer";

      let lineSub = body.profile?.lineSub ?? null;
      let displayName = body.profile?.displayName ?? null;
      let email = body.profile?.email ?? null;

      if (!lineSub) {
        if (app.log) {
          app.log.warn("LINE profile not provided, falling back to mock profile");
        }
        lineSub = `mock-${body.code}`;
        displayName = displayName ?? "LINE ผู้ใช้";
        email = email ?? `${lineSub}@mock.line`;
      }

      const user = await app.prisma.user.upsert({
        where: { lineSub },
        update: {
          displayName: displayName ?? "LINE ผู้ใช้",
          email: email ?? undefined
        },
        create: {
          lineSub,
          displayName: displayName ?? "LINE ผู้ใช้",
          email: email ?? undefined,
          role: desiredRole,
          kycLevel: "basic"
        }
      });

      if (user.role === "seller") {
        await app.prisma.sellerProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            promptPayId: "",
            promptPayName: user.displayName,
            kycStatus: "unverified",
            verified: false
          }
        });
      }

      const token = createAccessToken(app, {
        sub: user.id,
        displayName: user.displayName,
        role: user.role
      });

      reply.send({
        token,
        user
      });
    }
  );

  app.post(
    "/auth/email/request",
    {
      schema: {
        body: z.object({
          email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง")
        })
      }
    },
    async (request, reply) => {
      const { email } = request.body as { email: string };
      const otp = await app.emailOtp.request(email);
      reply.send({
        message: "เราได้ส่งรหัสยืนยันไปยังอีเมลของคุณ (สำหรับเดโมจะแสดงใน response)",
        code: otp.code,
        expiresAt: otp.expiresAt
      });
    }
  );

  app.post(
    "/auth/email/verify",
    {
      schema: {
          body: z.object({
            email: z.string().email(),
            code: z.string().min(6).max(6),
            role: z.enum(["buyer", "seller", "admin"]).optional()
          })
      }
    },
    async (request, reply) => {
      const { email, code, role = "buyer" } = request.body as {
        email: string;
        code: string;
        role?: "buyer" | "seller" | "admin";
      };

      const result = await app.emailOtp.verify(email, code);
      if (!result.valid) {
        reply.code(400).send({
          message:
            result.reason === "expired"
              ? "รหัสหมดอายุแล้ว"
              : "รหัสยืนยันไม่ถูกต้อง"
        });
        return;
      }

      const existing = await app.prisma.user.findUnique({
        where: { email }
      });

      if (role === "admin" && existing?.role !== "admin") {
        reply.code(403).send({ message: "ไม่อนุญาตให้สร้างบัญชี admin ใหม่" });
        return;
      }

      const user =
        existing
          ? await app.prisma.user.update({
              where: { email },
              data: {
                displayName: existing.displayName || email,
                role: existing.role
              }
            })
          : await app.prisma.user.create({
              data: {
                email,
                displayName: email.split("@")[0],
                role: role === "admin" ? "buyer" : role
              }
            });

      if (role === "seller") {
        await app.prisma.sellerProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            promptPayId: "",
            promptPayName: user.displayName,
            kycStatus: "unverified",
            verified: false
          }
        });
      }

      const token = createAccessToken(app, {
        sub: user.id,
        displayName: user.displayName,
        role: user.role
      });

      reply.send({
        token,
        user
      });
    }
  );
}
