import { buildApp } from "./app";
import { env } from "./config/env";

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.port, host: "0.0.0.0" });
    app.log.info(`API listening on ${env.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
