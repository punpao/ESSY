import fp from 'fastify-plugin';
import { Queue } from 'bullmq';

declare module 'fastify' {
  interface FastifyInstance {
    queues: {
      autoRelease: Queue;
      reputation: Queue;
    };
  }
}

export default fp(async (fastify) => {
  const connection = fastify.redis.duplicate();
  const autoRelease = new Queue('auto-release', { connection });
  const reputation = new Queue('reputation', { connection: connection.duplicate() });

  await autoRelease.add(
    'auto-release-tick',
    {},
    {
      jobId: 'auto-release-tick',
      repeat: { every: 15 * 60 * 1000 },
      removeOnComplete: true,
      removeOnFail: true
    }
  );

  fastify.decorate('queues', {
    autoRelease,
    reputation
  });

  fastify.addHook('onClose', async () => {
    await autoRelease.close();
    await reputation.close();
    await connection.quit();
  });
});
