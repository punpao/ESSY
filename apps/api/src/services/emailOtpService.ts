import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const OTP_TTL_MINUTES = 10;

export class EmailOtpService {
  constructor(private prisma: PrismaClient) {}

  async request(email: string) {
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.prisma.emailOtp.create({
      data: {
        email,
        code,
        expiresAt
      }
    });

    return { email, code, expiresAt };
  }

  async verify(email: string, code: string) {
    const record = await this.prisma.emailOtp.findFirst({
      where: {
        email,
        code,
        consumed: false
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!record) {
      return { valid: false, reason: "not_found" as const };
    }

    if (record.expiresAt.getTime() < Date.now()) {
      return { valid: false, reason: "expired" as const };
    }

    await this.prisma.emailOtp.update({
      where: { id: record.id },
      data: { consumed: true }
    });

    return { valid: true };
  }
}
