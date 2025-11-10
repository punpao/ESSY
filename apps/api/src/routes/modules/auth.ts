import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

const lineCallbackSchema = z.object({
  code: z.string().min(1),
  lineSub: z.string().min(1),
  email: z.string().email().optional(),
  displayName: z.string().min(1),
  role: z.enum(['buyer', 'seller', 'admin']).optional()
});

const emailRequestSchema = z.object({
  email: z.string().email()
});

const emailVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
});

const otpStore = new Map<string, { code: string; expiresAt: number }>();

export async function authRoutes(app: FastifyInstance) {
  app.post('/line/callback', async (request, reply) => {
    const body = lineCallbackSchema.parse(request.body);
    const user = await prisma.user.upsert({
      where: { lineSub: body.lineSub },
      create: {
        lineSub: body.lineSub,
        email: body.email ?? `${body.lineSub}@line.local`,
        displayName: body.displayName,
        role: body.role ?? 'buyer'
      },
      update: {
        displayName: body.displayName,
        email: body.email ?? `${body.lineSub}@line.local`
      }
    });
    const token = await reply.jwtSign({ userId: user.id });
    return reply.send({ token, user });
  });

  app.post('/email/request', async (request, reply) => {
    const { email } = emailRequestSchema.parse(request.body);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
    app.log.info({ email, code }, '[OTP] issuing code (mock email)');
    return reply.send({ ok: true });
  });

  app.post('/email/verify', async (request, reply) => {
    const { email, code } = emailVerifySchema.parse(request.body);
    const entry = otpStore.get(email);
    if (!entry || entry.code !== code || entry.expiresAt < Date.now()) {
      return reply.status(400).send({ error: 'รหัสไม่ถูกต้องหรือหมดอายุ' });
    }
    otpStore.delete(email);

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        displayName: email.split('@')[0],
        role: 'buyer'
      },
      update: {}
    });

    const token = await reply.jwtSign({ userId: user.id });
    return reply.send({ token, user });
  });
}
