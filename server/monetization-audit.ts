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
    await pgQuery(`ALTER TABLE monetization_audit_log ADD COLUMN IF NOT EXISTS exception_type TEXT`).catch(() => {});
    await pgQuery(`ALTER TABLE monetization_audit_log ADD COLUMN IF NOT EXISTS failure_reason TEXT`).catch(() => {});
    await pgQuery(`ALTER TABLE monetization_audit_log ADD COLUMN IF NOT EXISTS retry_attempted BOOLEAN DEFAULT FALSE`).catch(() => {});
    await pgQuery(`ALTER TABLE monetization_audit_log ADD COLUMN IF NOT EXISTS resolution_status TEXT DEFAULT 'open'`).catch(() => {});
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

export async function logMonetizationAudit(entry: AuditEntry & { mismatch_type?: string; severity?: string; exception_type?: string; failure_reason?: string }): Promise<void> {
  try {
    await ensureMonetizationAuditTable();
    await pgQuery(
      `INSERT INTO monetization_audit_log (event_type, partner_id, lead_id, reason, metadata, mismatch_type, severity, exception_type, failure_reason, resolution_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [entry.event_type, entry.partner_id, entry.lead_id, entry.reason, entry.metadata ? JSON.stringify(entry.metadata) : null, entry.mismatch_type || null, entry.severity || null, entry.exception_type || null, entry.failure_reason || null, entry.exception_type ? "open" : null]
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

export async function getAutomationSupervisionData(): Promise<{
  summary: { total: number; success: number; skipped: number; blocked: number; failed: number };
  health_score: number;
  health_label: "HEALTHY" | "STABLE" | "CAUTION";
  exceptions: any[];
  alerts: { alert_type: string; severity: "warning" | "critical"; message: string }[];
  priority_flags: { type: string; detail: string }[];
}> {
  try {
    await ensureMonetizationAuditTable();
    const summaryRows = await pgQuery(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE exception_type = 'success')::int AS success,
        COUNT(*) FILTER (WHERE exception_type = 'skipped')::int AS skipped,
        COUNT(*) FILTER (WHERE exception_type = 'blocked')::int AS blocked,
        COUNT(*) FILTER (WHERE exception_type = 'failed')::int AS failed
      FROM monetization_audit_log
      WHERE mismatch_type IN ('automation_billing','automation_follow_up','automation_blocked')
        AND created_at > NOW() - INTERVAL '24 hours'
    `);
    const s = summaryRows[0] || { total: 0, success: 0, skipped: 0, blocked: 0, failed: 0 };
    const actionable = s.success + s.failed + s.blocked;
    const healthPct = actionable > 0 ? (s.success / actionable) * 100 : 100;
    const healthLabel: "HEALTHY" | "STABLE" | "CAUTION" = healthPct >= 90 ? "HEALTHY" : healthPct >= 80 ? "STABLE" : "CAUTION";

    const exceptions = await pgQuery(`
      SELECT id, event_type, partner_id, lead_id, reason, metadata, mismatch_type, severity,
             exception_type, failure_reason, retry_attempted, resolution_status, created_at
      FROM monetization_audit_log
      WHERE exception_type IN ('failed','blocked')
        AND mismatch_type IN ('automation_billing','automation_follow_up','automation_blocked')
        AND created_at > NOW() - INTERVAL '48 hours'
      ORDER BY created_at DESC LIMIT 50
    `);

    const alerts: { alert_type: string; severity: "warning" | "critical"; message: string }[] = [];
    if (s.failed >= 5) alerts.push({ alert_type: "HIGH FAILURE RATE", severity: "critical", message: `${s.failed} failed automation actions in 24h` });
    if (s.blocked >= 10) alerts.push({ alert_type: "REPEATED BLOCKS", severity: "warning", message: `${s.blocked} blocked actions in 24h` });

    const stripeFailRows = await pgQuery(
      `SELECT COUNT(*)::int AS cnt FROM monetization_audit_log WHERE failure_reason = 'stripe_error' AND created_at > NOW() - INTERVAL '24 hours'`
    ).catch(() => [{ cnt: 0 }]);
    if ((stripeFailRows[0]?.cnt || 0) >= 3) {
      alerts.push({ alert_type: "STRIPE FAILURE SPIKE", severity: "critical", message: `${stripeFailRows[0].cnt} Stripe errors in 24h` });
    }

    const priorityFlags: { type: string; detail: string }[] = [];
    try {
      const repeatedPartners = await pgQuery(`
        SELECT partner_id, COUNT(*)::int AS cnt
        FROM monetization_audit_log
        WHERE exception_type IN ('failed','blocked') AND partner_id IS NOT NULL
          AND created_at > NOW() - INTERVAL '24 hours'
        GROUP BY partner_id HAVING COUNT(*) >= 3
        ORDER BY cnt DESC LIMIT 5
      `);
      for (const rp of repeatedPartners) {
        priorityFlags.push({ type: "repeated_partner_failure", detail: `Partner ${rp.partner_id} has ${rp.cnt} failures/blocks in 24h` });
      }
    } catch {}
    try {
      const repeatedLeads = await pgQuery(`
        SELECT lead_id, COUNT(*)::int AS cnt
        FROM monetization_audit_log
        WHERE exception_type IN ('failed','blocked') AND lead_id IS NOT NULL
          AND created_at > NOW() - INTERVAL '24 hours'
        GROUP BY lead_id HAVING COUNT(*) >= 2
        ORDER BY cnt DESC LIMIT 5
      `);
      for (const rl of repeatedLeads) {
        priorityFlags.push({ type: "repeated_lead_failure", detail: `Lead ${rl.lead_id} has ${rl.cnt} failures/blocks` });
      }
    } catch {}
    if (healthLabel === "CAUTION") {
      priorityFlags.push({ type: "low_health_score", detail: `Health score at ${healthPct.toFixed(0)}% — below 80% threshold` });
    }

    return { summary: s, health_score: Math.round(healthPct), health_label: healthLabel, exceptions, alerts, priority_flags: priorityFlags };
  } catch {
    return { summary: { total: 0, success: 0, skipped: 0, blocked: 0, failed: 0 }, health_score: 100, health_label: "HEALTHY", exceptions: [], alerts: [], priority_flags: [] };
  }
}

export async function updateAuditResolution(id: string, resolution: string, resolvedBy: string): Promise<void> {
  try {
    await ensureMonetizationAuditTable();
    await pgQuery(
      `UPDATE monetization_audit_log SET resolution_status = $1, resolved_by = $2, resolved_at = NOW() WHERE id = $3`,
      [resolution, resolvedBy, id]
    );
  } catch (err: any) {
    console.error("[monetization-audit] Failed to update resolution:", err.message);
  }
}

export async function markRetryAttempted(id: string): Promise<void> {
  try {
    await ensureMonetizationAuditTable();
    await pgQuery(`UPDATE monetization_audit_log SET retry_attempted = TRUE WHERE id = $1`, [id]);
  } catch (err: any) {
    console.error("[monetization-audit] Failed to mark retry:", err.message);
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
