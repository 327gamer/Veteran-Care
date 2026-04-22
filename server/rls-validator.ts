import { query as pgQuery } from "./pg-client";

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
  passed: boolean;
  total_tables: number;
  rls_enabled_count: number;
  rls_disabled_count: number;
  exposed_tables: string[];
  tables: RlsTableStatus[];
  timestamp: string;
}

const PUBLIC_READ_TABLES = ["trusted_service_categories", "trusted_services"];
const AUTHENTICATED_TABLES = ["partner_applications"];

export async function validateRlsIntegrity(): Promise<RlsValidationResult> {
  const tables = await pgQuery<{ tablename: string; rowsecurity: boolean }>(
    "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );

  const policies = await pgQuery<{ tablename: string; policyname: string; cmd: string; roles: string[] }>(
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
    const anonAccess = !t.rowsecurity;
    const publicWrite = !t.rowsecurity;

    if (!t.rowsecurity) exposed.push(t.tablename);

    result.push({
      table_name: t.tablename,
      rls_enabled: t.rowsecurity,
      has_policies: hasPolicies,
      policy_names: policyMap[t.tablename] || [],
      classification,
      anon_access: anonAccess,
      public_write_exposure: publicWrite,
    });
  }

  return {
    passed: exposed.length === 0,
    total_tables: tables.length,
    rls_enabled_count: tables.filter(t => t.rowsecurity).length,
    rls_disabled_count: tables.filter(t => !t.rowsecurity).length,
    exposed_tables: exposed,
    tables: result,
    timestamp: new Date().toISOString(),
  };
}

export async function enforceRls(): Promise<{ fixed: string[]; already_secure: string[]; result: RlsValidationResult }> {
  const before = await validateRlsIntegrity();
  const fixed: string[] = [];
  const already_secure: string[] = [];

  for (const t of before.tables) {
    if (!t.rls_enabled) {
      const ts = new Date().toISOString();
      // Loud, structured log — every fix MUST be visible in production logs and
      // searchable via grep. This is a security-critical event, not routine.
      console.error(
        `[RLS-AUTOFIX] CRITICAL: table public.${t.table_name} had RLS DISABLED — ` +
        `enabling now. timestamp=${ts} action=ALTER_TABLE_ENABLE_ROW_LEVEL_SECURITY ` +
        `classification=${t.classification} had_policies=${t.has_policies}`
      );
      try {
        await pgQuery(`ALTER TABLE public.${t.table_name} ENABLE ROW LEVEL SECURITY`);
        fixed.push(t.table_name);
        console.error(
          `[RLS-AUTOFIX] FIXED: public.${t.table_name} now has ROW LEVEL SECURITY ENABLED. ` +
          `timestamp=${new Date().toISOString()} status=success`
        );
      } catch (err: any) {
        console.error(
          `[RLS-AUTOFIX] FAILED to enable RLS on public.${t.table_name}: ${err?.message || err}. ` +
          `timestamp=${new Date().toISOString()} status=error MANUAL_INTERVENTION_REQUIRED`
        );
      }
    } else {
      already_secure.push(t.table_name);
    }
  }

  const after = await validateRlsIntegrity();
  return { fixed, already_secure, result: after };
}

// Daily RLS re-check timer. Reactive (boot) + proactive (every 24h) coverage.
// Closes the window between any future runtime CREATE TABLE and the next
// restart. Cheap: validateRlsIntegrity is two small system-table queries.
let _rlsTimerHandle: ReturnType<typeof setInterval> | null = null;
const RLS_RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function startRlsRecheckTimer(intervalMs: number = RLS_RECHECK_INTERVAL_MS): void {
  if (_rlsTimerHandle) return; // idempotent — only one timer ever
  const tick = async () => {
    try {
      const check = await validateRlsIntegrity();
      if (check.passed) {
        console.log(
          `[RLS-RECHECK] OK — ${check.total_tables} public tables, all RLS-enabled. ` +
          `timestamp=${check.timestamp}`
        );
        return;
      }
      console.error(
        `[RLS-RECHECK] EXPOSURE DETECTED between boots: ${check.rls_disabled_count} table(s) ` +
        `lost RLS protection: ${check.exposed_tables.join(", ")}. Auto-enforcing now. ` +
        `timestamp=${check.timestamp}`
      );
      const fix = await enforceRls();
      console.error(
        `[RLS-RECHECK] AUTOFIX RESULT: fixed=${fix.fixed.length} (${fix.fixed.join(", ") || "none"}) ` +
        `final_passed=${fix.result.passed} ` +
        `still_exposed=${fix.result.exposed_tables.join(", ") || "none"}`
      );
    } catch (err: any) {
      console.error(`[RLS-RECHECK] Timer tick failed: ${err?.message || err}`);
    }
  };
  _rlsTimerHandle = setInterval(tick, intervalMs);
  console.log(`[RLS-RECHECK] Daily re-check timer started (every ${Math.round(intervalMs / 3600000)}h)`);
  // Fire one tick ~30 seconds after boot too, so we have an early-warning
  // pass that's independent of the boot-time enforce (catches anything that
  // happened between boot-time enforce and now).
  setTimeout(tick, 30_000);
}
