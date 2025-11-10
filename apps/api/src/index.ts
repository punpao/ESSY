import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { authRoutes } from "./routes/auth";
import { sellerRoutes } from "./routes/seller";
import { dealRoutes } from "./routes/deals";
import { paymentRoutes } from "./routes/payments";
import { disputeRoutes } from "./routes/disputes";
import { adminRoutes } from "./routes/admin";
import { startWorkers } from "./workers";
import { prisma } from "./lib/prisma";

const fastify = Fastify({
  logger: true,
});

async function build() {
  await fastify.register(cors, {
    origin: true,
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "change_me_dev_secret",
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(error.statusCode || 500).send({
      error: error.message || "Internal server error",
    });
  });

  // Health check
  fastify.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Routes
  await fastify.register(authRoutes, { prefix: "/api/v1/auth" });
  await fastify.register(sellerRoutes, { prefix: "/api/v1/seller" });
  await fastify.register(dealRoutes, { prefix: "/api/v1/deals" });
  await fastify.register(paymentRoutes, { prefix: "/api/v1/payments" });
  await fastify.register(disputeRoutes, { prefix: "/api/v1/disputes" });
  await fastify.register(adminRoutes, { prefix: "/api/v1/admin" });

  return fastify;
}

async function start() {
  try {
    const app = await build();
    const port = parseInt(process.env.PORT || "3001", 10);
    const host = process.env.HOST || "0.0.0.0";

    await app.listen({ port, host });
    console.log(`🚀 API server listening on ${host}:${port}`);

    // Start background workers
    startWorkers();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  await fastify.close();
  process.exit(0);
});

start();
