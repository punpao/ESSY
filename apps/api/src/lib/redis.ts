import { Queue, Worker, QueueScheduler, type JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';

export const redisConnection = new IORedis(config.redisUrl);

export const queues = {
  dealLifecycle: new Queue('deal-lifecycle', { connection: redisConnection })
} as const;

export function createWorker<T extends keyof typeof queues>(
  key: T,
  handler: Parameters<typeof Worker>[1],
  opts?: ConstructorParameters<typeof Worker>[2]
) {
  const queue = queues[key];
  new QueueScheduler(queue.name, { connection: redisConnection }).waitUntilReady();
  return new Worker(queue.name, handler, {
    connection: redisConnection,
    ...opts
  });
}

export async function enqueue<T extends keyof typeof queues>(key: T, data: unknown, opts?: JobsOptions) {
  const queue = queues[key];
  return queue.add(key, data, opts);
}
