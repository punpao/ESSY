import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from './prisma';

export interface AuthUser {
  id: string;
  role: 'buyer' | 'seller' | 'admin';
  email: string | null;
  display_name: string;
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AuthUser | null> {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return null;
    }

    // In production, verify JWT token
    // For MVP, simple token lookup
    const user = await prisma.user.findFirst({
      where: {
        id: token, // Simplified - use JWT in production
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      role: user.role as 'buyer' | 'seller' | 'admin',
      email: user.email,
      display_name: user.display_name,
    };
  } catch (error) {
    return null;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AuthUser> {
  const user = await authenticate(request, reply);
  if (!user) {
    reply.code(401).send({ error: 'Unauthorized' });
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireRole(
  request: FastifyRequest,
  reply: FastifyReply,
  roles: ('buyer' | 'seller' | 'admin')[]
): Promise<AuthUser> {
  const user = await requireAuth(request, reply);
  if (!roles.includes(user.role)) {
    reply.code(403).send({ error: 'Forbidden' });
    throw new Error('Forbidden');
  }
  return user;
}
