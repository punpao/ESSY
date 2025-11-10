import fp from "fastify-plugin";
import { createMockPromptPayProvider, MockPromptPayProvider } from "@escrow/payment";
import { env } from "../config/env";
import { Queue, QueueScheduler } from "bullmq";
import { createRedisConnection } from "../worker/redis";

declare module "fastify" {
  interface FastifyInstance {
    paymentProvider: MockPromptPayProvider;
    autoReleaseQueue: Queue;
  }
}

export const servicesPlugin = fp(async (fastify) => {
  const paymentProvider = createMockPromptPayProvider({
    webhookSecret: env.paymentWebhookSecret
  });
  fastify.decorate("paymentProvider", paymentProvider);

  const connection = await createRedisConnection();
  const autoReleaseQueue = new Queue("auto-release", { connection });
  const scheduler = new QueueScheduler("auto-release", { connection });
  await scheduler.waitUntilReady();
  fastify.decorate("autoReleaseQueue", autoReleaseQueue);

  fastify.addHook("onClose", async () => {
    await autoReleaseQueue.close();
    await scheduler.close();
    await connection.quit();
  });
});
