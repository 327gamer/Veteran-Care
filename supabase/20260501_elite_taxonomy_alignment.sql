-- ============================================================================
-- 20260501_elite_taxonomy_alignment.sql
-- Founder QA 2026-05-01 — Audit v2 Fixes 1 & 2
-- ----------------------------------------------------------------------------
-- This migration is IDEMPOTENT. Safe to re-run.
-- It does NOT add columns, drop tables, or change any schema (founder MASTER
-- LAW: NO db:push, no Drizzle changes outside `users`). Pure data alignment.
--
-- Applied live against Supabase via server/supabase-pg-client.ts on
-- 2026-05-01. This file exists for the historical migration trail.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FIX 1 — Clear stale `sponsor_name` on the SC × legal-services TEST slot.
--
-- Slot id ca6ca3ee-8253-4500-9f4b-4e9c01616667 is currently `vacant` /
-- `billing_status='cancelled'` (a prior founder test sale that was already
-- unsold) but still carries a stale `sponsor_name = 'TEST — Founder'` that
-- could be displayed by a stale cache or admin lookup. Stripe IDs and the
-- audit-history fields (sold_at, unsold_at) are intentionally LEFT INTACT
-- so the test sale still appears in audit reports.
--
-- The WHERE clause is keyed by the immutable slot UUID — re-running on a
-- newly-sold slot will fail-safe (UPDATE matches 0 rows or only the named
-- TEST row).
-- ----------------------------------------------------------------------------
-- Architect-hardened (Founder QA review): added status/billing predicates
-- so a future re-run can never wipe sponsor_name from a freshly-sold slot
-- that happens to share the id (paranoia — id is a UUID and won't recur,
-- but defense in depth).
UPDATE elite_sponsor_slots
SET sponsor_name = NULL,
    updated_at   = now()
WHERE id = 'ca6ca3ee-8253-4500-9f4b-4e9c01616667'
  AND sponsor_name = 'TEST — Founder'
  AND status = 'vacant'
  AND billing_status = 'cancelled'
  AND unsold_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- FIX 2 — Add 3 missing taxonomy entries to `trusted_service_categories`
--
-- Backend `ECSS_CATEGORIES` (server/elite-sponsor.ts) and several frontend
-- pages already reference these slugs, but the canonical taxonomy table was
-- missing the rows, so any join/lookup against this table for these slugs
-- returned empty.
--
-- Display order continues from the existing 9 rows (real-estate at 9 →
-- new entries at 10, 11, 12). Idempotent via ON CONFLICT (slug) DO NOTHING.
-- ----------------------------------------------------------------------------
INSERT INTO trusted_service_categories
  (name, slug, description, icon, display_order, is_active)
VALUES
  ('Auto Services',
   'auto-services',
   'Veteran-friendly auto sales, service, and financing partners.',
   'car',
   10,
   true),
  ('End-of-Life Services',
   'end-of-life-services',
   'Funeral planning, military honors, burial benefits, and bereavement support.',
   'flame',
   11,
   true),
  ('Travel Services',
   'travel-services',
   'Veteran-friendly travel, lodging, and Space-A coordination resources.',
   'plane',
   12,
   true)
ON CONFLICT (slug) DO NOTHING;
