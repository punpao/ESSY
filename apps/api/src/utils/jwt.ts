import jwt from "jsonwebtoken";
import { getEnv } from "../config/env";
import type { AuthUser } from "../middleware/auth";

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, getEnv().JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, getEnv().JWT_SECRET) as AuthUser;
}
