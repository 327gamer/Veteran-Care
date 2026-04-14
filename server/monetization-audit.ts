import { query as pgQuery } from "./pg-client";

export interface AuditEntry {
  event_type: "routing_blocked" | "billing_blocked" | "eligibility_failure" | "subscription_mismatch" | "onboarding_mismatch" | "mismatch_detected" | "mismatch_resolved" | "admin_action_taken";
  partner_id: string | null;
  lead_id: string | null;
  reason: string;
  metadata?: Record<string, any> | null;
}

let _tableReady = false;

export async function ensureMonetizationAuditTable(): Promise<void> {
  if (_tableReady) return;
  try {
    await pgQuery(`
      CREATE TABLE IF NOT EXISTS monetization_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type TEXT NOT NULL,
        partner_id UUID,
        lead_id UUID,
        reason TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgQuery(`ALTER TABLE monetization_audit_log ADD COLUMN IF NOT EXISTS mismatch_type TEXT`).catch(() => {});
    await pgQuery(`ALTER TABLE monetization_audit_log ADD COLUMN IF NOT EXISTS severity TEXT`).catch(() => {});
    await pgQuery(`ALTER TABLE monetization_audit_log ADD COLUMN IF NOT EXISTS resolution_action TEXT`).catch(() => {});
    await pgQuery(`ALTER TABLE monetization_audit_log ADD COLUMN IF NOT EXISTS resolved_by TEXT`).catch(() => {});
    await pgQuery(`ALTER TABLE monetization_audit_log ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ`).catch(() => {});
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_mon_audit_type ON monetization_audit_log(event_type)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_mon_audit_created ON monetization_audit_log(created_at)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_mon_audit_partner ON monetization_audit_log(partner_id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_mon_audit_mismatch ON monetization_audit_log(mismatch_type)`).catch(() => {});
    _tableReady = true;
    console.log("[schema] monetization_audit_log table ready (extended)");
  } catch (err: any) {
    console.error("[schema] monetization_audit_log error:", err.message);
  }
}

export async function logMonetizationAudit(entry: AuditEntry & { mismatch_type?: string; severity?: string }): Promise<void> {
  try {
    await ensureMonetizationAuditTable();
    await pgQuery(
      `INSERT INTO monetization_audit_log (event_type, partner_id, lead_id, reason, metadata, mismatch_type, severity) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [entry.event_type, entry.partner_id, entry.lead_id, entry.reason, entry.metadata ? JSON.stringify(entry.metadata) : null, entry.mismatch_type || null, entry.severity || null]
    );
  } catch (err: any) {
    console.error("[monetization-audit] Failed to log:", err.message);
  }
}

export async function logMismatchResolution(auditId: string, action: string, resolvedBy: string): Promise<void> {
  try {
    await ensureMonetizationAuditTable();
    await pgQuery(
      `UPDATE monetization_audit_log SET resolution_action = $1, resolved_by = $2, resolved_at = NOW() WHERE id = $3`,
      [action, resolvedBy, auditId]
    );
  } catch (err: any) {
    console.error("[monetization-audit] Failed to log resolution:", err.message);
  }
}

export async function getRecentAuditEntries(limit: number = 50): Promise<any[]> {
  try {
    await ensureMonetizationAuditTable();
    return await pgQuery(
      `SELECT id, event_type, partner_id, lead_id, reason, metadata, mismatch_type, severity, resolution_action, resolved_by, resolved_at, created_at FROM monetization_audit_log ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
  } catch {
    return [];
  }
}

export async function getAuditSummary(): Promise<{
  total_blocks: number;
  routing_blocked: number;
  billing_blocked: number;
  eligibility_failures: number;
  subscription_mismatches: number;
  onboarding_mismatches: number;
  last_24h: number;
  resolved_today: number;
  unresolved: number;
}> {
  try {
    await ensureMonetizationAuditTable();
    const rows = await pgQuery(`
      SELECT
        COUNT(*)::int AS total_blocks,
        COUNT(*) FILTER (WHERE event_type = 'routing_blocked')::int AS routing_blocked,
        COUNT(*) FILTER (WHERE event_type = 'billing_blocked')::int AS billing_blocked,
        COUNT(*) FILTER (WHERE event_type = 'eligibility_failure')::int AS eligibility_failures,
        COUNT(*) FILTER (WHERE event_type = 'subscription_mismatch')::int AS subscription_mismatches,
        COUNT(*) FILTER (WHERE event_type = 'onboarding_mismatch')::int AS onboarding_mismatches,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS last_24h,
        COUNT(*) FILTER (WHERE resolved_at IS NOT NULL AND resolved_at > NOW() - INTERVAL '24 hours')::int AS resolved_today,
        COUNT(*) FILTER (WHERE event_type IN ('mismatch_detected','subscription_mismatch','onboarding_mismatch','eligibility_failure') AND resolved_at IS NULL)::int AS unresolved
      FROM monetization_audit_log
    `);
    return rows[0] || { total_blocks: 0, routing_blocked: 0, billing_blocked: 0, eligibility_failures: 0, subscription_mismatches: 0, onboarding_mismatches: 0, last_24h: 0, resolved_today: 0, unresolved: 0 };
  } catch {
    return { total_blocks: 0, routing_blocked: 0, billing_blocked: 0, eligibility_failures: 0, subscription_mismatches: 0, onboarding_mismatches: 0, last_24h: 0, resolved_today: 0, unresolved: 0 };
  }
}

export type MismatchType = "subscription_mismatch" | "eligibility_mismatch" | "onboarding_mismatch" | "configuration_mismatch";
export type MismatchSeverity = "warning" | "critical";

export interface ClassifiedMismatch {
  partner_id: string;
  name: string;
  mismatch_type: MismatchType;
  severity: MismatchSeverity;
  issues: string[];
  subscription_status: string | null;
  active_paid_partner: boolean;
  onboarding_status: string | null;
  is_active: boolean;
  is_lead_enabled: boolean;
  partner_status_override: string | null;
  routing_eligible: boolean;
  billing_eligible: boolean;
  recommended_action: string;
}

export function classifyMismatches(partners: any[]): ClassifiedMismatch[] {
  const results: ClassifiedMismatch[] = [];
  for (const p of partners) {
    const routingEligible = p.is_active && p.is_lead_enabled && p.active_paid_partner === true
      && (!p.subscription_status || p.subscription_status === "active")
      && (!p.onboarding_status || p.onboarding_status === "active")
      && p.partner_status_override !== "paused";
    const billingEligible = p.is_active && p.active_paid_partner !== false
      && (!p.subscription_status || p.subscription_status === "active")
      && (!p.onboarding_status || p.onboarding_status === "active")
      && p.partner_status_override !== "paused";

    if (p.active_paid_partner && p.subscription_status && p.subscription_status !== "active") {
      results.push({
        partner_id: p.id, name: p.name, mismatch_type: "subscription_mismatch",
        severity: "critical", issues: [`paid but subscription_status=${p.subscription_status}`],
        subscription_status: p.subscription_status, active_paid_partner: p.active_paid_partner,
        onboarding_status: p.onboarding_status, is_active: p.is_active, is_lead_enabled: p.is_lead_enabled,
        partner_status_override: p.partner_status_override,
        routing_eligible: routingEligible, billing_eligible: billingEligible,
        recommended_action: "Sync subscription status from Stripe",
      });
    }
    if (p.is_active && p.active_paid_partner === false) {
      results.push({
        partner_id: p.id, name: p.name, mismatch_type: "subscription_mismatch",
        severity: "critical", issues: ["active but not paid"],
        subscription_status: p.subscription_status, active_paid_partner: p.active_paid_partner,
        onboarding_status: p.onboarding_status, is_active: p.is_active, is_lead_enabled: p.is_lead_enabled,
        partner_status_override: p.partner_status_override,
        routing_eligible: routingEligible, billing_eligible: billingEligible,
        recommended_action: "Sync subscription status from Stripe",
      });
    }
    if (p.active_paid_partner && !p.is_lead_enabled) {
      results.push({
        partner_id: p.id, name: p.name, mismatch_type: "eligibility_mismatch",
        severity: "warning", issues: ["paid but is_lead_enabled=false"],
        subscription_status: p.subscription_status, active_paid_partner: p.active_paid_partner,
        onboarding_status: p.onboarding_status, is_active: p.is_active, is_lead_enabled: p.is_lead_enabled,
        partner_status_override: p.partner_status_override,
        routing_eligible: routingEligible, billing_eligible: billingEligible,
        recommended_action: "Enable lead eligibility for this partner",
      });
    }
    if (p.is_active && p.onboarding_status && p.onboarding_status !== "active") {
      results.push({
        partner_id: p.id, name: p.name, mismatch_type: "onboarding_mismatch",
        severity: p.active_paid_partner ? "critical" : "warning",
        issues: [`active but onboarding_status=${p.onboarding_status}`],
        subscription_status: p.subscription_status, active_paid_partner: p.active_paid_partner,
        onboarding_status: p.onboarding_status, is_active: p.is_active, is_lead_enabled: p.is_lead_enabled,
        partner_status_override: p.partner_status_override,
        routing_eligible: routingEligible, billing_eligible: billingEligible,
        recommended_action: "Complete onboarding activation",
      });
    }
    if (p.active_paid_partner && p.partner_status_override === "paused") {
      results.push({
        partner_id: p.id, name: p.name, mismatch_type: "configuration_mismatch",
        severity: "warning", issues: ["paid but partner_status_override=paused"],
        subscription_status: p.subscription_status, active_paid_partner: p.active_paid_partner,
        onboarding_status: p.onboarding_status, is_active: p.is_active, is_lead_enabled: p.is_lead_enabled,
        partner_status_override: p.partner_status_override,
        routing_eligible: routingEligible, billing_eligible: billingEligible,
        recommended_action: "Review partner configuration settings",
      });
    }
  }
  return results;
}
