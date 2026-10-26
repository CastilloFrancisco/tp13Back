import test from "node:test";
import assert from "node:assert/strict";

import { AppError } from "../src/errors/app-error.js";
import { LibraryService } from "../src/services/library.service.js";
import { authMiddleware } from "../src/middlewares/auth.middleware.js";

function createService(overrides: Record<string, unknown> = {}) {
  const service = new LibraryService();

  Object.assign(service, overrides);
  return service as LibraryService;
}

test("addBookToLibrary guarda libro y crea relación con usuario autenticado", async () => {
  const service = createService({
    googleBooksService: {
      getBookByGoogleId: async () => ({
        googleBooksId: "book-1",
        title: "Dune",
        authors: ["Frank Herbert"],
        description: "Sci-fi",
        publishedDate: "1965",
        publisher: "Chilton Books",
        isbn10: "0441172717",
        isbn13: "9780441172719",
        thumbnail: "https://example.com/dune.jpg",
        pageCount: 412,
        categories: ["Ficción"],
        language: "en",
        infoLink: "https://books.google.com/books?id=book-1",
      }),
    } as any,
    bookRepository: {
      getByGoogleBooksId: async () => null,
      create: async () => ({
        id: 12,
        google_books_id: "book-1",
        titulo: "Dune",
        autores: ["Frank Herbert"],
        descripcion: "Sci-fi",
        editorial: "Chilton Books",
        fecha_publicacion: "1965",
        isbn_10: "0441172717",
        isbn_13: "9780441172719",
        portada: "https://example.com/dune.jpg",
        paginas: 412,
        categorias: ["Ficción"],
        idioma: "en",
        info_link: "https://books.google.com/books?id=book-1",
        created_at: "2024-01-01Z",
        updated_at: "2024-01-01Z",
      }),
      upsertByGoogleBooksId: async () => ({
        id: 12,
        google_books_id: "book-1",
        titulo: "Dune",
        autores: ["Frank Herbert"],
        descripcion: "Sci-fi",
        editorial: "Chilton Books",
        fecha_publicacion: "1965",
        isbn_10: "0441172717",
        isbn_13: "9780441172719",
        portada: "https://example.com/dune.jpg",
        paginas: 412,
        categorias: ["Ficción"],
        idioma: "en",
        info_link: "https://books.google.com/books?id=book-1",
        created_at: "2024-01-01Z",
        updated_at: "2024-01-01Z",
      }),
    } as any,
    libraryRepository: {
      getByUserAndBookId: async () => null,
      addBook: async () => ({
        id: 77,
        usuario_id: 3,
        libro_id: 12,
        fecha_agregado: "2024-01-01Z",
        estado_lectura: "por_leer",
        titulo: "Dune",
        google_books_id: "book-1",
        autores: ["Frank Herbert"],
        portada: "https://example.com/dune.jpg",
        descripcion: "Sci-fi",
        editorial: "Chilton Books",
      }),
    } as any,
  });

  const result = await service.addBookToLibrary(3, "book-1");
  assert.equal(result.googleBooksId, "book-1");
  assert.equal(result.readingStatus, "por_leer");
  assert.equal(result.title, "Dune");
});

test("addBookToLibrary falla cuando el libro ya existe en la biblioteca del usuario", async () => {
  const service = createService({
    googleBooksService: {
      getBookByGoogleId: async () => ({
        googleBooksId: "book-9",
        title: "Otro",
        authors: [],
        description: null,
        publishedDate: null,
        publisher: null,
        isbn10: null,
        isbn13: null,
        thumbnail: null,
        pageCount: null,
        categories: [],
        language: null,
        infoLink: null,
      }),
    } as any,
    bookRepository: {
      getByGoogleBooksId: async () => ({
        id: 5,
        google_books_id: "book-9",
        titulo: "Otro",
        autores: [],
        descripcion: null,
        editorial: null,
        fecha_publicacion: null,
        isbn_10: null,
        isbn_13: null,
        portada: null,
        paginas: null,
        categorias: [],
        idioma: null,
        info_link: null,
        created_at: "2024-01-01Z",
        updated_at: "2024-01-01Z",
      }),
      upsertByGoogleBooksId: async () => null,
    } as any,
    libraryRepository: {
      getByUserAndBookId: async () => ({
        id: 1,
        usuario_id: 3,
        libro_id: 5,
        fecha_agregado: "2024-01-01Z",
        estado_lectura: "por_leer",
        titulo: "Otro",
        google_books_id: "book-9",
        autores: [],
        portada: null,
        descripcion: null,
        editorial: null,
      }),
    } as any,
  });

  await assert.rejects(() => service.addBookToLibrary(3, "book-9"), (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.status, 409);
    return true;
  });
});

test("authMiddleware rechaza una solicitud sin token", () => {
  const req = {
    headers: {},
  } as any;

  const next = (error?: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.status, 401);
  };

  authMiddleware(req, {} as any, next);
});

test("LibraryService valida usuario inválido", async () => {
  const service = createService();
  await assert.rejects(() => service.getUserLibrary(0), (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.status, 400);
    return true;
  });
});
