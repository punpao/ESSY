import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../../services/authService';

const lineCallbackSchema = z.object({
  code: z.string().min(1),
  lineSub: z.string().min(1),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
});

const requestEmailSchema = z.object({
  email: z.string().email(),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  const authService = new AuthService(app.prisma);

  app.post('/line/callback', async (request, reply) => {
    const body = lineCallbackSchema.parse(request.body);
    const user = await authService.handleLineLogin({
      lineSub: body.lineSub,
      email: body.email,
      displayName: body.displayName,
    });

    const token = await app.jwt.sign({
      userId: user.id,
      role: user.role,
    });

    return reply.send({
      token,
      user,
    });
  });

  app.post('/email/request', async (request, reply) => {
    const body = requestEmailSchema.parse(request.body);
    const { code, expiresAt } = await authService.requestEmailOtp(body.email);

    app.log.info({ email: body.email, code }, 'OTP generated');

    return reply.send({
      message: 'ส่งรหัสยืนยันไปที่อีเมลแล้ว',
      expiresAt,
      debugCode: code,
    });
  });

  app.post('/email/verify', async (request, reply) => {
    const body = verifyEmailSchema.parse(request.body);
    const user = await authService.verifyEmailOtp(body.email, body.code);
    const token = await app.jwt.sign({
      userId: user.id,
      role: user.role,
    });
    return reply.send({ token, user });
  });
};
