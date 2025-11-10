import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { AppConfig } from '../config.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
    authorize: (roles: Array<'buyer' | 'seller' | 'admin'>) => any;
  }

  interface FastifyRequest {
    user: {
      id: string;
      role: 'buyer' | 'seller' | 'admin';
    };
  }
}

interface AuthPluginOptions {
  config: AppConfig;
}

export default fp<AuthPluginOptions>(async (fastify, { config }) => {
  await fastify.register(fastifyJwt, {
    secret: config.jwtSecret
  });

  fastify.decorate('authenticate', async (request: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      throw fastify.httpErrors.unauthorized('ไม่พบสิทธิ์เข้าใช้งาน');
    }
  });

  fastify.decorate('authorize', (roles: Array<'buyer' | 'seller' | 'admin'>) => {
    return async (request: any) => {
      if (!request.user || !roles.includes(request.user.role)) {
        throw fastify.httpErrors.forbidden('คุณไม่มีสิทธิ์เข้าถึง');
      }
    };
  });
});
