import { AppError } from "../errors/app-error.js";
import { BookRepository, type BookRecord } from "../repositories/book.repository.js";
import { LibraryRepository, type UserLibraryEntry } from "../repositories/library.repository.js";
import { OpenLibraryService, type OpenLibraryBookNormalized } from "./open-library.service.js";

export type BookLibraryPayload = {
  id: number;
  openLibraryId: string;
  googleBooksId?: string;
  title: string;
  authors: string[];
  description: string | null;
  publisher: string | null;
  publishedDate: string | null;
  isbn10: string | null;
  isbn13: string | null;
  thumbnail: string | null;
  pageCount: number | null;
  categories: string[];
  language: string | null;
  infoLink: string | null;
  readingStatus: string;
  addedAt: string;
};

export class LibraryService {
  constructor(
    private readonly bookRepository = new BookRepository(),
    private readonly libraryRepository = new LibraryRepository(),
    private readonly openLibraryService = new OpenLibraryService(process.env.OPEN_LIBRARY_API_KEY ?? process.env.GOOGLE_BOOKS_API_KEY ?? "")
  ) {}

  async addBookToLibrary(userId: number, openLibraryId: string, readingStatus = "por_leer"): Promise<BookLibraryPayload> {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppError(400, "INVALID_USER", "El usuario autenticado es inválido.");
    }

    const normalizedOpenLibraryId = (openLibraryId ?? "").trim();
    if (!normalizedOpenLibraryId) {
      throw new AppError(400, "INVALID_OPEN_LIBRARY_ID", "El identificador externo es requerido.");
    }

    const externalBook = await this.openLibraryService.getBookByOpenLibraryId(normalizedOpenLibraryId);
    const book = await this.ensureBookExists(externalBook);

    const existingRelation = await this.libraryRepository.getByUserAndBookId(userId, book.id);
    if (existingRelation) {
      throw new AppError(409, "LIBRARY_ITEM_EXISTS", "El libro ya existe en la biblioteca del usuario.");
    }

    const inserted = await this.libraryRepository.addBook(userId, book.id, readingStatus);
    if (!inserted) {
      throw new AppError(409, "LIBRARY_ITEM_EXISTS", "El libro ya existe en la biblioteca del usuario.");
    }

    return this.toLibraryPayload(book, inserted);
  }

  async getUserLibrary(userId: number, readingStatus?: string): Promise<BookLibraryPayload[]> {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppError(400, "INVALID_USER", "El usuario autenticado es inválido.");
    }

    const entries = readingStatus
      ? await this.libraryRepository.getByUserAndStatus(userId, readingStatus)
      : await this.libraryRepository.getByUser(userId);

    return entries.map((entry) => ({
      id: entry.libro_id,
      openLibraryId: entry.open_library_id ?? entry.google_books_id ?? "",
      googleBooksId: entry.google_books_id ?? entry.open_library_id ?? undefined,
      title: entry.titulo,
      authors: entry.autores ?? [],
      description: entry.descripcion ?? null,
      publisher: entry.editorial ?? null,
      publishedDate: null,
      isbn10: null,
      isbn13: null,
      thumbnail: entry.portada ?? null,
      pageCount: null,
      categories: [],
      language: null,
      infoLink: null,
      readingStatus: entry.estado_lectura,
      addedAt: entry.fecha_agregado,
    }));
  }

  async getUserLibraryEntry(userId: number, bookId: number): Promise<BookLibraryPayload | null> {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppError(400, "INVALID_USER", "El usuario autenticado es inválido.");
    }

    if (!Number.isInteger(bookId) || bookId <= 0) {
      throw new AppError(400, "INVALID_BOOK_ID", "El identificador del libro es inválido.");
    }

    const entry = await this.libraryRepository.getByUserAndBookId(userId, bookId);
    if (!entry) {
      return null;
    }

    return {
      id: entry.libro_id,
      openLibraryId: entry.open_library_id ?? entry.google_books_id ?? "",
      googleBooksId: entry.google_books_id ?? entry.open_library_id ?? undefined,
      title: entry.titulo,
      authors: entry.autores ?? [],
      description: entry.descripcion ?? null,
      publisher: entry.editorial ?? null,
      publishedDate: null,
      isbn10: null,
      isbn13: null,
      thumbnail: entry.portada ?? null,
      pageCount: null,
      categories: [],
      language: null,
      infoLink: null,
      readingStatus: entry.estado_lectura,
      addedAt: entry.fecha_agregado,
    };
  }

  async removeBookFromLibrary(userId: number, bookId: number): Promise<boolean> {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppError(400, "INVALID_USER", "El usuario autenticado es inválido.");
    }

    if (!Number.isInteger(bookId) || bookId <= 0) {
      throw new AppError(400, "INVALID_BOOK_ID", "El identificador del libro es inválido.");
    }

    const removed = await this.libraryRepository.removeBook(userId, bookId);
    return removed > 0;
  }

  private async ensureBookExists(externalBook: OpenLibraryBookNormalized): Promise<BookRecord> {
    const candidateId = externalBook.openLibraryId ?? externalBook.googleBooksId ?? "";
    const existing = await this.bookRepository.getByOpenLibraryId(candidateId);
    if (existing) {
      const merged = await this.bookRepository.upsertByOpenLibraryId(this.toBookCreateInput(externalBook));
      return merged ?? existing;
    }

    const created = await this.bookRepository.create(this.toBookCreateInput(externalBook));
    if (!created) {
      throw new AppError(500, "BOOK_SAVE_ERROR", "No se pudo guardar el libro en la base de datos.");
    }

    return created;
  }

  private toBookCreateInput(book: OpenLibraryBookNormalized) {
    return {
      openLibraryId: book.openLibraryId ?? book.googleBooksId,
      googleBooksId: book.googleBooksId ?? book.openLibraryId,
      title: book.title,
      authors: book.authors,
      description: book.description,
      publisher: book.publisher,
      publishedDate: book.publishedDate,
      isbn10: book.isbn10,
      isbn13: book.isbn13,
      thumbnail: book.thumbnail,
      pageCount: book.pageCount,
      categories: book.categories,
      language: book.language,
      infoLink: book.infoLink,
    };
  }

  private toLibraryPayload(book: BookRecord, relation: UserLibraryEntry): BookLibraryPayload {
    return {
      id: book.id,
      openLibraryId: book.open_library_id ?? book.google_books_id ?? "",
      googleBooksId: book.google_books_id ?? book.open_library_id ?? undefined,
      title: book.titulo,
      authors: book.autores ?? [],
      description: book.descripcion ?? null,
      publisher: book.editorial ?? null,
      publishedDate: book.fecha_publicacion ?? null,
      isbn10: book.isbn_10 ?? null,
      isbn13: book.isbn_13 ?? null,
      thumbnail: book.portada ?? null,
      pageCount: book.paginas ?? null,
      categories: book.categorias ?? [],
      language: book.idioma ?? null,
      infoLink: book.info_link ?? null,
      readingStatus: relation.estado_lectura,
      addedAt: relation.fecha_agregado,
    };
  }
}
