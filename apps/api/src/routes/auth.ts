import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { ulid } from 'ulid';

const RequestOTPSchema = z.object({
  email: z.string().email(),
});

const VerifyOTPSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const LineCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

// In-memory OTP storage (use Redis in production)
const otpStore = new Map<string, { otp: string; expires: number }>();

export default async function authRoutes(fastify: FastifyInstance) {
  // Request OTP via email
  fastify.post('/auth/email/request', async (request, reply) => {
    const body = RequestOTPSchema.parse(request.body);
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    otpStore.set(body.email, { otp, expires });
    
    // In production, send email via SES/SendGrid
    fastify.log.info(`OTP for ${body.email}: ${otp}`);
    
    return { message: 'OTP sent to email', dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined };
  });

  // Verify OTP and login
  fastify.post('/auth/email/verify', async (request, reply) => {
    const body = VerifyOTPSchema.parse(request.body);
    
    const stored = otpStore.get(body.email);
    if (!stored || stored.otp !== body.otp || stored.expires < Date.now()) {
      return reply.code(401).send({ error: 'Invalid or expired OTP' });
    }
    
    // Remove used OTP
    otpStore.delete(body.email);
    
    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: body.email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: body.email,
          display_name: body.email.split('@')[0],
          role: 'buyer',
          kyc_level: 'none',
        },
      });
    }
    
    // Generate JWT
    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    
    return { token, user };
  });

  // LINE OAuth callback (mock implementation)
  fastify.post('/auth/line/callback', async (request, reply) => {
    const body = LineCallbackSchema.parse(request.body);
    
    // In production, exchange code for LINE profile
    // For MVP, create mock user
    const mockLineSub = `line_${ulid()}`;
    const mockEmail = `${mockLineSub}@line.example`;
    
    let user = await prisma.user.findUnique({ where: { line_sub: mockLineSub } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: mockEmail,
          line_sub: mockLineSub,
          display_name: 'LINE User',
          role: 'buyer',
          kyc_level: 'none',
        },
      });
    }
    
    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    
    return { token, user };
  });
}
