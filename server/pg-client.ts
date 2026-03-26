import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
const SLOW_QUERY_THRESHOLD_MS = 500;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required for direct database operations");
    }
    pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const p = getPool();
  const start = Date.now();
  const result = await p.query(sql, params);
  const duration = Date.now() - start;
  if (duration >= SLOW_QUERY_THRESHOLD_MS) {
    const truncatedSql = sql.replace(/\s+/g, " ").trim().substring(0, 200);
    console.warn(`[SLOW QUERY] ${duration}ms | ${truncatedSql}${sql.length > 200 ? "..." : ""} | params: ${params ? params.length : 0} | rows: ${result.rowCount}`);
  }
  return result.rows as T[];
}
