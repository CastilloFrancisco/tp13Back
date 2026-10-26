import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";

export function errorMiddleware(error: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof AppError) {
    res.status(error.status).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Error interno del servidor.";
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message,
    },
  });
}
