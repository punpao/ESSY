import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env";
import { UserRole } from "@escrow/core";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (roles: UserRole[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(jwt, {
    secret: env.jwtSecret
  });

  fastify.decorate("authenticate", async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  fastify.decorate(
    "authorize",
    (roles: UserRole[]) =>
      async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        await fastify.authenticate(request, reply);
        if (!request.user || !roles.includes(request.user.role as UserRole)) {
          return reply.code(403).send({ error: "forbidden" });
        }
      }
  );
});
