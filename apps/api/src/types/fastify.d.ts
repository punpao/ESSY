import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: import('fastify').FastifyRequestHandler;
    authorize: (roles: Array<'buyer' | 'seller' | 'admin'>) => import('fastify').FastifyRequestHandler;
  }
  interface FastifyRequest {
    user: {
      id: string;
      role: 'buyer' | 'seller' | 'admin';
      email: string;
    };
  }
}
