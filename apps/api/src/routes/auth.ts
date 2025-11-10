import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../lib/db';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // LINE OAuth callback (simplified - in production use full OAuth flow)
  fastify.post('/line/callback', async (request, reply) => {
    const schema = z.object({
      lineSub: z.string(),
      email: z.string().email(),
      displayName: z.string(),
    });

    const { lineSub, email, displayName } = schema.parse(request.body);

    // Find or create user
    let user = await db.user.findUnique({ where: { lineSub } });

    if (!user) {
      user = await db.user.create({
        data: {
          lineSub,
          email,
          displayName,
          role: 'buyer',
          kycLevel: 'none',
        },
      });
    }

    // Generate JWT
    const token = fastify.jwt.sign({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    return { token, user };
  });

  // Email OTP request (simplified - in production send real OTP via email)
  fastify.post('/email/request', async (request, reply) => {
    const schema = z.object({
      email: z.string().email(),
    });

    const { email } = schema.parse(request.body);

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // In production: store OTP in Redis with expiry and send email
    // For MVP, we'll just log it
    console.log(`[OTP] ${email} -> ${otp}`);

    // Store in memory or Redis (simplified for MVP)
    // For demo purposes, accept any 6-digit code

    return { message: 'OTP sent to email', email };
  });

  // Email OTP verify
  fastify.post('/email/verify', async (request, reply) => {
    const schema = z.object({
      email: z.string().email(),
      otp: z.string().length(6),
      displayName: z.string().optional(),
    });

    const { email, otp, displayName } = schema.parse(request.body);

    // For MVP, accept any 6-digit code
    if (!/^\d{6}$/.test(otp)) {
      return reply.status(400).send({ error: 'Invalid OTP' });
    }

    // Find or create user
    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      user = await db.user.create({
        data: {
          email,
          displayName: displayName || email.split('@')[0],
          role: 'buyer',
          kycLevel: 'none',
        },
      });
    }

    // Generate JWT
    const token = fastify.jwt.sign({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    return { token, user };
  });
};

export default authRoutes;
