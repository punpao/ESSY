import type { AuthUser } from "../lib/auth";

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}
