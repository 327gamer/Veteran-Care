import { query as pgQuery } from "./pg-client";
import { supabaseQuery, isSupabaseDbConfigured } from "./supabase-pg-client";

// =============================================================================
// UNIFIED DUAL-DATABASE RLS ENFORCER
// =============================================================================
// Veteran Care runs on TWO Postgres databases:
//   - HELIUM   : Replit-managed DB (DATABASE_URL) — primary app data
//   - SUPABASE : External Supabase project — billing_config, billing_runs,
//                optimization_actions_log, partner_rotation_state, etc.
//
// This enforcer scans BOTH on boot, every 30s after boot, and every 24h, and
// auto-enables RLS on any public-schema table that is missing it. Service-role
// connections bypass RLS by design, so server functionality is unaffected;
// anon and authenticated roles get deny-all when no policies exist.
//
// All actions are loudly logged with [RLS-AUTOFIX] / [RLS-RECHECK] prefixes
// and a `db=HELIUM` or `db=SUPABASE` tag for grep-ability.
// =============================================================================

export type DbLabel = "HELIUM" | "SUPABASE";
type QueryFn = <T = any>(sql: string, params?: any[]) => Promise<T[]>;

export interface RlsTableStatus {
  table_name: string;
  rls_enabled: boolean;
  has_policies: boolean;
  policy_names: string[];
  classification: "SERVER_ONLY" | "PUBLIC_READ" | "AUTHENTICATED" | "INTERNAL_OPS";
  anon_access: boolean;
  public_write_exposure: boolean;
}

export interface RlsValidationResult {
  db: DbLabel;
  passed: boolean;
  total_tables: number;
  rls_enabled_count: number;
  rls_disabled_count: number;
  exposed_tables: string[];
  tables: RlsTableStatus[];
  timestamp: string;
}

export interface RlsEnforceResult {
  db: DbLabel;
  fixed: string[];
  already_secure: string[];
  result: RlsValidationResult;
}

export interface UnifiedRlsResult {
  helium: RlsValidationResult;
  supabase: RlsValidationResult | { db: "SUPABASE"; skipped: true; reason: string };
  all_passed: boolean;
  timestamp: string;
}

export interface UnifiedEnforceResult {
  helium: RlsEnforceResult;
  supabase: RlsEnforceResult | { db: "SUPABASE"; skipped: true; reason: string };
  all_passed: boolean;
  timestamp: string;
}

const PUBLIC_READ_TABLES = ["trusted_service_categories", "trusted_services"];
const AUTHENTICATED_TABLES = ["partner_applications"];

// ---------------------------------------------------------------------------
// Generic core (works against any pg-compatible query function)
// ---------------------------------------------------------------------------

async function validateFor(db: DbLabel, q: QueryFn): Promise<RlsValidationResult> {
  const tables = await q<{ tablename: string; rowsecurity: boolean }>(
    "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  const policies = await q<{ tablename: string; policyname: string; cmd: string; roles: string[] }>(
    "SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public'"
  );

  const policyMap: Record<string, string[]> = {};
  for (const p of policies) {
    if (!policyMap[p.tablename]) policyMap[p.tablename] = [];
    policyMap[p.tablename].push(p.policyname);
  }

  const result: RlsTableStatus[] = [];
  const exposed: string[] = [];

  for (const t of tables) {
    let classification: RlsTableStatus["classification"] = "SERVER_ONLY";
    if (PUBLIC_READ_TABLES.includes(t.tablename)) classification = "PUBLIC_READ";
    else if (AUTHENTICATED_TABLES.includes(t.tablename)) classification = "AUTHENTICATED";

    const hasPolicies = !!(policyMap[t.tablename] && policyMap[t.tablename].length > 0);
    if (!t.rowsecurity) exposed.push(t.tablename);

    result.push({
      table_name: t.tablename,
      rls_enabled: t.rowsecurity,
      has_policies: hasPolicies,
      policy_names: policyMap[t.tablename] || [],
      classification,
      anon_access: !t.rowsecurity,
      public_write_exposure: !t.rowsecurity,
    });
  }

  return {
    db,
    passed: exposed.length === 0,
    total_tables: tables.length,
    rls_enabled_count: tables.filter(t => t.rowsecurity).length,
    rls_disabled_count: tables.filter(t => !t.rowsecurity).length,
    exposed_tables: exposed,
    tables: result,
    timestamp: new Date().toISOString(),
  };
}

async function enforceFor(db: DbLabel, q: QueryFn): Promise<RlsEnforceResult> {
  const before = await validateFor(db, q);
  const fixed: string[] = [];
  const already_secure: string[] = [];

  for (const t of before.tables) {
    if (!t.rls_enabled) {
      const ts = new Date().toISOString();
      console.error(
        `[RLS-AUTOFIX] db=${db} CRITICAL: table public.${t.table_name} had RLS DISABLED — ` +
        `enabling now. timestamp=${ts} action=ALTER_TABLE_ENABLE_ROW_LEVEL_SECURITY ` +
        `classification=${t.classification} had_policies=${t.has_policies}`
      );
      try {
        await q(`ALTER TABLE public.${t.table_name} ENABLE ROW LEVEL SECURITY`);
        fixed.push(t.table_name);
        console.error(
          `[RLS-AUTOFIX] db=${db} FIXED: public.${t.table_name} now has ROW LEVEL SECURITY ENABLED. ` +
          `timestamp=${new Date().toISOString()} status=success`
        );
      } catch (err: any) {
        console.error(
          `[RLS-AUTOFIX] db=${db} FAILED to enable RLS on public.${t.table_name}: ${err?.message || err}. ` +
          `timestamp=${new Date().toISOString()} status=error MANUAL_INTERVENTION_REQUIRED`
        );
      }
    } else {
      already_secure.push(t.table_name);
    }
  }

  const after = await validateFor(db, q);
  return { db, fixed, already_secure, result: after };
}

// ---------------------------------------------------------------------------
// Per-DB convenience exports (back-compat with previous Helium-only callers)
// ---------------------------------------------------------------------------

export async function validateRlsIntegrity(): Promise<RlsValidationResult> {
  return validateFor("HELIUM", pgQuery);
}

export async function enforceRls(): Promise<RlsEnforceResult> {
  return enforceFor("HELIUM", pgQuery);
}

export async function validateSupabaseRls(): Promise<RlsValidationResult> {
  return validateFor("SUPABASE", supabaseQuery);
}

export async function enforceSupabaseRls(): Promise<RlsEnforceResult> {
  return enforceFor("SUPABASE", supabaseQuery);
}

// ---------------------------------------------------------------------------
// Unified dual-DB orchestrators (the new API the boot block + admin uses)
// ---------------------------------------------------------------------------

export async function validateAllDatabases(): Promise<UnifiedRlsResult> {
  const helium = await validateFor("HELIUM", pgQuery);
  let supabase: UnifiedRlsResult["supabase"];
  if (!isSupabaseDbConfigured()) {
    supabase = { db: "SUPABASE", skipped: true, reason: "SUPABASE_DB_PASSWORD not set" };
  } else {
    try {
      supabase = await validateFor("SUPABASE", supabaseQuery);
    } catch (err: any) {
      supabase = { db: "SUPABASE", skipped: true, reason: `connection failed: ${err?.message || err}` };
    }
  }
  const all_passed = helium.passed && (("passed" in supabase) ? supabase.passed : false);
  return { helium, supabase, all_passed, timestamp: new Date().toISOString() };
}

export async function enforceAllDatabases(): Promise<UnifiedEnforceResult> {
  const helium = await enforceFor("HELIUM", pgQuery);
  let supabase: UnifiedEnforceResult["supabase"];
  if (!isSupabaseDbConfigured()) {
    supabase = { db: "SUPABASE", skipped: true, reason: "SUPABASE_DB_PASSWORD not set" };
  } else {
    try {
      supabase = await enforceFor("SUPABASE", supabaseQuery);
    } catch (err: any) {
      supabase = { db: "SUPABASE", skipped: true, reason: `connection failed: ${err?.message || err}` };
    }
  }
  const all_passed = helium.result.passed && (("result" in supabase) ? supabase.result.passed : false);
  return { helium, supabase, all_passed, timestamp: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Daily re-check timer (covers BOTH databases)
// ---------------------------------------------------------------------------

let _rlsTimerHandle: ReturnType<typeof setInterval> | null = null;
const RLS_RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function startRlsRecheckTimer(intervalMs: number = RLS_RECHECK_INTERVAL_MS): void {
  if (_rlsTimerHandle) return; // idempotent

  const tickOne = async (db: DbLabel, q: QueryFn) => {
    try {
      const check = await validateFor(db, q);
      if (check.passed) {
        console.log(
          `[RLS-RECHECK] db=${db} OK — ${check.total_tables} public tables, all RLS-enabled. ` +
          `timestamp=${check.timestamp}`
        );
        return;
      }
      console.error(
        `[RLS-RECHECK] db=${db} EXPOSURE DETECTED between boots: ${check.rls_disabled_count} table(s) ` +
        `lost RLS protection: ${check.exposed_tables.join(", ")}. Auto-enforcing now. ` +
        `timestamp=${check.timestamp}`
      );
      const fix = await enforceFor(db, q);
      console.error(
        `[RLS-RECHECK] db=${db} AUTOFIX RESULT: fixed=${fix.fixed.length} (${fix.fixed.join(", ") || "none"}) ` +
        `final_passed=${fix.result.passed} ` +
        `still_exposed=${fix.result.exposed_tables.join(", ") || "none"}`
      );
    } catch (err: any) {
      console.error(`[RLS-RECHECK] db=${db} timer tick failed: ${err?.message || err}`);
    }
  };

  const tick = async () => {
    await tickOne("HELIUM", pgQuery);
    if (isSupabaseDbConfigured()) {
      await tickOne("SUPABASE", supabaseQuery);
    } else {
      console.warn(
        `[RLS-RECHECK] db=SUPABASE SKIPPED — SUPABASE_DB_PASSWORD not set. ` +
        `Add the secret in Replit Secrets to enable dual-DB enforcement. ` +
        `timestamp=${new Date().toISOString()}`
      );
    }
  };

  _rlsTimerHandle = setInterval(tick, intervalMs);
  console.log(
    `[RLS-RECHECK] Daily dual-DB re-check timer started (every ${Math.round(intervalMs / 3600000)}h, ` +
    `supabase_enforcement=${isSupabaseDbConfigured() ? "ENABLED" : "DISABLED"})`
  );
  // Early-warning tick 30s after boot.
  setTimeout(tick, 30_000);
}
