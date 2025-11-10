import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { PrismaClient } from "@prisma/client";
import { authRoutes } from "./routes/auth";
import { sellerRoutes } from "./routes/seller";
import { dealRoutes } from "./routes/deals";
import { paymentRoutes } from "./routes/payments";
import { disputeRoutes } from "./routes/disputes";
import { adminRoutes } from "./routes/admin";
import { startWorkers } from "./workers";

const prisma = new PrismaClient();

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
});

// Plugins
fastify.register(cors, {
  origin: process.env.APP_BASE_URL || "http://localhost:3000",
  credentials: true,
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || "change_me",
});

fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Health check
fastify.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Routes
fastify.register(authRoutes, { prefix: "/api/v1/auth" });
fastify.register(sellerRoutes, { prefix: "/api/v1/seller" });
fastify.register(dealRoutes, { prefix: "/api/v1/deals" });
fastify.register(paymentRoutes, { prefix: "/api/v1/payments" });
fastify.register(disputeRoutes, { prefix: "/api/v1/disputes" });
fastify.register(adminRoutes, { prefix: "/api/v1/admin" });

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3001", 10);
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });
    console.log(`🚀 API server listening on ${host}:${port}`);

    // Start background workers
    startWorkers();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on("SIGTERM", async () => {
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

export { fastify, prisma };
