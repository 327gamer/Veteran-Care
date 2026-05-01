-- Founder QA 2026-05-01 (small visibility patch):
-- Adds the payment_failure_reason column to navigator_requests so the
-- existing 5 charge-failure write sites in server/routes.ts (which already
-- attempt to write this field with a try/catch fallback) can persist the
-- Stripe failure reason for admin debugging.
--
-- Examples of values written: "card_declined", "insufficient_funds",
-- "expired_card", "authentication_required", "no_stripe_customer", or any
-- raw Stripe error message string.
--
-- Idempotent — safe to run any number of times. No backfill needed (NULL
-- is the correct value for existing rows that were never charge-failed,
-- or were charge-failed before this column existed).
--
-- Apply via Supabase SQL editor or via the boot-time auto-apply in
-- server/lead-expiration.ts ensureLeadExpirationColumns() (uses
-- SUPABASE_DB_PASSWORD direct PG access).
--
-- NO db:push EVER. NO db:push --force EVER.

ALTER TABLE navigator_requests
  ADD COLUMN IF NOT EXISTS payment_failure_reason TEXT;
