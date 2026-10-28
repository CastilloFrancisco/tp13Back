import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import { OpenLibraryService } from "../services/open-library.service.js";

const openLibraryService = new OpenLibraryService(process.env.OPEN_LIBRARY_API_KEY ?? process.env.GOOGLE_BOOKS_API_KEY ?? "");

export async function searchBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const title = typeof req.query.title === "string" ? req.query.title.trim() : "";
    const author = typeof req.query.author === "string" ? req.query.author.trim() : "";
    const isbn = typeof req.query.isbn === "string" ? req.query.isbn.trim() : "";
    const startIndex = typeof req.query.startIndex === "string" ? Number(req.query.startIndex) : 0;
    const maxResults = typeof req.query.maxResults === "string" ? Number(req.query.maxResults) : 10;

    const searchParams: import("../services/open-library.service.js").OpenLibrarySearchQuery = {
      ...(query ? { q: query } : {}),
      ...(title ? { title } : {}),
      ...(author ? { author } : {}),
      ...(isbn ? { isbn } : {}),
      startIndex: Number.isFinite(startIndex) ? startIndex : 0,
      maxResults: Number.isFinite(maxResults) ? maxResults : 10,
    };

    const result = await openLibraryService.searchBooks(searchParams);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBookByGoogleId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const openLibraryIdValue = Array.isArray(req.params.openLibraryId)
      ? req.params.openLibraryId[0]
      : Array.isArray(req.params.googleBooksId)
        ? req.params.googleBooksId[0]
        : req.params.openLibraryId ?? req.params.googleBooksId;
    const openLibraryId = typeof openLibraryIdValue === "string" ? openLibraryIdValue.trim() : "";

    if (!openLibraryId) {
      throw new AppError(400, "INVALID_OPEN_LIBRARY_ID", "El identificador de Open Library es obligatorio.");
    }

    const book = await openLibraryService.getBookByOpenLibraryId(openLibraryId);
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
}
