// ============================================================================
// Founder QA 2026-05-01 (Item #2): Lead Expiration Foundation
//
// Backend flag-only foundation for a 24-hour partner-response window. NO UI
// in this module — admin endpoint and routing-rotation hooks are added
// elsewhere. See supabase/20260501_lead_expiration_columns.sql for the
// schema source of truth.
//
// Public surface:
//   ensureLeadExpirationColumns()   — boot-time idempotent ALTER
//   setLeadExpiration(leadId, h?)   — set lead_expires_at = NOW() + h hours
//   expireStaleLeads()              — sweep pending leads past expiry
//
// Founder MASTER LAW compliance:
//   - Uses supabaseQuery (direct pg → Supabase) which SUPABASE_DB_PASSWORD
//     authorizes. NO drizzle migrations, NO db:push. The exact same SQL lives
//     in supabase/20260501_lead_expiration_columns.sql for canonical tracking.
//   - shared/schema.ts is intentionally untouched.
// ============================================================================

import { supabaseQuery, isSupabaseDbConfigured } from "./supabase-pg-client";

const hasSupabaseDirectAccess = isSupabaseDbConfigured;

const DEFAULT_EXPIRATION_HOURS = 24;

let columnsEnsured = false;

export async function ensureLeadExpirationColumns(): Promise<void> {
  if (columnsEnsured) return;
  if (!hasSupabaseDirectAccess()) {
    console.log("[lead-expiration] SUPABASE_DB_PASSWORD not configured — skipping column ensure (run supabase/20260501_lead_expiration_columns.sql manually)");
    return;
  }
  const statements: Array<{ sql: string; label: string }> = [
    {
      sql: `ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS lead_expires_at TIMESTAMPTZ`,
      label: "add lead_expires_at",
    },
    {
      sql: `ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ`,
      label: "add expired_at",
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_navigator_requests_pending_expiration
            ON navigator_requests (lead_expires_at)
            WHERE expired_at IS NULL AND response_status = 'pending'`,
      label: "add pending-expiration index",
    },
  ];
  for (const { sql, label } of statements) {
    try {
      await supabaseQuery(sql);
      console.log(`[lead-expiration] ${label} ✓`);
    } catch (err: any) {
      console.log(`[lead-expiration] ${label} skipped: ${err?.message}`);
    }
  }
  columnsEnsured = true;
}

// Called from sendLeadNotification + sendTrustedServiceLeadNotification
// once the partner notification email has been successfully delivered.
// Best-effort: a failure here logs but never blocks the email pipeline.
export async function setLeadExpiration(
  leadId: string,
  hoursFromNow: number = DEFAULT_EXPIRATION_HOURS,
): Promise<{ ok: boolean; expiresAt?: string; error?: string }> {
  if (!leadId) return { ok: false, error: "missing leadId" };
  if (!hasSupabaseDirectAccess()) {
    return { ok: false, error: "supabase direct access not configured" };
  }
  try {
    const expiresAt = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
    await supabaseQuery(
      `UPDATE navigator_requests
         SET lead_expires_at = $1
       WHERE id = $2
         AND expired_at IS NULL`,
      [expiresAt, leadId],
    );
    return { ok: true, expiresAt };
  } catch (err: any) {
    console.log(`[lead-expiration] setLeadExpiration(${leadId}) failed: ${err?.message}`);
    return { ok: false, error: err?.message };
  }
}

// Sweep pending leads whose 24h window has elapsed. Marks expired_at = NOW()
// so the routing rotation logic can treat them as reassignable. We do NOT
// flip response_status (would break dashboard filters); the expired_at
// timestamp is the source of truth for expiration.
//
// Safety net (added per code review 2026-05-01): the primary path expires
// leads whose lead_expires_at < NOW(). However, setLeadExpiration() is
// best-effort — if the partner email succeeded but the timestamp UPDATE
// failed (transient Supabase blip), lead_expires_at would be NULL and the
// lead would never expire. To prevent leads getting stuck forever, we ALSO
// expire pending leads where:
//   lead_expires_at IS NULL
//   AND email_sent_at IS NOT NULL
//   AND email_sent_at < NOW() - INTERVAL '24 hours'
// This guarantees that any lead the partner was actually notified about will
// expire after 24h, regardless of timestamp-write failures.
export async function expireStaleLeads(): Promise<{
  expiredCount: number;
  expiredIds: string[];
  error?: string;
}> {
  if (!hasSupabaseDirectAccess()) {
    return { expiredCount: 0, expiredIds: [], error: "supabase direct access not configured" };
  }
  try {
    const rows = await supabaseQuery<{ id: string }>(
      `UPDATE navigator_requests
         SET expired_at = NOW()
       WHERE expired_at IS NULL
         AND response_status = 'pending'
         AND (
           (lead_expires_at IS NOT NULL AND lead_expires_at < NOW())
           OR
           (lead_expires_at IS NULL AND email_sent_at IS NOT NULL AND email_sent_at < NOW() - INTERVAL '24 hours')
         )
       RETURNING id`,
    );
    const expiredIds = rows.map((r) => r.id);
    if (expiredIds.length > 0) {
      console.log(`[lead-expiration] Expired ${expiredIds.length} stale lead(s): ${expiredIds.join(", ")}`);
    }
    return { expiredCount: expiredIds.length, expiredIds };
  } catch (err: any) {
    console.log(`[lead-expiration] expireStaleLeads failed: ${err?.message}`);
    return { expiredCount: 0, expiredIds: [], error: err?.message };
  }
}
