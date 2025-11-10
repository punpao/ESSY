import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getLineUser } from '../services/line.js';
import { generateOtpCode, storeOtp, verifyOtp } from '../services/otp.js';
import { AppConfig } from '../config.js';

export const authRoutes = async (fastify: FastifyInstance, config: AppConfig) => {
  const lineSchema = z.object({
    code: z.string(),
    redirectUri: z.string().url()
  });

  fastify.post('/api/v1/auth/line/callback', async (request, reply) => {
    const { code, redirectUri } = lineSchema.parse(request.body);
    try {
      const lineProfile = await getLineUser(config, code, redirectUri);
      const roleOverride =
        config.lineChannelId === 'demo' && code.startsWith('demo-')
          ? (code.replace('demo-', '') as 'buyer' | 'seller' | 'admin')
          : undefined;
      const desiredRole: 'buyer' | 'seller' | 'admin' =
        roleOverride ?? 'buyer';
      const prismaUser = await fastify.prisma.user.upsert({
        where: {
          lineSub: lineProfile.sub
        },
        update: {
          displayName: lineProfile.name ?? 'ผู้ใช้ LINE',
          role: roleOverride ? desiredRole : undefined
        },
        create: {
          lineSub: lineProfile.sub,
          email: lineProfile.email ?? null,
          displayName: lineProfile.name ?? 'ผู้ใช้ LINE',
          role: desiredRole
        }
      });
      const token = fastify.jwt.sign({ id: prismaUser.id, role: prismaUser.role });
      return reply.send({
        token,
        user: {
          id: prismaUser.id,
          role: prismaUser.role,
          displayName: prismaUser.displayName
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(400).send({ message: 'ไม่สามารถยืนยันตัวตนกับ LINE ได้' });
    }
  });

  const requestOtpSchema = z.object({
    email: z.string().email()
  });

  fastify.post('/api/v1/auth/email/request', async (request, reply) => {
    const { email } = requestOtpSchema.parse(request.body);
    const code = generateOtpCode();
    const expiresAt = await storeOtp(fastify.prisma, email, code);
    fastify.log.info({ email, code }, 'OTP for email login (mock send)');
    return reply.send({
      message: 'เราได้ส่งรหัสเข้าอีเมลของคุณ (จำลอง)',
      expiresAt,
      otpPreview: code
    });
  });

  const verifySchema = z.object({
    email: z.string().email(),
    code: z.string().length(6)
  });

  fastify.post('/api/v1/auth/email/verify', async (request, reply) => {
    const { email, code } = verifySchema.parse(request.body);
    const valid = await verifyOtp(fastify.prisma, email, code);
    if (!valid) {
      return reply.code(400).send({ message: 'รหัสไม่ถูกต้องหรือหมดอายุ' });
    }

    const user = await fastify.prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        role: 'buyer',
        displayName: email.split('@')[0]
      }
    });

    const token = fastify.jwt.sign({ id: user.id, role: user.role });
    return reply.send({
      token,
      user: {
        id: user.id,
        role: user.role,
        displayName: user.displayName
      }
    });
  });
};
