-- ─────────────────────────────────────────────────────────────────────────────
-- Test data cleanup for Phase 5 Stripe + Elite Partner auto-flow validation
-- Date: 2026-04-30
-- Founder: Veteran Care
--
-- CONTEXT:
-- After verifying the new Elite Partner auto-checkout flow with one clean live
-- test, run this script to wipe all [TEST] artifacts left over from the
-- pre-launch validation cycle. This is INTENTIONALLY commented out — review
-- each block, uncomment only what you want to remove, then run.
--
-- IMPORTANT — Stripe-side cleanup is SEPARATE and must be done in the Stripe
-- Dashboard manually (or via API). See the checklist at the bottom of this file.
-- This script ONLY touches Supabase rows.
--
-- USAGE (when ready):
--   1. Read each section, uncomment the DELETE/UPDATE you want
--   2. Run via Supabase SQL editor (not via Drizzle, not via db:push)
--   3. Verify with the SELECT statements below before committing
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. PREVIEW: list every [TEST] row before deleting ──────────────────────
-- Run this FIRST to see what would be removed. Should match founder expectation.

SELECT
  id,
  company_name,
  email,
  status,
  category_id,
  requested_addons,
  stripe_customer_id,
  stripe_subscription_id,
  created_at
FROM partner_applications
WHERE
  company_name ILIKE '%[TEST]%'
  OR company_name ILIKE 'test%'
  OR email ILIKE '%@test.%'
  OR email = 'founder-test@veterancare.com'
ORDER BY created_at DESC;

-- ─── 2. PREVIEW: SC test Elite slot + any other test slots ─────────────────

SELECT
  id,
  state,
  category_slug,
  subcategory_slug,
  status,
  brand_name,
  sponsor_partner_application_id,
  stripe_subscription_id,
  created_at
FROM elite_sponsor_slots
WHERE
  brand_name ILIKE '%[TEST]%'
  OR brand_name ILIKE 'test%'
  OR (state = 'SC' AND status != 'sold')
  OR id = 'ca6ca3ee-...'  -- replace with full UUID of the SC test slot
ORDER BY created_at DESC;

-- ─── 3. PREVIEW: any partner_organizations created from test applications ──

SELECT
  po.id,
  po.email,
  po.onboarding_status,
  po.subscription_active,
  po.created_at
FROM partner_organizations po
WHERE
  po.email ILIKE '%@test.%'
  OR po.email = 'founder-test@veterancare.com'
ORDER BY po.created_at DESC;

-- ─── 4. PREVIEW: trusted_services rows provisioned from test partner apps ──

SELECT
  ts.id,
  ts.name,
  ts.is_active,
  ts.created_at
FROM trusted_services ts
WHERE
  ts.name ILIKE '%[TEST]%'
  OR ts.name ILIKE 'test%'
ORDER BY ts.created_at DESC;

-- ═════════════════════════════════════════════════════════════════════════════
-- DESTRUCTIVE BLOCKS BELOW — UNCOMMENT ONLY AFTER REVIEWING ABOVE PREVIEWS
-- ═════════════════════════════════════════════════════════════════════════════

-- ─── A. Revert SC test Elite slot back to vacant ───────────────────────────
-- (Replace 'ca6ca3ee-...' with the actual full UUID from the preview above.)
-- This frees the slot for real sponsors and disconnects the test subscription.
--
-- UPDATE elite_sponsor_slots
-- SET
--   status = 'vacant',
--   sponsor_partner_application_id = NULL,
--   stripe_subscription_id = NULL,
--   stripe_customer_id = NULL,
--   brand_name = NULL,
--   brand_logo_url = NULL,
--   brand_phone = NULL,
--   brand_website_url = NULL,
--   sold_at = NULL,
--   activated_at = NULL
-- WHERE id = 'ca6ca3ee-REPLACE-WITH-FULL-UUID';

-- ─── B. Delete trusted_services rows provisioned from test partners ────────
-- DO THIS BEFORE deleting partner_applications (FK reference).
--
-- DELETE FROM trusted_services
-- WHERE name ILIKE '%[TEST]%' OR name ILIKE 'test%';

-- ─── C. Delete partner_organizations created from test applications ────────
--
-- DELETE FROM partner_organizations
-- WHERE email ILIKE '%@test.%'
--    OR email = 'founder-test@veterancare.com';

-- ─── D. Delete the test partner_applications themselves ────────────────────
--
-- DELETE FROM partner_applications
-- WHERE company_name ILIKE '%[TEST]%'
--    OR company_name ILIKE 'test%'
--    OR email ILIKE '%@test.%'
--    OR email = 'founder-test@veterancare.com';

-- ─── E. Verify cleanup ─────────────────────────────────────────────────────
-- After uncommenting + running the above, re-run section 1-4 previews to
-- confirm zero rows remain.

-- ═════════════════════════════════════════════════════════════════════════════
-- STRIPE-SIDE CLEANUP CHECKLIST (manual — do this in Stripe Dashboard)
-- ═════════════════════════════════════════════════════════════════════════════
--
-- 1. Cancel test subscriptions:
--    - sub_1TRxMC...  (Section A standalone $1 test subscription)
--    - Any other sub_* tied to [TEST] customers from this validation cycle
--    Stripe Dashboard → Subscriptions → search by customer email → Cancel
--
-- 2. Delete test customers (only AFTER subscriptions are cancelled):
--    - cus_UQp0drxEr76is6 (Section A founder test customer)
--    - cus_UQp8Y7... (Section B test customer that never paid)
--    - cus_UQp1Gh... (any other test customer from this cycle)
--    Stripe Dashboard → Customers → search → Actions → Delete
--
-- 3. (Optional) Archive the VC100 promo code if it was a one-time founder pass.
--    Keep VC10/VC20/VC50 active for real sales.
--    Stripe Dashboard → Products → Coupons / Promotion Codes
--
-- 4. Verify webhook endpoint is still healthy:
--    https://veterancare.com/api/stripe/webhook
--    Stripe Dashboard → Developers → Webhooks → check pending_webhooks = 0
-- ═════════════════════════════════════════════════════════════════════════════
