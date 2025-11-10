import { env } from "../config/env";
import IORedis from "ioredis";

export async function createRedisConnection(): Promise<IORedis.Redis> {
  const connection = new IORedis(env.redisUrl, {
    maxRetriesPerRequest: null
  });

  connection.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("Redis error", err);
  });

  await new Promise<void>((resolve, reject) => {
    connection.once("ready", () => resolve());
    connection.once("error", (err) => reject(err));
  });

  return connection;
}
