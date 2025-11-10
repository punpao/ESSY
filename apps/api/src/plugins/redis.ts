import fp from 'fastify-plugin';
import { redis as createRedisClient } from '../services/redis.js';
import type { AppConfig } from '../config.js';

declare module 'fastify' {
  interface FastifyInstance {
    redis: ReturnType<typeof createRedisClient>;
  }
}

interface RedisPluginOptions {
  config: AppConfig;
}

export default fp<RedisPluginOptions>(async (fastify, { config }) => {
  const redis = createRedisClient(config.redisUrl);
  fastify.decorate('redis', redis);
  fastify.addHook('onClose', async () => {
    await redis.quit();
  });
});
