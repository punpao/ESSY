import '@fastify/jwt';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request: FastifyRequest) => Promise<void>;
    authorize: (roles: Array<'buyer' | 'seller' | 'admin'>) => (request: FastifyRequest) => Promise<void>;
  }

  interface FastifyRequest {
    user: { userId: string; role: 'buyer' | 'seller' | 'admin' };
  }
}
