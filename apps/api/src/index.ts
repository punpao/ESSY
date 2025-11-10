import Fastify from "fastify";
import cors from "@fastify/cors";
import { getEnv } from "./config/env";
import { authRoutes } from "./routes/auth";
import { sellerRoutes } from "./routes/seller";
import { dealsRoutes } from "./routes/deals";
import { paymentsRoutes } from "./routes/payments";
import { disputesRoutes } from "./routes/disputes";
import { adminRoutes } from "./routes/admin";
import { startWorkers } from "./workers";

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
  },
});

async function start() {
  try {
    // Register plugins
    await server.register(cors, {
      origin: true,
      credentials: true,
    });

    // Health check
    server.get("/health", async () => {
      return { status: "ok", timestamp: new Date().toISOString() };
    });

    // Register routes with prefix
    await server.register(authRoutes, { prefix: "/api/v1" });
    await server.register(sellerRoutes, { prefix: "/api/v1" });
    await server.register(dealsRoutes, { prefix: "/api/v1" });
    await server.register(paymentsRoutes, { prefix: "/api/v1" });
    await server.register(disputesRoutes, { prefix: "/api/v1" });
    await server.register(adminRoutes, { prefix: "/api/v1" });

    // Start workers
    startWorkers();

    const port = parseInt(getEnv().PORT);
    await server.listen({ port, host: "0.0.0.0" });

    console.log(`🚀 Server listening on http://0.0.0.0:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
