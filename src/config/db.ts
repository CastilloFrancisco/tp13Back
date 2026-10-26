import { Pool, type QueryResultRow } from "pg";

export class DbPg {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }

    async queryOne<T extends QueryResultRow = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
        const result = await this.pool.query<T>(sql, params);
        return result.rows[0] ?? null;
    }

    async queryAll<T extends QueryResultRow = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
        const result = await this.pool.query<T>(sql, params);
        return result.rows;
    }

    async queryReturnId(sql: string, params: unknown[] = []): Promise<number | null> {
        const result = await this.pool.query<{ id: number }>(sql, params);
        return result.rows[0]?.id ?? null;
    }

    async queryRowCount(sql: string, params: unknown[] = []): Promise<number> {
        const result = await this.pool.query(sql, params);
        return result.rowCount ?? 0;
    }
}
