import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env";
import { prisma } from "../config/database";

export interface AuthUser {
  id: string;
  role: string;
  email?: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      reply.code(401).send({ error: "Unauthorized" });
      return;
    }

    const decoded = jwt.verify(token, getEnv().JWT_SECRET) as AuthUser;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      reply.code(401).send({ error: "User not found" });
      return;
    }

    request.user = {
      id: user.id,
      role: user.role,
      email: user.email || undefined,
    };
  } catch (error) {
    reply.code(401).send({ error: "Invalid token" });
  }
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      reply.code(401).send({ error: "Unauthorized" });
      return;
    }

    if (!roles.includes(request.user.role)) {
      reply.code(403).send({ error: "Forbidden" });
      return;
    }
  };
}
