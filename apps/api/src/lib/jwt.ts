import { FastifyRequest } from "fastify";

export interface JWTPayload {
  userId: string;
  role: string;
}

export async function getUserFromRequest(request: FastifyRequest): Promise<JWTPayload> {
  try {
    const payload = await request.jwtVerify<JWTPayload>();
    return payload;
  } catch (error) {
    throw new Error("Unauthorized");
  }
}

export function requireRole(allowedRoles: string[]) {
  return async (request: FastifyRequest) => {
    const user = await getUserFromRequest(request);
    if (!allowedRoles.includes(user.role)) {
      throw new Error("Forbidden: insufficient permissions");
    }
    return user;
  };
}
