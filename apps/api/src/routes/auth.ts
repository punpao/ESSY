import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import bcrypt from 'bcrypt';

const emailRequestSchema = z.object({
  email: z.string().email(),
});

const emailVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const lineCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /auth/email/request - Request OTP
  fastify.post('/email/request', async (request, reply) => {
    const { email } = emailRequestSchema.parse(request.body);

    // Generate 6-digit code (mock - in production send via email)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(code, 10);

    // Store in Redis with 10 min expiry
    await fastify.redis.setex(`otp:${email}`, 600, hashedCode);

    // In development, log the code
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OTP] Email: ${email}, Code: ${code}`);
    }

    return { success: true, message: 'OTP sent (check console in dev mode)' };
  });

  // POST /auth/email/verify - Verify OTP
  fastify.post('/email/verify', async (request, reply) => {
    const { email, code } = emailVerifySchema.parse(request.body);

    const storedHash = await fastify.redis.get(`otp:${email}`);
    if (!storedHash) {
      return reply.code(400).send({ error: 'OTP expired or invalid' });
    }

    const isValid = await bcrypt.compare(code, storedHash);
    if (!isValid) {
      return reply.code(400).send({ error: 'Invalid OTP' });
    }

    // Delete OTP
    await fastify.redis.del(`otp:${email}`);

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          display_name: email.split('@')[0],
          role: 'buyer',
          kyc_level: 'none',
        },
      });
    }

    // Generate JWT
    const token = fastify.jwt.sign({
      id: user.id,
      role: user.role,
      email: user.email,
      displayName: user.display_name,
    });

    return {
      token,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        displayName: user.display_name,
      },
    };
  });

  // POST /auth/line/callback - LINE OAuth callback
  fastify.post('/line/callback', async (request, reply) => {
    const { code } = lineCallbackSchema.parse(request.body);

    // Mock LINE OAuth exchange (in production, call LINE API)
    // For demo, extract user info from code (format: line_<userId>)
    const lineSub = code.startsWith('line_') ? code : `line_${code}`;

    let user = await prisma.user.findUnique({ where: { line_sub: lineSub } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          line_sub: lineSub,
          display_name: `LINE User ${lineSub.substring(0, 8)}`,
          role: 'buyer',
          kyc_level: 'none',
        },
      });
    }

    const token = fastify.jwt.sign({
      id: user.id,
      role: user.role,
      email: user.email,
      displayName: user.display_name,
    });

    return {
      token,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        displayName: user.display_name,
      },
    };
  });

  // GET /auth/me - Get current user
  fastify.get('/me', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = request.user as any;
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          seller_profile: true,
        },
      });

      if (!dbUser) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return {
        id: dbUser.id,
        role: dbUser.role,
        email: dbUser.email,
        displayName: dbUser.display_name,
        kycLevel: dbUser.kyc_level,
        sellerProfile: dbUser.seller_profile,
      };
    },
  });
};
