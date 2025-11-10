import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { config } from "./config";
import { prisma } from "./db";
import { startWorkers } from "./queue";
import { authRoutes } from "./routes/auth";
import { sellerRoutes } from "./routes/seller";
import { dealRoutes } from "./routes/deals";
import { paymentRoutes } from "./routes/payments";
import { disputeRoutes } from "./routes/disputes";
import { adminRoutes } from "./routes/admin";

const fastify = Fastify({
  logger: true,
});

// Register plugins
fastify.register(cors, {
  origin: config.appBaseUrl,
  credentials: true,
});

fastify.register(jwt, {
  secret: config.jwtSecret,
});

// Register routes
fastify.register(authRoutes, { prefix: "/api/v1" });
fastify.register(sellerRoutes, { prefix: "/api/v1" });
fastify.register(dealRoutes, { prefix: "/api/v1" });
fastify.register(paymentRoutes, { prefix: "/api/v1" });
fastify.register(disputeRoutes, { prefix: "/api/v1" });
fastify.register(adminRoutes, { prefix: "/api/v1" });

// Health check
fastify.get("/health", async () => {
  return { status: "ok" };
});

// Start server
async function start() {
  try {
    await fastify.listen({ port: config.port, host: "0.0.0.0" });
    console.log(`🚀 API server listening on port ${config.port}`);

    // Start background workers
    startWorkers();
    console.log("✅ Background workers started");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on("SIGTERM", async () => {
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});
