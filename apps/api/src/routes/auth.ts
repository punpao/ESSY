import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { config } from '../config';
import { ulid } from 'ulid';
import { z } from 'zod';

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
  // LINE OAuth callback
  fastify.post('/auth/line/callback', async (request, reply) => {
    const body = lineCallbackSchema.parse(request.body);

    // Mock LINE OAuth - in production, exchange code for access token
    // For MVP, we'll simulate a LINE user
    const mockLineSub = `line_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    let user = await prisma.user.findUnique({
      where: { lineSub: mockLineSub },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          lineSub: mockLineSub,
          displayName: `LINE User ${mockLineSub.substring(0, 8)}`,
          role: 'buyer',
        },
      });
    }

    const token = fastify.jwt.sign({
      id: user.id,
      role: user.role,
      email: user.email,
      lineSub: user.lineSub,
    });

    return { token, user: { id: user.id, role: user.role, displayName: user.displayName } };
  });

  // Email OTP request
  fastify.post('/auth/email/request', async (request, reply) => {
    const { email } = emailRequestSchema.parse(request.body);

    // Mock OTP generation - in production, send email
    const otp = '123456'; // For demo, always return same OTP

    // Store OTP in session/redis (simplified for MVP)
    // In production, use Redis with TTL

    return { message: 'OTP sent to email', otp: otp }; // Remove otp in production
  });

  // Email OTP verify
  fastify.post('/auth/email/verify', async (request, reply) => {
    const { email, otp } = emailVerifySchema.parse(request.body);

    // Mock verification - in production, verify from Redis
    if (otp !== '123456') {
      return reply.code(400).send({ error: 'Invalid OTP' });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          displayName: email.split('@')[0],
          role: 'buyer',
        },
      });
    }

    const token = fastify.jwt.sign({
      id: user.id,
      role: user.role,
      email: user.email,
      lineSub: user.lineSub,
    });

    return { token, user: { id: user.id, role: user.role, displayName: user.displayName } };
  });
}
