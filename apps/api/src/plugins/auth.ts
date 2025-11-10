import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { env } from '../env';

type Role = 'buyer' | 'seller' | 'admin';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; role: Role };
    user: { userId: string; role: Role };
  }
}

export const authPlugin = fp(async (app) => {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  app.decorate('authenticate', async (request) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      throw app.httpErrors.unauthorized('Authentication required');
    }
  });

  app.decorate('authorize', (roles: Role[]) => {
    return async (request: any) => {
      await app.authenticate(request);
      const user = request.user as { role: Role };
      if (!roles.includes(user.role)) {
        throw app.httpErrors.forbidden('Insufficient role');
      }
    };
  });
});
