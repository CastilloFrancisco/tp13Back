import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import { GoogleBooksService } from "../services/google-books.service.js";

const googleBooksService = new GoogleBooksService(process.env.GOOGLE_BOOKS_API_KEY ?? "");

export async function searchBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const title = typeof req.query.title === "string" ? req.query.title.trim() : "";
    const author = typeof req.query.author === "string" ? req.query.author.trim() : "";
    const isbn = typeof req.query.isbn === "string" ? req.query.isbn.trim() : "";
    const startIndex = typeof req.query.startIndex === "string" ? Number(req.query.startIndex) : 0;
    const maxResults = typeof req.query.maxResults === "string" ? Number(req.query.maxResults) : 10;

    const searchParams: import("../services/google-books.service.js").GoogleBooksSearchQuery = {
      ...(query ? { q: query } : {}),
      ...(title ? { title } : {}),
      ...(author ? { author } : {}),
      ...(isbn ? { isbn } : {}),
      startIndex: Number.isFinite(startIndex) ? startIndex : 0,
      maxResults: Number.isFinite(maxResults) ? maxResults : 10,
    };

    const result = await googleBooksService.searchBooks(searchParams);

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
    const googleBooksIdValue = Array.isArray(req.params.googleBooksId) ? req.params.googleBooksId[0] : req.params.googleBooksId;
    const googleBooksId = typeof googleBooksIdValue === "string" ? googleBooksIdValue.trim() : "";
    if (!googleBooksId) {
      throw new AppError(400, "INVALID_GOOGLE_BOOK_ID", "El identificador de Google Books es obligatorio.");
    }

    const book = await googleBooksService.getBookByGoogleId(googleBooksId);
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
}
