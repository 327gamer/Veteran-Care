import { query as pgQuery } from "./pg-client";

export interface AuditEntry {
  event_type: "routing_blocked" | "billing_blocked" | "eligibility_failure" | "subscription_mismatch" | "onboarding_mismatch";
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
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_mon_audit_type ON monetization_audit_log(event_type)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_mon_audit_created ON monetization_audit_log(created_at)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_mon_audit_partner ON monetization_audit_log(partner_id)`);
    _tableReady = true;
    console.log("[schema] monetization_audit_log table ready");
  } catch (err: any) {
    console.error("[schema] monetization_audit_log error:", err.message);
  }
}

export async function logMonetizationAudit(entry: AuditEntry): Promise<void> {
  try {
    await ensureMonetizationAuditTable();
    await pgQuery(
      `INSERT INTO monetization_audit_log (event_type, partner_id, lead_id, reason, metadata) VALUES ($1, $2, $3, $4, $5)`,
      [entry.event_type, entry.partner_id, entry.lead_id, entry.reason, entry.metadata ? JSON.stringify(entry.metadata) : null]
    );
  } catch (err: any) {
    console.error("[monetization-audit] Failed to log:", err.message);
  }
}

export async function getRecentAuditEntries(limit: number = 50): Promise<any[]> {
  try {
    await ensureMonetizationAuditTable();
    return await pgQuery(
      `SELECT id, event_type, partner_id, lead_id, reason, metadata, created_at FROM monetization_audit_log ORDER BY created_at DESC LIMIT $1`,
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
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS last_24h
      FROM monetization_audit_log
    `);
    return rows[0] || { total_blocks: 0, routing_blocked: 0, billing_blocked: 0, eligibility_failures: 0, subscription_mismatches: 0, onboarding_mismatches: 0, last_24h: 0 };
  } catch {
    return { total_blocks: 0, routing_blocked: 0, billing_blocked: 0, eligibility_failures: 0, subscription_mismatches: 0, onboarding_mismatches: 0, last_24h: 0 };
  }
}
