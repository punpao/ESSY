import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { config } from '../config';
import { prisma } from '../lib/prisma';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string };
    user: { userId: string };
  }
}

export const authPlugin = fp(async (fastify) => {
  await fastify.register(fastifyJwt, {
    secret: config.jwtSecret
  });

  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = await prisma.user.findUnique({
        where: { id: request.user.userId }
      });
      if (!user) {
        reply.unauthorized();
        return;
      }
      request.user = {
        id: user.id,
        role: user.role,
        email: user.email
      };
    } catch (err) {
      reply.unauthorized();
    }
  });

  fastify.decorate('authorize', (roles: Array<'buyer' | 'seller' | 'admin'>) => {
    return async (request, reply) => {
      await fastify.authenticate(request, reply);
      if (!roles.includes(request.user.role)) {
        reply.forbidden();
      }
    };
  });
});
