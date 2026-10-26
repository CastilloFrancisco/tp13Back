import { DbPg } from "../config/db.js";

export type UserRecord = {
  id: number;
  nombre: string;
  email: string;
  password_hash?: string;
};

export class UserRepository {
  private readonly db: DbPg;

  constructor() {
    this.db = new DbPg();
  }

  async getById(id: number): Promise<UserRecord | null> {
    const sql = `SELECT id, nombre, email FROM usuarios WHERE id = $1`;
    return await this.db.queryOne<UserRecord>(sql, [id]);
  }

  async getByEmail(email: string): Promise<UserRecord | null> {
    const sql = `SELECT id, nombre, email, password_hash FROM usuarios WHERE email = $1`;
    return await this.db.queryOne<UserRecord>(sql, [email]);
  }
}
