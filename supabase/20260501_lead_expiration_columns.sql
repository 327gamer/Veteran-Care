-- ============================================================================
-- Founder QA 2026-05-01 (Item #2): Lead Expiration Foundation
--
-- Purpose:
--   Add two timestamp columns to navigator_requests so that pending leads can
--   be tracked toward a 24-hour partner-response window. NO UI changes in
--   this migration — backend flag-only foundation per founder spec.
--
-- Columns added (idempotent — IF NOT EXISTS):
--   lead_expires_at  TIMESTAMPTZ
--     The deadline by which the currently-assigned partner must Accept the
--     lead. Set when the partner notification email is sent (default = email
--     send time + 24h). NULL = no deadline tracked yet (legacy rows).
--
--   expired_at       TIMESTAMPTZ
--     The actual time the lead was marked expired by the expireStaleLeads
--     job. NULL = lead has not been expired yet. When non-null, the lead is
--     considered eligible for reassignment by future router rotations.
--
-- NOT touched (preserved):
--   response_status enum — stays { pending | accepted | declined | completed
--   | escalation_required }. We deliberately do NOT add an "expired" value to
--   avoid breaking existing UI filters / dashboards. The expired_at timestamp
--   is the source of truth for expiration.
--
-- Index:
--   Partial index on (lead_expires_at) WHERE expired_at IS NULL AND
--   response_status = 'pending' — keeps the expireStaleLeads scan O(log n)
--   even as the table grows.
--
-- Founder MASTER LAW compliance:
--   - SQL migration file (NO db:push). Apply via psql or via the boot-time
--     ensureLeadExpirationColumns() helper in server/lead-expiration.ts which
--     runs the same idempotent ALTER statements via supabaseQuery().
--   - shared/schema.ts unchanged (intentionally users-only).
--   - No Stripe / billing / AI Guide / Resources schema changes.
-- ============================================================================

ALTER TABLE navigator_requests
  ADD COLUMN IF NOT EXISTS lead_expires_at TIMESTAMPTZ;

ALTER TABLE navigator_requests
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_navigator_requests_pending_expiration
  ON navigator_requests (lead_expires_at)
  WHERE expired_at IS NULL AND response_status = 'pending';
