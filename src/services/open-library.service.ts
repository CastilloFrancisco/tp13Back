import { AppError } from "../errors/app-error.js";

export type OpenLibraryBookNormalized = {
  googleBooksId: string;
  openLibraryId: string;
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

export type OpenLibrarySearchQuery = {
  q?: string;
  title?: string;
  author?: string;
  isbn?: string;
  startIndex?: number;
  maxResults?: number;
};

type OpenLibrarySearchDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  publisher?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_edition_key?: string;
  cover_i?: number;
  number_of_pages_median?: number;
  subject?: string[];
  language?: string[];
};

type OpenLibraryBookRecord = {
  key?: string;
  title?: string;
  authors?: Array<{ key?: string; name?: string }>;
  description?: string | { value?: string };
  publishers?: string[];
  publish_date?: string;
  first_publish_date?: string;
  isbn_10?: string[];
  isbn_13?: string[];
  covers?: number[];
  number_of_pages?: number;
  subjects?: Array<string | { name?: string }>;
  languages?: Array<{ key?: string }>;
  info_url?: string;
};

export class OpenLibraryService {
  private readonly baseUrl = "https://openlibrary.org";

  constructor(private readonly apiKey?: string) {}

  async searchBooks(params: OpenLibrarySearchQuery): Promise<{ totalItems: number; items: OpenLibraryBookNormalized[] }> {
    const normalizedQuery = this.buildSearchQuery(params);
    if (!normalizedQuery) {
      throw new AppError(400, "INVALID_SEARCH", "Debe enviar una consulta válida.");
    }

    const safeStartIndex = Math.max(0, Math.trunc(params.startIndex ?? 0));
    const safeMaxResults = Math.min(40, Math.max(1, Math.trunc(params.maxResults ?? 10)));

    const searchParams = new URLSearchParams({
      q: normalizedQuery,
      offset: String(safeStartIndex),
      limit: String(safeMaxResults),
    });

    if (this.apiKey) {
      searchParams.set("api_key", this.apiKey);
    }

    const response = await this.fetchJson(`${this.baseUrl}/search.json`, searchParams);
    const docs = Array.isArray(response?.docs)
      ? response.docs
      : Array.isArray(response?.items)
        ? response.items
        : [];

    const totalItems = Number(response?.numFound ?? response?.totalItems ?? docs.length ?? 0);
    const items = docs.map((item: unknown) =>
      this.isLegacyGoogleVolume(item)
        ? this.normalizeLegacyGoogleVolume(item)
        : this.normalizeSearchDoc(item as OpenLibrarySearchDoc)
    );

    return { totalItems, items };
  }

  async getBookByOpenLibraryId(openLibraryId: string): Promise<OpenLibraryBookNormalized> {
    const normalizedId = (openLibraryId ?? "").trim();
    if (!normalizedId) {
      throw new AppError(400, "INVALID_OPEN_LIBRARY_ID", "El identificador de Open Library es obligatorio.");
    }

    const response = await this.fetchJson(this.buildBookUrl(normalizedId));
    if (!response || typeof response !== "object") {
      throw new AppError(404, "OPEN_LIBRARY_BOOK_NOT_FOUND", "No se encontró el libro solicitado.");
    }

    return this.normalizeBookDetails(response as OpenLibraryBookRecord);
  }

  async getBookByGoogleId(googleBooksId: string): Promise<OpenLibraryBookNormalized> {
    return this.getBookByOpenLibraryId(googleBooksId);
  }

  private buildSearchQuery(params: OpenLibrarySearchQuery): string {
    const fragments: string[] = [];

    if (params.q?.trim()) {
      fragments.push(params.q.trim());
    }

    if (params.isbn?.trim()) {
      return `isbn:${params.isbn.trim()}`;
    }

    if (params.title?.trim()) {
      fragments.push(params.title.trim());
    }

    if (params.author?.trim()) {
      fragments.push(params.author.trim());
    }

    return fragments.join(" ").trim();
  }

  private buildBookUrl(identifier: string): string {
    const trimmed = identifier.trim();

    if (!trimmed) {
      return `${this.baseUrl}/books/`;
    }

    if (trimmed.startsWith("/works/") || trimmed.startsWith("/books/")) {
      return `${this.baseUrl}${trimmed}.json`;
    }

    if (/^OL\d+[A-Z]*$/i.test(trimmed)) {
      return `${this.baseUrl}/books/${encodeURIComponent(trimmed)}.json`;
    }

    if (/^(?:97[89])?\d{9}[\dXx]$/.test(trimmed.replace(/-/g, ""))) {
      return `${this.baseUrl}/isbn/${encodeURIComponent(trimmed)}.json`;
    }

    return `${this.baseUrl}/books/${encodeURIComponent(trimmed)}.json`;
  }

  private isLegacyGoogleVolume(item: unknown): item is {
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
  } {
    return Boolean(item && typeof item === "object" && "volumeInfo" in item);
  }

  private normalizeLegacyGoogleVolume(item: {
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
  }): OpenLibraryBookNormalized {
    const volumeInfo = item.volumeInfo ?? {};
    const isbn10 = volumeInfo.industryIdentifiers?.find((identifier) => identifier.type === "ISBN_10")?.identifier ?? null;
    const isbn13 = volumeInfo.industryIdentifiers?.find((identifier) => identifier.type === "ISBN_13")?.identifier ?? null;
    const openLibraryId = item.id ?? "";

    return {
      googleBooksId: openLibraryId,
      openLibraryId,
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

  private normalizeSearchDoc(item: OpenLibrarySearchDoc): OpenLibraryBookNormalized {
    const isbnValues = Array.isArray(item.isbn) ? item.isbn : [];
    const openLibraryId = this.extractBookId(item.key);

    return {
      googleBooksId: openLibraryId,
      openLibraryId,
      title: item.title ?? "Sin título",
      authors: Array.isArray(item.author_name) ? item.author_name.filter(Boolean) : [],
      description: null,
      publishedDate: typeof item.first_publish_year === "number" ? String(item.first_publish_year) : null,
      publisher: Array.isArray(item.publisher) && item.publisher.length > 0 ? item.publisher[0] : null,
      isbn10: this.findIsbn(isbnValues, 10),
      isbn13: this.findIsbn(isbnValues, 13),
      thumbnail: this.buildThumbnail(item.cover_i, item.cover_edition_key),
      pageCount: typeof item.number_of_pages_median === "number" ? item.number_of_pages_median : null,
      categories: Array.isArray(item.subject) ? item.subject.slice(0, 20) : [],
      language: Array.isArray(item.language) && item.language.length > 0 ? item.language[0] : null,
      infoLink: item.key ? `https://openlibrary.org${item.key}` : null,
    };
  }

  private normalizeBookDetails(item: OpenLibraryBookRecord): OpenLibraryBookNormalized {
    const isbn10 = this.findArrayIsbn(item.isbn_10, 10);
    const isbn13 = this.findArrayIsbn(item.isbn_13, 13);
    const openLibraryId = this.extractBookId(item.key) || isbn13 || isbn10 || "";

    return {
      googleBooksId: openLibraryId,
      openLibraryId,
      title: item.title ?? "Sin título",
      authors: Array.isArray(item.authors) ? item.authors.map((author) => author.name ?? "").filter(Boolean) : [],
      description: this.normalizeDescription(item.description),
      publishedDate: item.publish_date ?? item.first_publish_date ?? null,
      publisher: Array.isArray(item.publishers) && item.publishers.length > 0 ? item.publishers[0] : null,
      isbn10,
      isbn13,
      thumbnail: this.buildThumbnailFromCovers(item.covers),
      pageCount: typeof item.number_of_pages === "number" ? item.number_of_pages : null,
      categories: Array.isArray(item.subjects)
        ? item.subjects
            .map((subject): string | null => (typeof subject === "string" ? subject : subject?.name ?? null))
            .filter((subject): subject is string => Boolean(subject))
        : [],
      language: Array.isArray(item.languages) && item.languages.length > 0 ? this.getLanguageCode(item.languages[0]?.key) : null,
      infoLink: item.key ? `https://openlibrary.org${item.key}` : item.info_url ?? null,
    };
  }

  private normalizeDescription(description: string | { value?: string } | undefined): string | null {
    if (typeof description === "string") {
      return description;
    }

    if (description && typeof description === "object" && typeof description.value === "string") {
      return description.value;
    }

    return null;
  }

  private findIsbn(values: string[], length: 10 | 13): string | null {
    if (!Array.isArray(values)) {
      return null;
    }

    const normalized = values
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .find((value) => value.length === length || value.length === length + 1);

    return normalized ?? null;
  }

  private findArrayIsbn(values: string[] | undefined, length: 10 | 13): string | null {
    if (!Array.isArray(values) || values.length === 0) {
      return null;
    }

    const match = values.find((value) => value.replace(/[^0-9Xx]/g, "").length === length);
    if (match) {
      return match;
    }

    const fallback = values.find((value) => value.includes(String(length)));
    return fallback ?? null;
  }

  private buildThumbnail(coverId?: number, coverEditionKey?: string): string | null {
    if (typeof coverId === "number" && Number.isFinite(coverId)) {
      return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
    }

    if (coverEditionKey) {
      return `https://covers.openlibrary.org/b/olid/${coverEditionKey}-M.jpg`;
    }

    return null;
  }

  private buildThumbnailFromCovers(covers?: number[]): string | null {
    if (!Array.isArray(covers) || covers.length === 0) {
      return null;
    }

    const firstCover = covers.find((cover) => Number.isFinite(cover));
    if (typeof firstCover !== "number") {
      return null;
    }

    return `https://covers.openlibrary.org/b/id/${firstCover}-M.jpg`;
  }

  private getLanguageCode(languageKey?: string): string | null {
    if (!languageKey) {
      return null;
    }

    const match = languageKey.match(/\/languages\/(.+)$/i);
    return match ? match[1] : languageKey;
  }

  private extractBookId(key?: string): string {
    if (!key) {
      return "";
    }

    const match = key.match(/\/((?:works|books)\/[^/]+)$/i) ?? key.match(/\/([^/]+)$/);
    return match ? match[1] : key.replace(/^\//, "");
  }

  private async fetchJson(url: string, params?: URLSearchParams): Promise<any> {
    const fullUrl = params ? `${url}${url.includes("?") ? "&" : "?"}${params.toString()}` : url;

    let response: Response;
    try {
      response = await fetch(fullUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
    } catch {
      throw new AppError(502, "OPEN_LIBRARY_CONNECTION_ERROR", "No se pudo conectar con Open Library.");
    }

    if (!response.ok) {
      const status = response.status >= 500 ? 502 : response.status === 429 ? 429 : 400;
      const code = response.status === 404 ? "OPEN_LIBRARY_NOT_FOUND" : "OPEN_LIBRARY_HTTP_ERROR";
      const message = response.status === 404 ? "No se encontró el libro solicitado." : `Open Library respondió con error ${response.status}.`;
      throw new AppError(status, code, message);
    }

    const data = (await response.json()) as Record<string, unknown>;
    if (data && typeof data === "object" && ("error" in data || "not_found" in data)) {
      const errorMessage = typeof data.error === "string" ? data.error : "Error en la consulta a Open Library.";
      throw new AppError(502, "OPEN_LIBRARY_ERROR", errorMessage);
    }

    return data;
  }
}

export const GoogleBooksService = OpenLibraryService;
export type GoogleBookNormalized = OpenLibraryBookNormalized;
export type GoogleBooksSearchQuery = OpenLibrarySearchQuery;
