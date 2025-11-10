import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { config } from "dotenv";

// Load environment variables
config();

// Import routes
import { authRoutes } from "./routes/auth";
import { sellerRoutes } from "./routes/seller";
import { dealRoutes } from "./routes/deals";
import { paymentRoutes } from "./routes/payments";
import { disputeRoutes } from "./routes/disputes";
import { adminRoutes } from "./routes/admin";

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
});

// Register plugins
fastify.register(cors, {
  origin: process.env.APP_BASE_URL || "http://localhost:3000",
  credentials: true,
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || "change_me_in_production",
});

fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Decorate fastify with authenticate
fastify.decorate("authenticate", async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: "Unauthorized" });
  }
});

// Health check
fastify.get("/health", async (request, reply) => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// API Routes
fastify.register(authRoutes, { prefix: "/api/v1" });
fastify.register(sellerRoutes, { prefix: "/api/v1" });
fastify.register(dealRoutes, { prefix: "/api/v1" });
fastify.register(paymentRoutes, { prefix: "/api/v1" });
fastify.register(disputeRoutes, { prefix: "/api/v1" });
fastify.register(adminRoutes, { prefix: "/api/v1" });

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode || 500;

  // Log error
  fastify.log.error(error);

  // Send response
  reply.code(statusCode).send({
    error: error.message || "Internal Server Error",
    statusCode,
  });
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "4000");
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });
    console.log(`🚀 API server listening on http://${host}:${port}`);
    console.log(`📖 Health check: http://${host}:${port}/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
