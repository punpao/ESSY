import dotenv from "dotenv";
import { loadEnv } from "./lib/env";
import { buildServer } from "./server";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env" : "../../.env"
});

async function main() {
  const env = loadEnv();
  const server = await buildServer(env);

  try {
    await server.listen({ port: env.PORT, host: "0.0.0.0" });
    server.log.info(`API listening on port ${env.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

void main();
