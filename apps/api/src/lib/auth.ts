import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "./prisma";

export interface AuthUser {
  id: string;
  role: "buyer" | "seller" | "admin";
  email?: string | null;
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AuthUser> {
  try {
    await request.jwtVerify();
    const userId = (request.user as { id: string }).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    });

    if (!user) {
      return reply.status(401).send({ error: "User not found" });
    }

    return {
      id: user.id,
      role: user.role as "buyer" | "seller" | "admin",
      email: user.email,
    };
  } catch (err) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
}

export function requireRole(...roles: ("buyer" | "seller" | "admin")[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    if (!roles.includes(user.role)) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    (request as any).user = user;
  };
}
