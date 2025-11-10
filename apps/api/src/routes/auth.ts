import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { config } from '../config';

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
  fastify.post('/line/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = lineCallbackSchema.parse(request.body);

    // Mock LINE OAuth - in production, exchange code for token
    // For MVP, we'll simulate a LINE user
    const mockLineSub = `line_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockDisplayName = 'LINE User';

    let user = await prisma.user.findUnique({
      where: { lineSub: mockLineSub },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          lineSub: mockLineSub,
          displayName: mockDisplayName,
          role: 'buyer',
        },
      });
    }

    const token = fastify.jwt.sign({ id: user.id, role: user.role });

    return { token, user: { id: user.id, role: user.role, displayName: user.displayName } };
  });

  // Email OTP request
  fastify.post('/email/request', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = emailRequestSchema.parse(request.body);

    // Mock OTP generation - in production, send via email service
    const mockOtp = '123456'; // In production, generate random 6-digit OTP

    // Store OTP in session/Redis (simplified for MVP)
    // For MVP, we'll just return success

    return { success: true, message: 'OTP sent to email (mock: 123456)' };
  });

  // Email OTP verify
  fastify.post('/email/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, otp } = emailVerifySchema.parse(request.body);

    // Mock verification - in production, verify against stored OTP
    if (otp !== '123456') {
      return reply.status(400).send({ error: 'Invalid OTP' });
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

    const token = fastify.jwt.sign({ id: user.id, role: user.role });

    return { token, user: { id: user.id, role: user.role, displayName: user.displayName } };
  });
}
