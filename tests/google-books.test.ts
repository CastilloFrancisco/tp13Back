import test from "node:test";
import assert from "node:assert/strict";

import { GoogleBooksService } from "../src/services/google-books.service.js";
import { AppError } from "../src/errors/app-error.js";

test("searchBooks devuelve resultado normalizado", async () => {
  const service = new GoogleBooksService();
  const originalFetch = global.fetch;

  global.fetch = async () =>
    new Response(
      JSON.stringify({
        totalItems: 1,
        items: [
          {
            id: "abc123",
            volumeInfo: {
              title: "Clean Code",
              authors: ["Robert C. Martin"],
              description: "Un clásico.",
              publishedDate: "2008",
              publisher: "Prentice Hall",
              industryIdentifiers: [
                { type: "ISBN_10", identifier: "0132350882" },
                { type: "ISBN_13", identifier: "9780132350884" },
              ],
              imageLinks: { thumbnail: "https://example.com/cover.jpg" },
              pageCount: 464,
              categories: ["Computación"],
              language: "en",
              infoLink: "https://books.google.com/books?id=abc123",
            },
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  try {
    const result = await service.searchBooks({ q: "clean code", startIndex: 0, maxResults: 10 });
    assert.equal(result.totalItems, 1);
    assert.equal(result.items[0]?.googleBooksId, "abc123");
    assert.equal(result.items[0]?.title, "Clean Code");
    assert.equal(result.items[0]?.isbn13, "9780132350884");
  } finally {
    global.fetch = originalFetch;
  }
});

test("searchBooks devuelve lista vacía cuando no hay resultados", async () => {
  const service = new GoogleBooksService();
  const originalFetch = global.fetch;

  global.fetch = async () => new Response(JSON.stringify({ totalItems: 0, items: [] }), { status: 200 });

  try {
    const result = await service.searchBooks({ q: "libro inexistente" });
    assert.equal(result.totalItems, 0);
    assert.deepEqual(result.items, []);
  } finally {
    global.fetch = originalFetch;
  }
});

test("searchBooks lanza error HTTP cuando Google Books falla", async () => {
  const service = new GoogleBooksService();
  const originalFetch = global.fetch;

  global.fetch = async () => new Response("error", { status: 500 });

  try {
    await assert.rejects(() => service.searchBooks({ q: "algo" }), (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.status, 502);
      return true;
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("searchBooks lanza error de conexión si fetch falla", async () => {
  const service = new GoogleBooksService();
  const originalFetch = global.fetch;

  global.fetch = async () => {
    throw new Error("ECONNREFUSED");
  };

  try {
    await assert.rejects(() => service.searchBooks({ q: "algo" }), (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.status, 502);
      return true;
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("getBookByGoogleId falla con id vacío", async () => {
  const service = new GoogleBooksService();
  await assert.rejects(() => service.getBookByGoogleId("   "), (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.status, 400);
    return true;
  });
});
