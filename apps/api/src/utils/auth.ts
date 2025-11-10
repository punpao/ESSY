import type { FastifyInstance } from "fastify";
import { UserRole } from "@prisma/client";

export type JwtPayload = {
  sub: string;
  role: UserRole;
  displayName: string;
};

export function createAccessToken(fastify: FastifyInstance, payload: JwtPayload): string {
  return fastify.jwt.sign(payload, {
    expiresIn: "7d"
  });
}
