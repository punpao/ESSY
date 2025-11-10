import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function authRoutes(fastify: FastifyInstance) {
  // LINE OAuth callback (simplified for MVP)
  fastify.post('/auth/line/callback', async (request, reply) => {
    const body = z
      .object({
        code: z.string(),
        state: z.string().optional(),
      })
      .parse(request.body);

    // Mock LINE OAuth - in production, exchange code for token
    // For MVP, create/find user by line_sub
    const lineSub = `line_${body.code}`; // Mock sub

    let user = await prisma.user.findUnique({
      where: { line_sub: lineSub },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          line_sub: lineSub,
          display_name: 'LINE User',
          role: 'buyer',
        },
      });
    }

    // Return simple token (use JWT in production)
    return { token: user.id, user };
  });

  // Email OTP request
  fastify.post('/auth/email/request', async (request, reply) => {
    const body = z
      .object({
        email: z.string().email(),
      })
      .parse(request.body);

    // Mock OTP - in production, send email
    // For MVP, just return success
    return { success: true, message: 'OTP sent (mock)' };
  });

  // Email OTP verify
  fastify.post('/auth/email/verify', async (request, reply) => {
    const body = z
      .object({
        email: z.string().email(),
        otp: z.string(),
      })
      .parse(request.body);

    // Mock verification - in production, verify OTP
    let user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: body.email,
          display_name: body.email.split('@')[0],
          role: 'buyer',
        },
      });
    }

    return { token: user.id, user };
  });
}
