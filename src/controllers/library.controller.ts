import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { LibraryService } from "../services/library.service.js";

const libraryService = new LibraryService();

export async function addBookToLibrary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const googleBooksId = String(req.body?.googleBooksId ?? "").trim();
    const readingStatus = String(req.body?.readingStatus ?? "por_leer").trim() || "por_leer";

    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Se requiere autenticación para acceder a la biblioteca.");
    }

    if (!googleBooksId) {
      throw new AppError(400, "INVALID_GOOGLE_BOOK_ID", "El identificador externo del libro es obligatorio.");
    }

    const entry = await libraryService.addBookToLibrary(req.user.id, googleBooksId, readingStatus);
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
}

export async function listUserLibrary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Se requiere autenticación para acceder a la biblioteca.");
    }

    const readingStatus = req.query.status ? String(req.query.status) : undefined;
    const books = await libraryService.getUserLibrary(req.user.id, readingStatus);
    res.status(200).json({ success: true, data: books });
  } catch (error) {
    next(error);
  }
}

export async function getLibraryBook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Se requiere autenticación para acceder a la biblioteca.");
    }

    const bookId = Number(req.params.bookId);
    const entry = await libraryService.getUserLibraryEntry(req.user.id, bookId);

    if (!entry) {
      throw new AppError(404, "LIBRARY_ITEM_NOT_FOUND", "El libro no está en la biblioteca del usuario.");
    }

    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
}

export async function removeLibraryBook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Se requiere autenticación para acceder a la biblioteca.");
    }

    const bookId = Number(req.params.bookId);
    const removed = await libraryService.removeBookFromLibrary(req.user.id, bookId);

    if (!removed) {
      throw new AppError(404, "LIBRARY_ITEM_NOT_FOUND", "El libro no está en la biblioteca del usuario.");
    }

    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
}
