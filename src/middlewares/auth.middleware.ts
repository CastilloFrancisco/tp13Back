import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import type { AuthTokenPayload } from "../types/auth.js";

export type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    email?: string | undefined;
    nombre?: string | undefined;
  };
};

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    return next(new AppError(401, "UNAUTHORIZED", "Se requiere un token de autenticación."));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
    if (!payload?.userId || !Number.isInteger(payload.userId)) {
      return next(new AppError(401, "UNAUTHORIZED", "Token inválido."));
    }

    const user: AuthenticatedRequest["user"] = {
      id: payload.userId,
      email: payload.email,
      nombre: undefined,
    };

    req.user = user;
    return next();
  } catch {
    return next(new AppError(401, "UNAUTHORIZED", "Token inválido o expirado."));
  }
}
