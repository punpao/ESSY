import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyReply, FastifyRequest } from "fastify";
import { ApiEnv } from "../lib/env";
import { JwtPayload } from "../utils/auth";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

type AuthPluginOptions = {
  env: ApiEnv;
};

export default fp<AuthPluginOptions>(async (fastify, opts) => {
  await fastify.register(fastifyJwt, {
    secret: opts.env.JWT_SECRET
  });

  fastify.decorate(
    "authenticate",
    async function authenticate(request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify<JwtPayload>();
      } catch (err) {
        reply.code(401).send({ message: "Unauthorized" });
      }
    }
  );

  fastify.decorate(
    "authorize",
    function authorize(roles: JwtPayload["role"][]) {
      return async function (request: FastifyRequest, reply: FastifyReply) {
        await fastify.authenticate(request, reply);
        if (!request.user) {
          return reply.code(401).send({ message: "Unauthorized" });
        }
        if (!roles.includes(request.user.role)) {
          return reply.code(403).send({ message: "Forbidden" });
        }
      };
    }
  );
});
