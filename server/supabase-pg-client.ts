import pg from "pg";

// Direct Postgres client for the SUPABASE project (separate from Helium DB).
// Used exclusively by the unified RLS enforcer so it can run DDL (ALTER TABLE
// ENABLE ROW LEVEL SECURITY) on Supabase tables — something the REST/PostgREST
// API cannot do.
//
// Requires SUPABASE_DB_PASSWORD (the Postgres password from Supabase →
// Project Settings → Database → Database password). The connection itself uses
// SUPABASE_URL to derive the project ref. SSL is required by Supabase.
//
// If the password secret is not set, getSupabasePool() returns null and the
// caller MUST treat Supabase as "unmonitored" and log a clear warning.
// Helium-side enforcement is unaffected.

const SLOW_QUERY_THRESHOLD_MS = 1000;
let pool: pg.Pool | null = null;
let configCheckedAndMissing = false;

export function isSupabaseDbConfigured(): boolean {
  return !!(process.env.SUPABASE_DB_PASSWORD && process.env.SUPABASE_URL);
}

export function getSupabaseProjectRef(): string | null {
  const url = process.env.SUPABASE_URL || "";
  const m = url.replace(/^https?:\/\//, "").split(".")[0];
  return m || null;
}

export function getSupabasePool(): pg.Pool | null {
  if (!isSupabaseDbConfigured()) {
    if (!configCheckedAndMissing) {
      console.error(
        "[RLS-SUPABASE] SUPABASE_DB_PASSWORD secret not set — Supabase RLS " +
        "enforcer is DISABLED. Helium DB enforcement continues normally. " +
        "Add the secret in Replit Secrets to enable dual-DB protection."
      );
      configCheckedAndMissing = true;
    }
    return null;
  }
  if (!pool) {
    const ref = getSupabaseProjectRef();
    if (!ref) {
      console.error("[RLS-SUPABASE] SUPABASE_URL malformed — cannot derive project ref");
      return null;
    }
    const password = process.env.SUPABASE_DB_PASSWORD!;
    // Direct connection (port 5432) — supports DDL. Pooler (6543) is
    // transaction-mode and safer here than session, but DDL works on direct.
    const conn = `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
    pool = new pg.Pool({
      connectionString: conn,
      ssl: { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    pool.on("error", (err) => {
      console.error(`[RLS-SUPABASE] Pool error: ${err.message}`);
    });
  }
  return pool;
}

export async function supabaseQuery<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const p = getSupabasePool();
  if (!p) throw new Error("SUPABASE_DB_PASSWORD not configured");
  const start = Date.now();
  const result = await p.query(sql, params);
  const duration = Date.now() - start;
  if (duration >= SLOW_QUERY_THRESHOLD_MS) {
    const truncatedSql = sql.replace(/\s+/g, " ").trim().substring(0, 200);
    console.warn(`[SLOW QUERY supabase] ${duration}ms | ${truncatedSql}${sql.length > 200 ? "..." : ""}`);
  }
  return result.rows as T[];
}
