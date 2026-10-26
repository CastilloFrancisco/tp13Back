import { DbPg } from "../config/db.js";

export type UserLibraryEntry = {
  id: number;
  usuario_id: number;
  libro_id: number;
  fecha_agregado: string;
  estado_lectura: string;
  titulo: string;
  google_books_id: string;
  autores: string[];
  portada: string | null;
  descripcion: string | null;
  editorial: string | null;
};

export class LibraryRepository {
  private readonly db: DbPg;

  constructor() {
    this.db = new DbPg();
  }

  async addBook(userId: number, bookId: number, readingStatus = "por_leer"): Promise<UserLibraryEntry | null> {
    const sql = `
      INSERT INTO biblioteca_usuarios (usuario_id, libro_id, estado_lectura)
      VALUES ($1, $2, $3)
      ON CONFLICT (usuario_id, libro_id) DO NOTHING
      RETURNING *
    `;

    return await this.db.queryOne<UserLibraryEntry>(sql, [userId, bookId, readingStatus]);
  }

  async getByUser(userId: number): Promise<UserLibraryEntry[]> {
    const sql = `
      SELECT
        bu.id,
        bu.usuario_id,
        bu.libro_id,
        bu.fecha_agregado,
        bu.estado_lectura,
        l.titulo,
        l.google_books_id,
        l.autores,
        l.portada,
        l.descripcion,
        l.editorial
      FROM biblioteca_usuarios bu
      JOIN libros l ON l.id = bu.libro_id
      WHERE bu.usuario_id = $1
      ORDER BY bu.fecha_agregado DESC
    `;

    return await this.db.queryAll<UserLibraryEntry>(sql, [userId]);
  }

  async getByUserAndBookId(userId: number, bookId: number): Promise<UserLibraryEntry | null> {
    const sql = `
      SELECT
        bu.id,
        bu.usuario_id,
        bu.libro_id,
        bu.fecha_agregado,
        bu.estado_lectura,
        l.titulo,
        l.google_books_id,
        l.autores,
        l.portada,
        l.descripcion,
        l.editorial
      FROM biblioteca_usuarios bu
      JOIN libros l ON l.id = bu.libro_id
      WHERE bu.usuario_id = $1 AND bu.libro_id = $2
    `;

    return await this.db.queryOne<UserLibraryEntry>(sql, [userId, bookId]);
  }

  async removeBook(userId: number, bookId: number): Promise<number> {
    const sql = `
      DELETE FROM biblioteca_usuarios
      WHERE usuario_id = $1 AND libro_id = $2
    `;

    return await this.db.queryRowCount(sql, [userId, bookId]);
  }

  async getByUserAndStatus(userId: number, readingStatus: string): Promise<UserLibraryEntry[]> {
    const sql = `
      SELECT
        bu.id,
        bu.usuario_id,
        bu.libro_id,
        bu.fecha_agregado,
        bu.estado_lectura,
        l.titulo,
        l.google_books_id,
        l.autores,
        l.portada,
        l.descripcion,
        l.editorial
      FROM biblioteca_usuarios bu
      JOIN libros l ON l.id = bu.libro_id
      WHERE bu.usuario_id = $1 AND bu.estado_lectura = $2
      ORDER BY bu.fecha_agregado DESC
    `;

    return await this.db.queryAll<UserLibraryEntry>(sql, [userId, readingStatus]);
  }
}
