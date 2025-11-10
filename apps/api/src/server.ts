import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import formBody from "@fastify/formbody";
import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import authPlugin from "./plugins/auth";
import prismaPlugin from "./plugins/prisma";
import paymentsPlugin from "./plugins/payments";
import servicesPlugin from "./plugins/services";
import jobsPlugin from "./plugins/jobs";
import authRoutes from "./routes/auth";
import sellerRoutes from "./routes/seller";
import dealRoutes from "./routes/deals";
import paymentRoutes from "./routes/payments";
import disputeRoutes from "./routes/disputes";
import adminRoutes from "./routes/admin";
import { ApiEnv } from "./lib/env";

export async function buildServer(env: ApiEnv): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true
  }).withTypeProvider<ZodTypeProvider>();

  await app.register(cors, { origin: true, credentials: true });
  await app.register(helmet, { global: true });
  await app.register(formBody);
  await app.register(multipart);
  app.decorate("config", env);
  await app.register(prismaPlugin);
  await app.register(authPlugin, { env });
  await app.register(paymentsPlugin);
  await app.register(servicesPlugin);
  await app.register(jobsPlugin);

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(authRoutes, { prefix: "/api/v1" });
  await app.register(sellerRoutes, { prefix: "/api/v1" });
  await app.register(dealRoutes, { prefix: "/api/v1" });
  await app.register(paymentRoutes, { prefix: "/api/v1" });
  await app.register(disputeRoutes, { prefix: "/api/v1" });
  await app.register(adminRoutes, { prefix: "/api/v1" });

  return app;
}
