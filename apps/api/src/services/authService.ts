import { randomInt } from 'crypto';
import { PrismaClient } from '@prisma/client';

interface OtpEntry {
  code: string;
  expiresAt: number;
}

export class AuthService {
  private otpStore = new Map<string, OtpEntry>();

  constructor(private prisma: PrismaClient) {}

  async handleLineLogin(params: {
    lineSub: string;
    email?: string;
    displayName?: string;
  }) {
    const user = await this.prisma.user.upsert({
      where: { lineSub: params.lineSub },
      update: {
        email: params.email ?? undefined,
        displayName: params.displayName ?? undefined,
      },
      create: {
        lineSub: params.lineSub,
        email: params.email ?? `${params.lineSub}@line.local`,
        displayName: params.displayName ?? 'ผู้ใช้ LINE',
        role: 'buyer',
        kycLevel: 'none',
      },
    });

    return user;
  }

  async requestEmailOtp(email: string) {
    const code = randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    this.otpStore.set(email.toLowerCase(), { code, expiresAt });
    return { code, expiresAt };
  }

  async verifyEmailOtp(email: string, code: string) {
    const entry = this.otpStore.get(email.toLowerCase());
    if (!entry) {
      throw new Error('No OTP requested');
    }
    if (entry.expiresAt < Date.now()) {
      this.otpStore.delete(email.toLowerCase());
      throw new Error('OTP expired');
    }
    if (entry.code !== code) {
      throw new Error('Invalid OTP');
    }
    this.otpStore.delete(email.toLowerCase());

    const user = await this.prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: {},
      create: {
        email: email.toLowerCase(),
        role: 'buyer',
        kycLevel: 'none',
        displayName: email.split('@')[0],
      },
    });

    return user;
  }
}
