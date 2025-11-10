import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const OTP_TTL_MINUTES = 10;

export const generateOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const hashCode = (code: string) =>
  crypto.createHash('sha256').update(code).digest('hex');

export const storeOtp = async (prisma: PrismaClient, email: string, code: string) => {
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await prisma.emailOtp.create({
    data: {
      email: email.toLowerCase(),
      codeHash: hashCode(code),
      expiresAt
    }
  });
  return expiresAt;
};

export const verifyOtp = async (prisma: PrismaClient, email: string, code: string) => {
  const record = await prisma.emailOtp.findFirst({
    where: {
      email: email.toLowerCase(),
      consumedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!record) {
    return false;
  }

  const valid = record.codeHash === hashCode(code);
  if (!valid) {
    return false;
  }

  await prisma.emailOtp.update({
    where: { id: record.id },
    data: { consumedAt: new Date() }
  });
  return true;
};
