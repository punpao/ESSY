import fp from "fastify-plugin";
import { buildPaymentRegistry, PaymentRegistry } from "../services/paymentRegistry";

declare module "fastify" {
  interface FastifyInstance {
    payments: PaymentRegistry;
  }
}

export default fp(async (fastify) => {
  const registry = buildPaymentRegistry();
  fastify.decorate("payments", registry);
});
