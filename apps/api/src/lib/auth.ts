import type { FastifyRequest, FastifyReply } from "fastify";
import type { UserRole } from "@essy/core";

export interface AuthUser {
  id: string;
  role: UserRole;
  email: string | null;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authenticate(
  request: FastifyRequest
): Promise<AuthUser | null> {
  try {
    await request.jwtVerify();
    const user = request.user as AuthUser;
    return user;
  } catch {
    return null;
  }
}

export function requireAuth(roles?: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(request);
    if (!user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    if (roles && !roles.includes(user.role)) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    request.user = user;
  };
}
