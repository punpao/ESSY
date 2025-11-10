import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  role: UserRole;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    request.user = request.user as AuthUser;
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    
    if (!request.user || !roles.includes(request.user.role)) {
      reply.status(403).send({ error: 'Forbidden' });
    }
  };
}
