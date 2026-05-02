-- ─────────────────────────────────────────────────────────────────────────────
-- Test data archive — navigator_requests + elite_sponsor_waitlist
-- Date: 2026-05-02
-- Founder: Veteran Care
--
-- PURPOSE:
--   Quiet down obvious QA / smoke-test rows in the live admin views without
--   destroying audit history. Strategy:
--     - navigator_requests test rows  → set status='resolved' + admin_notes flag
--                                        (preserves them for forensic review)
--     - elite_sponsor_waitlist smoke  → DELETE (zero audit value, pure QA noise)
--
-- THIS FILE IS COMMENTED-OUT BY DEFAULT. Run sections 0-2 (PREVIEW) first,
-- then uncomment the destructive block when you're satisfied.
--
-- USAGE:
--   1. Run PREVIEW queries — confirm the exact rows you'll touch
--   2. Uncomment the BEGIN/COMMIT block
--   3. Run the VERIFY queries afterwards
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── PREVIEW 0: total counts before any change ─────────────────────────────
SELECT 'navigator_requests' AS tbl, COUNT(*)::int AS rows FROM navigator_requests
UNION ALL
SELECT 'navigator_requests (status=new)', COUNT(*)::int
  FROM navigator_requests WHERE status = 'new'
UNION ALL
SELECT 'elite_sponsor_waitlist', COUNT(*)::int FROM elite_sponsor_waitlist;

-- ─── PREVIEW 1: navigator_requests rows that LOOK like tests ───────────────
-- 25 rows expected (per 2026-05-02 audit).  Review each row before archiving.
SELECT
  id,
  veteran_name,
  veteran_email,
  status,
  category,
  source,
  created_at
FROM navigator_requests
WHERE
  -- Obvious "test" naming
  veteran_name ILIKE '%test%'
  OR veteran_name ILIKE 'gate test%'
  OR veteran_name ILIKE 'smoke test%'
  -- Test email domains
  OR veteran_email ILIKE '%@test.%'
  OR veteran_email ILIKE '%@example.%'
  OR veteran_email ILIKE 'founder-test%'
  OR veteran_email ILIKE 'gate-test%'
  -- Founder personal email used during QA cycles
  OR veteran_email ILIKE 'colinmslaven@%'
  OR veteran_email ILIKE 'colin@veterancare.com'
ORDER BY created_at DESC;

-- ─── PREVIEW 2: elite_sponsor_waitlist smoke-test row ──────────────────────
-- 1 row expected: "Smoke Co" / smoke+ecss@test.local
SELECT
  id,
  contact_company,
  contact_name,
  contact_email,
  state_code,
  category_slug,
  subcategory_slug,
  created_at
FROM elite_sponsor_waitlist
WHERE
  contact_email ILIKE '%@test.%'
  OR contact_email ILIKE '%@example.%'
  OR contact_company ILIKE '%smoke%'
  OR contact_name ILIKE '%smoke%'
  OR contact_name ILIKE '%test%'
ORDER BY created_at DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- DESTRUCTIVE BLOCK — UNCOMMENT BEGIN..COMMIT WHEN READY
-- ═══════════════════════════════════════════════════════════════════════════

-- BEGIN;
--
-- -- a. Archive obvious test navigator_requests:
-- --    set status='resolved' + admin_notes flag.  Preserves audit row.
-- --    (Does NOT touch routing, billing, Stripe, or partner data.)
-- UPDATE navigator_requests
-- SET
--   status = 'resolved',
--   admin_notes = COALESCE(admin_notes, '') ||
--     E'\n[2026-05-02 QA archive] Auto-archived as test data ' ||
--     '(matched test-naming pattern). Preserved for audit; not deleted.'
-- WHERE
--   status != 'resolved'
--   AND (
--     veteran_name ILIKE '%test%'
--     OR veteran_name ILIKE 'gate test%'
--     OR veteran_name ILIKE 'smoke test%'
--     OR veteran_email ILIKE '%@test.%'
--     OR veteran_email ILIKE '%@example.%'
--     OR veteran_email ILIKE 'founder-test%'
--     OR veteran_email ILIKE 'gate-test%'
--     OR veteran_email ILIKE 'colinmslaven@%'
--     OR veteran_email ILIKE 'colin@veterancare.com'
--   );
--
-- -- b. Delete the smoke-test waitlist row.
-- --    Pure QA noise (smoke+ecss@test.local), zero audit value.
-- --    Safe — no FK references to elite_sponsor_waitlist anywhere.
-- DELETE FROM elite_sponsor_waitlist
-- WHERE
--   contact_email ILIKE '%@test.%'
--   OR contact_email ILIKE '%@example.%'
--   OR (contact_company ILIKE '%smoke%' AND contact_name ILIKE '%smoke%');
--
-- COMMIT;

-- ─── VERIFY (run AFTER COMMIT) ──────────────────────────────────────────────

-- Should return 0 rows
SELECT COUNT(*)::int AS still_active_test_leads
FROM navigator_requests
WHERE status != 'resolved'
  AND (
    veteran_name ILIKE '%test%'
    OR veteran_email ILIKE '%@test.%'
    OR veteran_email ILIKE '%@example.%'
    OR veteran_email ILIKE 'colinmslaven@%'
  );

-- Should return 0 rows
SELECT COUNT(*)::int AS smoke_waitlist_remaining
FROM elite_sponsor_waitlist
WHERE contact_email ILIKE '%@test.%'
   OR contact_email ILIKE '%@example.%';

-- Status breakdown — expect ~31 'new' to drop to ~6, 'resolved' to grow by ~25
SELECT status, COUNT(*)::int AS cnt
FROM navigator_requests
GROUP BY status
ORDER BY cnt DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- WHAT THIS FILE DOES NOT TOUCH
-- ═══════════════════════════════════════════════════════════════════════════
--   - elite_sponsor_slots   (handled by 20260502_test_slot_reset.sql)
--   - elite_sponsor_leads   (handled by 20260502_test_slot_reset.sql)
--   - partner_organizations (no test rows found in 2026-05-02 audit)
--   - partner_routing_rules (separate audit; routing logic forbidden)
--   - trusted_services      (zero test rows)
--   - trusted_service_leads (table is empty)
--   - resources / resource_clicks / page_views (analytics — leave alone)
--   - billing_runs / ai_usage_log / attribution (audit data — leave alone)
-- ═══════════════════════════════════════════════════════════════════════════
