import fp from 'fastify-plugin';
import { MockPromptPayProvider } from '@thai-escrow/payment';
import type { AppConfig } from '../config.js';

declare module 'fastify' {
  interface FastifyInstance {
    paymentProvider: MockPromptPayProvider;
  }
}

interface PaymentProviderPluginOptions {
  config: AppConfig;
}

export default fp<PaymentProviderPluginOptions>(async (fastify, { config }) => {
  const provider = new MockPromptPayProvider({
    webhookSecret: config.paymentWebhookSecret
  });
  fastify.decorate('paymentProvider', provider);
});
