import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import formBody from '@fastify/formbody';
import { env } from './env';
import { prismaPlugin } from './plugins/prisma';
import { authPlugin } from './plugins/auth';
import { routesPlugin } from './routes';
import { registerWorkers } from './workers';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }
      cb(null, true);
    },
    credentials: true,
  });
  await app.register(sensible);
  await app.register(formBody);
  await app.register(prismaPlugin);
  await app.register(authPlugin);
  await app.register(routesPlugin, { prefix: '/api/v1' });

  app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));

  registerWorkers(app, env);

  return app;
}
