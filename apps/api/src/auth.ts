import { FastifyRequest } from 'fastify';
import { UserRole } from '@thai-escrow/core';

export interface AuthUser {
  id: string;
  role: UserRole;
  email?: string;
  displayName: string;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: AuthUser;
}

export function requireAuth(request: FastifyRequest): AuthUser {
  if (!request.user) {
    throw { statusCode: 401, message: 'Unauthorized' };
  }
  return request.user as AuthUser;
}

export function requireRole(request: FastifyRequest, role: UserRole): AuthUser {
  const user = requireAuth(request);
  if (user.role !== role) {
    throw { statusCode: 403, message: `Forbidden: requires ${role} role` };
  }
  return user;
}

export function requireAdmin(request: FastifyRequest): AuthUser {
  return requireRole(request, 'admin');
}

export function requireSeller(request: FastifyRequest): AuthUser {
  return requireRole(request, 'seller');
}
