import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../db';
import { config } from '../config';
import type { UserRole } from '@essy/core';

export interface AuthUser {
  id: string;
  role: UserRole;
  email?: string | null;
  lineSub?: string | null;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function requireAuth(request: FastifyRequest): Promise<AuthUser> {
  if (!request.user) {
    throw new Error('Unauthorized');
  }
  return request.user;
}

export async function requireRole(request: FastifyRequest, role: UserRole | UserRole[]): Promise<AuthUser> {
  const user = await requireAuth(request);
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}

export async function setupAuth(fastify: FastifyInstance) {
  await fastify.register(require('@fastify/jwt'), {
    secret: config.jwtSecret,
  });

  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: any) {
    try {
      const decoded = await request.jwtVerify<AuthUser>();
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new Error('User not found');
      }

      request.user = {
        id: user.id,
        role: user.role as UserRole,
        email: user.email,
        lineSub: user.lineSub,
      };
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}
