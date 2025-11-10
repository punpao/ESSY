import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../index';

export interface AuthUser {
  id: string;
  role: 'buyer' | 'seller' | 'admin';
  email?: string | null;
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AuthUser> {
  try {
    await request.jwtVerify();
    const userId = (request.user as { id: string }).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    });

    if (!user) {
      return reply.status(401).send({ error: 'User not found' });
    }

    return user;
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

export async function requireRole(
  request: FastifyRequest,
  reply: FastifyReply,
  allowedRoles: ('buyer' | 'seller' | 'admin')[]
): Promise<AuthUser> {
  const user = await authenticate(request, reply);
  if (!allowedRoles.includes(user.role)) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
  return user;
}
