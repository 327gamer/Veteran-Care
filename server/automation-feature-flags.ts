import { supabaseAdmin } from "./supabase";
import { logMonetizationAudit } from "./monetization-audit";

export type FeatureFlagName =
  | "auto_billing_enabled"
  | "auto_follow_up_enabled"
  | "escalation_enabled"
  | "confidence_scoring_enabled";

export const ALL_FLAGS: FeatureFlagName[] = [
  "auto_billing_enabled",
  "auto_follow_up_enabled",
  "escalation_enabled",
  "confidence_scoring_enabled",
];

export interface FeatureFlagState {
  feature_name: FeatureFlagName;
  enabled: boolean;
  enabled_at: string | null;
  last_modified_by: string | null;
}

let _flagCache: Map<string, { enabled: boolean; ts: number }> = new Map();
const CACHE_TTL = 5000;

async function ensureFlagRows(): Promise<void> {
  for (const flag of ALL_FLAGS) {
    try {
      const { data } = await supabaseAdmin
        .from("billing_config")
        .select("value")
        .eq("key", `flag_${flag}`)
        .single();
      if (!data) {
        await supabaseAdmin.from("billing_config").insert({ key: `flag_${flag}`, value: "false" });
      }
    } catch {
      try {
        await supabaseAdmin.from("billing_config").insert({ key: `flag_${flag}`, value: "false" });
      } catch {}
    }
  }
}

let _ensured = false;

export async function isFeatureEnabled(flag: FeatureFlagName): Promise<boolean> {
  const cached = _flagCache.get(flag);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.enabled;

  try {
    const { data } = await supabaseAdmin
      .from("billing_config")
      .select("value")
      .eq("key", `flag_${flag}`)
      .single();
    const enabled = data?.value === "true";
    _flagCache.set(flag, { enabled, ts: Date.now() });
    return enabled;
  } catch {
    return false;
  }
}

export async function setFeatureFlag(
  flag: FeatureFlagName,
  enabled: boolean,
  modifiedBy: string
): Promise<{ success: boolean; previous: boolean }> {
  const previous = await isFeatureEnabled(flag);

  try {
    const { error } = await supabaseAdmin
      .from("billing_config")
      .upsert({ key: `flag_${flag}`, value: enabled ? "true" : "false" }, { onConflict: "key" });

    if (error) throw error;

    _flagCache.set(flag, { enabled, ts: Date.now() });

    await logMonetizationAudit({
      event_type: "admin_action_taken" as any,
      partner_id: null,
      lead_id: null,
      reason: `Feature flag ${flag}: ${previous ? "ON" : "OFF"} → ${enabled ? "ON" : "OFF"} by ${modifiedBy}`,
      metadata: {
        action: "feature_toggle",
        feature_name: flag,
        previous_state: previous,
        new_state: enabled,
        changed_by: modifiedBy,
        changed_at: new Date().toISOString(),
      },
    });

    return { success: true, previous };
  } catch (err: any) {
    console.error("[feature-flags] Failed to set:", err.message);
    return { success: false, previous };
  }
}

export async function getAllFeatureFlags(): Promise<FeatureFlagState[]> {
  if (!_ensured) {
    await ensureFlagRows();
    _ensured = true;
  }

  const results: FeatureFlagState[] = [];

  for (const flag of ALL_FLAGS) {
    try {
      const { data } = await supabaseAdmin
        .from("billing_config")
        .select("value, updated_at")
        .eq("key", `flag_${flag}`)
        .single();

      results.push({
        feature_name: flag,
        enabled: data?.value === "true",
        enabled_at: data?.updated_at || null,
        last_modified_by: null,
      });
    } catch {
      results.push({
        feature_name: flag,
        enabled: false,
        enabled_at: null,
        last_modified_by: null,
      });
    }
  }

  return results;
}

export async function getFeatureToggleLog(): Promise<any[]> {
  try {
    const { query: pgQuery } = await import("./pg-client");
    const rows = await pgQuery(`
      SELECT id, reason, metadata, created_at
      FROM monetization_audit_log
      WHERE metadata->>'action' = 'feature_toggle'
      ORDER BY created_at DESC LIMIT 20
    `);
    return rows.map((r: any) => {
      const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata || {};
      return {
        id: r.id,
        feature_name: meta.feature_name,
        previous_state: meta.previous_state,
        new_state: meta.new_state,
        changed_by: meta.changed_by,
        changed_at: meta.changed_at || r.created_at,
      };
    });
  } catch {
    return [];
  }
}
