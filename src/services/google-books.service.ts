import { AppError } from "../errors/app-error.js";

export type GoogleBookNormalized = {
  googleBooksId: string;
  title: string;
  authors: string[];
  description: string | null;
  publishedDate: string | null;
  publisher: string | null;
  isbn10: string | null;
  isbn13: string | null;
  thumbnail: string | null;
  pageCount: number | null;
  categories: string[];
  language: string | null;
  infoLink: string | null;
};

export type GoogleBooksSearchQuery = {
  q?: string;
  title?: string;
  author?: string;
  isbn?: string;
  startIndex?: number;
  maxResults?: number;
};

type GoogleBooksApiVolume = {
  id?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    publisher?: string;
    industryIdentifiers?: Array<{ type?: string; identifier?: string }>;
    imageLinks?: { thumbnail?: string };
    pageCount?: number;
    categories?: string[];
    language?: string;
    infoLink?: string;
  };
};

export class GoogleBooksService {
  private readonly baseUrl = "https://www.googleapis.com/books/v1/volumes";

  constructor(private readonly apiKey?: string) {}

  async searchBooks(params: GoogleBooksSearchQuery): Promise<{ totalItems: number; items: GoogleBookNormalized[] }> {
    const normalizedQuery = this.buildSearchQuery(params);
    if (!normalizedQuery) {
      throw new AppError(400, "INVALID_SEARCH", "Debe enviar una consulta válida.");
    }

    const safeStartIndex = Math.max(0, Math.trunc(params.startIndex ?? 0));
    const safeMaxResults = Math.min(40, Math.max(1, Math.trunc(params.maxResults ?? 10)));

    const searchParams = new URLSearchParams({
      q: normalizedQuery,
      startIndex: String(safeStartIndex),
      maxResults: String(safeMaxResults),
    });

    if (this.apiKey) {
      searchParams.set("key", this.apiKey);
    }

    const response = await this.fetchJson(this.baseUrl, searchParams);
    const totalItems = Number(response.totalItems ?? 0);
    const items = Array.isArray(response.items)
      ? (response.items as GoogleBooksApiVolume[]).map((item: GoogleBooksApiVolume) => this.normalizeBook(item))
      : [];

    return { totalItems, items };
  }

  async getBookByGoogleId(googleBooksId: string): Promise<GoogleBookNormalized> {
    const normalizedId = (googleBooksId ?? "").trim();
    if (!normalizedId) {
      throw new AppError(400, "INVALID_GOOGLE_BOOK_ID", "El identificador de Google Books es obligatorio.");
    }

    const url = `${this.baseUrl}/${encodeURIComponent(normalizedId)}`;
    const response = await this.fetchJson(url, this.apiKey ? new URLSearchParams({ key: this.apiKey }) : undefined);

    if (!response || typeof response !== "object" || !("id" in response)) {
      throw new AppError(404, "GOOGLE_BOOK_NOT_FOUND", "No se encontró el libro solicitado.");
    }

    return this.normalizeBook(response as GoogleBooksApiVolume);
  }

  private buildSearchQuery(params: GoogleBooksSearchQuery): string {
    const fragments: string[] = [];

    if (params.q?.trim()) {
      fragments.push(params.q.trim());
    }

    if (params.title?.trim()) {
      fragments.push(`intitle:${params.title.trim()}`);
    }

    if (params.author?.trim()) {
      fragments.push(`inauthor:${params.author.trim()}`);
    }

    if (params.isbn?.trim()) {
      fragments.push(`isbn:${params.isbn.trim()}`);
    }

    return fragments.join(" ").trim();
  }

  private normalizeBook(item: GoogleBooksApiVolume): GoogleBookNormalized {
    const volumeInfo = item?.volumeInfo ?? {};
    const isbn10 = volumeInfo.industryIdentifiers?.find((identifier) => identifier.type === "ISBN_10")?.identifier ?? null;
    const isbn13 = volumeInfo.industryIdentifiers?.find((identifier) => identifier.type === "ISBN_13")?.identifier ?? null;

    return {
      googleBooksId: item.id ?? "",
      title: volumeInfo.title ?? "Sin título",
      authors: Array.isArray(volumeInfo.authors) ? volumeInfo.authors : [],
      description: volumeInfo.description ?? null,
      publishedDate: volumeInfo.publishedDate ?? null,
      publisher: volumeInfo.publisher ?? null,
      isbn10,
      isbn13,
      thumbnail: volumeInfo.imageLinks?.thumbnail ?? null,
      pageCount: typeof volumeInfo.pageCount === "number" ? volumeInfo.pageCount : null,
      categories: Array.isArray(volumeInfo.categories) ? volumeInfo.categories : [],
      language: volumeInfo.language ?? null,
      infoLink: volumeInfo.infoLink ?? null,
    };
  }

  private async fetchJson(url: string, params?: URLSearchParams): Promise<any> {
    const fullUrl = params ? `${url}${url.includes("?") ? "&" : "?"}${params.toString()}` : url;

    let response: Response;
    try {
      response = await fetch(fullUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
    } catch (error) {
      throw new AppError(502, "GOOGLE_BOOKS_CONNECTION_ERROR", "No se pudo conectar con Google Books.");
    }

    if (!response.ok) {
      const status = response.status >= 500 ? 502 : response.status === 429 ? 429 : 400;
      const code = response.status === 404 ? "GOOGLE_BOOK_NOT_FOUND" : "GOOGLE_BOOKS_HTTP_ERROR";
      const message = response.status === 404 ? "No se encontró el libro solicitado." : `Google Books respondió con error ${response.status}.`;
      throw new AppError(status, code, message);
    }

    const data = (await response.json()) as Record<string, unknown>;
    if (data?.error && typeof data.error === "object") {
      const errorMessage = (data.error as { message?: string }).message ?? "Error en la consulta a Google Books.";
      throw new AppError(502, "GOOGLE_BOOKS_ERROR", errorMessage);
    }

    return data;
  }
}
