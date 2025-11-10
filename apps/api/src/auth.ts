import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { config } from "./config";
import { prisma } from "./db";

export interface AuthUser {
  id: string;
  role: string;
  email: string;
  display_name: string;
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
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const decoded = request.server.jwt.verify<AuthUser>(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return reply.status(401).send({ error: "User not found" });
    }

    request.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      display_name: user.display_name,
    };
  } catch (error) {
    return reply.status(401).send({ error: "Invalid token" });
  }
}

export function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  };
}
