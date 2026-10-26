import { DbPg } from "../config/db.js";

export class UserRepository {
    private db: DbPg;

    constructor() {
        this.db = new DbPg();
    }

    async getById(id: number) {
        const sql = `
            SELECT id, nombre, email
            FROM usuarios
            WHERE id = $1
        `;

        return await this.db.queryOne(sql, [id]);
    }

    async getByEmail(email: string) {
        const sql = `
            SELECT id, nombre, email, password_hash
            FROM usuarios
            WHERE email = $1
        `;

        return await this.db.queryOne(sql, [email]);
    }

    async getAll() {
        const sql = `
            SELECT id, nombre, email
            FROM usuarios
            ORDER BY id
        `;

        return await this.db.queryAll(sql);
    }

    async create(nombre: string, email: string, passwordHash: string) {
        const sql = `
            INSERT INTO usuarios (nombre, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id
        `;

        return await this.db.queryReturnId(
            sql,
            [nombre, email, passwordHash]
        );
    }

    async update(
        id: number,
        nombre: string,
        email: string
    ) {
        const sql = `
            UPDATE usuarios
            SET nombre = $1, email = $2
            WHERE id = $3
        `;

        return await this.db.queryRowCount(
            sql,
            [nombre, email, id]
        );
    }

    async delete(id: number) {
        const sql = `
            DELETE FROM usuarios
            WHERE id = $1
        `;

        return await this.db.queryRowCount(sql, [id]);
    }
}
