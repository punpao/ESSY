import "fastify";
import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import { PrismaClient } from "@prisma/client";
import { JwtPayload } from "../utils/auth";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (roles: JwtPayload["role"][]) => (
      request: FastifyRequest,
      reply: FastifyReply,
      done: HookHandlerDoneFunction
    ) => void;
    prisma: PrismaClient;
    payments: import("../services/paymentRegistry").PaymentRegistry;
    emailOtp: import("../services/emailOtpService").EmailOtpService;
    config: import("../lib/env").ApiEnv;
    jobs: import("../plugins/jobs").JobManager;
  }

  interface FastifyRequest {
    user?: JwtPayload;
  }
}
