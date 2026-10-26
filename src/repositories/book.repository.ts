import { DbPg } from "../config/db.js";

export type BookRecord = {
  id: number;
  google_books_id: string;
  titulo: string;
  autores: string[];
  descripcion: string | null;
  editorial: string | null;
  fecha_publicacion: string | null;
  isbn_10: string | null;
  isbn_13: string | null;
  portada: string | null;
  paginas: number | null;
  categorias: string[];
  idioma: string | null;
  info_link: string | null;
  created_at: string;
  updated_at: string;
};

export type BookCreateInput = {
  googleBooksId: string;
  title: string;
  authors: string[];
  description?: string | null;
  publisher?: string | null;
  publishedDate?: string | null;
  isbn10?: string | null;
  isbn13?: string | null;
  thumbnail?: string | null;
  pageCount?: number | null;
  categories?: string[];
  language?: string | null;
  infoLink?: string | null;
};

export class BookRepository {
  private readonly db: DbPg;

  constructor() {
    this.db = new DbPg();
  }

  async getById(id: number): Promise<BookRecord | null> {
    const sql = `
      SELECT *
      FROM libros
      WHERE id = $1
    `;

    return await this.db.queryOne<BookRecord>(sql, [id]);
  }

  async getByGoogleBooksId(googleBooksId: string): Promise<BookRecord | null> {
    const sql = `
      SELECT *
      FROM libros
      WHERE google_books_id = $1
    `;

    return await this.db.queryOne<BookRecord>(sql, [googleBooksId]);
  }

  async create(input: BookCreateInput): Promise<BookRecord | null> {
    const sql = `
      INSERT INTO libros (
        google_books_id,
        titulo,
        autores,
        descripcion,
        editorial,
        fecha_publicacion,
        isbn_10,
        isbn_13,
        portada,
        paginas,
        categorias,
        idioma,
        info_link,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()
      )
      RETURNING *
    `;

    return await this.db.queryOne<BookRecord>(sql, [
      input.googleBooksId,
      input.title,
      input.authors,
      input.description ?? null,
      input.publisher ?? null,
      input.publishedDate ?? null,
      input.isbn10 ?? null,
      input.isbn13 ?? null,
      input.thumbnail ?? null,
      input.pageCount ?? null,
      input.categories ?? [],
      input.language ?? null,
      input.infoLink ?? null,
    ]);
  }

  async update(id: number, input: BookCreateInput): Promise<BookRecord | null> {
    const sql = `
      UPDATE libros
      SET
        google_books_id = $2,
        titulo = $3,
        autores = $4,
        descripcion = $5,
        editorial = $6,
        fecha_publicacion = $7,
        isbn_10 = $8,
        isbn_13 = $9,
        portada = $10,
        paginas = $11,
        categorias = $12,
        idioma = $13,
        info_link = $14,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    return await this.db.queryOne<BookRecord>(sql, [
      id,
      input.googleBooksId,
      input.title,
      input.authors,
      input.description ?? null,
      input.publisher ?? null,
      input.publishedDate ?? null,
      input.isbn10 ?? null,
      input.isbn13 ?? null,
      input.thumbnail ?? null,
      input.pageCount ?? null,
      input.categories ?? [],
      input.language ?? null,
      input.infoLink ?? null,
    ]);
  }

  async upsertByGoogleBooksId(input: BookCreateInput): Promise<BookRecord | null> {
    const sql = `
      INSERT INTO libros (
        google_books_id,
        titulo,
        autores,
        descripcion,
        editorial,
        fecha_publicacion,
        isbn_10,
        isbn_13,
        portada,
        paginas,
        categorias,
        idioma,
        info_link,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()
      )
      ON CONFLICT (google_books_id) DO UPDATE
      SET
        titulo = EXCLUDED.titulo,
        autores = EXCLUDED.autores,
        descripcion = EXCLUDED.descripcion,
        editorial = EXCLUDED.editorial,
        fecha_publicacion = EXCLUDED.fecha_publicacion,
        isbn_10 = EXCLUDED.isbn_10,
        isbn_13 = EXCLUDED.isbn_13,
        portada = EXCLUDED.portada,
        paginas = EXCLUDED.paginas,
        categorias = EXCLUDED.categorias,
        idioma = EXCLUDED.idioma,
        info_link = EXCLUDED.info_link,
        updated_at = NOW()
      RETURNING *
    `;

    return await this.db.queryOne<BookRecord>(sql, [
      input.googleBooksId,
      input.title,
      input.authors,
      input.description ?? null,
      input.publisher ?? null,
      input.publishedDate ?? null,
      input.isbn10 ?? null,
      input.isbn13 ?? null,
      input.thumbnail ?? null,
      input.pageCount ?? null,
      input.categories ?? [],
      input.language ?? null,
      input.infoLink ?? null,
    ]);
  }
}
