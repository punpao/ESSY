import { FastifyRequest } from 'fastify';
import { prisma } from './db';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export async function authenticate(request: FastifyRequest): Promise<AuthUser> {
  try {
    await request.jwtVerify();
    return request.user as AuthUser;
  } catch (err) {
    throw new Error('Unauthorized');
  }
}

export function requireRole(role: string) {
  return async (request: FastifyRequest) => {
    const user = await authenticate(request);
    if (user.role !== role && user.role !== 'admin') {
      throw new Error('Forbidden');
    }
    return user;
  };
}

export async function getUserWithProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      seller_profile: true,
    },
  });
}
