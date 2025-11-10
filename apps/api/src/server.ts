import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import formbody from '@fastify/formbody';
import { authPlugin } from './plugins/auth';
import { registerRoutes } from './routes';

export async function buildServer() {
  const app = Fastify({
    logger: {
      transport: process.env.NODE_ENV === 'production' ? undefined : {
        target: 'pino-pretty',
        options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' }
      }
    }
  });

  await app.register(cors, {
    origin: true,
    credentials: true
  });
  await app.register(formbody);
  await app.register(multipart);
  await app.register(authPlugin);
  await registerRoutes(app);
  return app;
}
