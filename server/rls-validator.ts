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
      await pgQuery(`ALTER TABLE public.${t.table_name} ENABLE ROW LEVEL SECURITY`);
      fixed.push(t.table_name);
    } else {
      already_secure.push(t.table_name);
    }
  }

  const after = await validateRlsIntegrity();
  return { fixed, already_secure, result: after };
}
