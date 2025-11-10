import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import formbody from "@fastify/formbody";
import { fastifyZodPlugin, ZodTypeProvider } from "fastify-type-provider-zod";
import { env } from "./config/env";
import { authPlugin } from "./plugins/auth";
import { servicesPlugin } from "./plugins/services";
import { registerAuthRoutes } from "./modules/auth/routes";
import { registerSellerRoutes } from "./modules/seller/routes";
import { registerDealRoutes } from "./modules/deals/routes";
import { registerPaymentRoutes } from "./modules/payments/routes";
import { registerDisputeRoutes } from "./modules/disputes/routes";
import { registerAdminRoutes } from "./modules/admin/routes";
import { logger } from "./lib/logger";
import { registerBuyerRoutes } from "./modules/buyer/routes";

export async function buildApp() {
  const app = Fastify({
    logger
  }).withTypeProvider<ZodTypeProvider>();

  await app.register(cors, { origin: true, credentials: true });
  await app.register(formbody);
  await app.register(sensible);
  await app.register(fastifyZodPlugin);

  await app.register(authPlugin);
  await app.register(servicesPlugin);

  const apiV1 = async (instance: typeof app) => {
    await registerAuthRoutes(instance);
    await registerSellerRoutes(instance);
    await registerDealRoutes(instance);
    await registerBuyerRoutes(instance);
    await registerPaymentRoutes(instance);
    await registerDisputeRoutes(instance);
    await registerAdminRoutes(instance);
  };

  await app.register(apiV1, { prefix: "/api/v1" });

  app.get("/health", async () => ({
    status: "ok",
    env: env.nodeEnv
  }));

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    reply.status(error.statusCode ?? 500).send({
      error: error.message ?? "Internal Server Error"
    });
  });

  return app;
}
