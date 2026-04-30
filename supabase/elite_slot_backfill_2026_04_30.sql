-- ============================================================================
-- Elite Sponsor Slot Matrix — Option A backfill (2026-04-30)
-- ============================================================================
-- Founder QA item #5 (priority list 2026-04-30): the Elite Partner application
-- form lets partners pick (state, category, subcategory) but slot inventory only
-- existed for 31 rows across 4 (cat, sub, state) combos in 11 states. Any other
-- partner selection silently fails because no vacant slot is available.
--
-- This migration backfills VACANT inventory across the full sellable matrix:
--   * 9 monetized categories (matches ECSS_CATEGORIES in server/elite-sponsor.ts;
--     EXCLUDES mortgage-lending + real-estate which are not in
--     trusted_service_categories — those stay out of inventory).
--   * 76 active subcategories (matches partner_subcategories.is_active = true,
--     joined to monetized parent categories — single source of truth).
--   * 51 states (50 + DC).
--
-- Total target inventory: 76 × 51 = 3,876 subcategory-level slots.
-- (Legacy 10 state-level NULL-subcategory slots under legal-services are LEFT
--  UNTOUCHED — they're a separate "Top Sponsor" product tier not currently
--  surfaced by the application form.)
--
-- Safety guarantees (founder MASTER LAW compliance):
--   * INSERT only — sold/active slots are NEVER overwritten thanks to the
--     partial unique indexes elite_sponsor_slots_top_uq + elite_sponsor_slots_sub_uq
--     (created in supabase/create_elite_sponsor_slots.sql:243-250).
--   * ON CONFLICT DO NOTHING — fully idempotent; re-running is a no-op.
--   * No schema changes; no Drizzle/db:push involvement.
--   * Default monthly_price_cents = 49900 ($499 floor) and lead_price_cents =
--     4999 ($49.99 founder-locked). Admin can promote individual slots to
--     Tier 1/2 ($899/$699) per business judgment without re-running this file.
--   * status = 'vacant', billing_status = 'unpaid', creative_approval_status
--     = 'pending' — matches the Phase A+B defaults.
--
-- Pre-cleanup: 10 vacant slots under (financial-credit, 'mortgages') are
--   ORPHANED — the canonical subcategory slug is 'va-loans' (per
--   shared/fin-subcategories.ts L33-39 + the 2026-04-30 routes.ts L1613 fix).
--   The form will never sell these. They are deleted up-front. None are sold.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Step 0: Delete 10 orphan vacant 'mortgages' slots (dead inventory)
-- ----------------------------------------------------------------------------
-- Defensive guard: only delete if NOT sold AND NOT linked to any sponsor.
DELETE FROM elite_sponsor_slots
WHERE category_slug = 'financial-credit'
  AND subcategory_slug = 'mortgages'
  AND status = 'vacant'
  AND sponsor_partner_application_id IS NULL
  AND sponsor_partner_organization_id IS NULL
  AND stripe_subscription_id IS NULL;

-- ----------------------------------------------------------------------------
-- Step 1: Backfill the (category, subcategory, state) matrix as vacant
-- ----------------------------------------------------------------------------
WITH states(state_code) AS (
  VALUES
    ('AL'),('AK'),('AZ'),('AR'),('CA'),('CO'),('CT'),('DE'),('FL'),('GA'),
    ('HI'),('ID'),('IL'),('IN'),('IA'),('KS'),('KY'),('LA'),('ME'),('MD'),
    ('MA'),('MI'),('MN'),('MS'),('MO'),('MT'),('NE'),('NV'),('NH'),('NJ'),
    ('NM'),('NY'),('NC'),('ND'),('OH'),('OK'),('OR'),('PA'),('RI'),('SC'),
    ('SD'),('TN'),('TX'),('UT'),('VT'),('VA'),('WA'),('WV'),('WI'),('WY'),
    ('DC')
),
matrix(category_slug, subcategory_slug) AS (
  VALUES
    -- auto-services (3)
    ('auto-services','auto-repair'),
    ('auto-services','auto-sales'),
    ('auto-services','roadside-assistance'),

    -- education-training (12)
    ('education-training','certifications-licensing'),
    ('education-training','college-university'),
    ('education-training','continuing-education'),
    ('education-training','education-counseling'),
    ('education-training','gi-bill-assistance'),
    ('education-training','job-placement-programs'),
    ('education-training','online-learning'),
    ('education-training','resume-career-coaching'),
    ('education-training','technical-colleges'),
    ('education-training','trade-schools'),
    ('education-training','tuition-assistance'),
    ('education-training','veteran-student-services'),

    -- employment-support (8)
    ('employment-support','apprenticeships-skilled-trades'),
    ('employment-support','dvop-workforce-programs'),
    ('employment-support','entrepreneurship-small-business-support'),
    ('employment-support','federal-employment'),
    ('employment-support','job-placement-programs'),
    ('employment-support','resume-career-coaching'),
    ('employment-support','veteran-friendly-employers'),
    ('employment-support','vocational-rehabilitation'),

    -- end-of-life-services (4)
    ('end-of-life-services','funeral-burial'),
    ('end-of-life-services','grief-bereavement'),
    ('end-of-life-services','hospice-palliative'),
    ('end-of-life-services','survivor-benefits-eol'),

    -- financial-credit (16) -- canonical va-loans, NOT 'mortgages'
    ('financial-credit','banking-lending-support'),
    ('financial-credit','benefits-counseling'),
    ('financial-credit','budgeting-financial-coaching'),
    ('financial-credit','credit-repair'),
    ('financial-credit','debt-management'),
    ('financial-credit','emergency-financial-assistance'),
    ('financial-credit','financial-planning'),
    ('financial-credit','first-time-buyers'),
    ('financial-credit','nonprofit-financial-support'),
    ('financial-credit','pension-assistance'),
    ('financial-credit','personal-loans'),
    ('financial-credit','refinancing'),
    ('financial-credit','tax-preparation'),
    ('financial-credit','utility-bill-assistance'),
    ('financial-credit','va-loans'),
    ('financial-credit','veteran-relief-funds'),

    -- housing-home (8)
    ('housing-home','accessibility-modifications'),
    ('housing-home','emergency-housing'),
    ('housing-home','foreclosure-prevention'),
    ('housing-home','home-ownership'),
    ('housing-home','homeless-veteran-services'),
    ('housing-home','moving-relocation'),
    ('housing-home','rental-assistance'),
    ('housing-home','transitional-housing'),

    -- insurance (10)
    ('insurance','auto-insurance'),
    ('insurance','burial-final-expense'),
    ('insurance','disability-insurance'),
    ('insurance','health-insurance'),
    ('insurance','home-insurance'),
    ('insurance','life-insurance'),
    ('insurance','long-term-care-insurance'),
    ('insurance','medicare-va-plans'),
    ('insurance','renters-insurance'),
    ('insurance','supplemental-insurance'),

    -- legal-services (11)
    ('legal-services','criminal-defense'),
    ('legal-services','disability-claims-assistance'),
    ('legal-services','discharge-upgrade-assistance'),
    ('legal-services','employment-law'),
    ('legal-services','family-law'),
    ('legal-services','landlord-tenant-issues'),
    ('legal-services','legal-aid-services'),
    ('legal-services','military-records-assistance'),
    ('legal-services','pro-bono-legal-services'),
    ('legal-services','va-benefits-appeals'),
    ('legal-services','veterans-legal-clinics'),

    -- travel-services (4)
    ('travel-services','airlines-transportation'),
    ('travel-services','hotels-lodging'),
    ('travel-services','retreats-wellness'),
    ('travel-services','vacation-recreation')
)
INSERT INTO elite_sponsor_slots (
  category_slug,
  subcategory_slug,
  state_code,
  status,
  monthly_price_cents,
  lead_price_cents,
  billing_status,
  creative_approval_status,
  notes_internal
)
SELECT
  m.category_slug,
  m.subcategory_slug,
  s.state_code,
  'vacant',
  49900,
  4999,
  'unpaid',
  'pending',
  'matrix backfill 2026-04-30 (Option A)'
FROM matrix m
CROSS JOIN states s
ON CONFLICT (category_slug, subcategory_slug, state_code)
  WHERE subcategory_slug IS NOT NULL
  DO NOTHING;

-- Note: the partial unique index elite_sponsor_slots_sub_uq covers
-- (category_slug, subcategory_slug, state_code) WHERE subcategory_slug IS NOT NULL.
-- All inserts above have subcategory_slug NOT NULL, so the inferred conflict
-- target above (column list + matching predicate) resolves to that partial
-- index — this is the only Postgres-supported way to ON CONFLICT against a
-- partial unique index (named-constraint form is rejected by the planner
-- because partial unique indexes are not table constraints).

COMMIT;

-- ============================================================================
-- POST-MIGRATION AUDIT (run separately to verify)
-- ============================================================================
-- Expected after this file runs once:
--   * Total rows = 76 active subs × 51 states + legacy 10 NULL-subcategory legal slots
--                + 1 pre-existing va-loans-TX 'sold' = 3,887
--   * Sold slots untouched.
--   * 0 rows under (financial-credit, 'mortgages').
--
-- Verification queries:
--   SELECT category_slug, COUNT(*), COUNT(*) FILTER (WHERE status='sold') AS sold
--     FROM elite_sponsor_slots GROUP BY category_slug ORDER BY category_slug;
--
--   SELECT COUNT(*) FROM elite_sponsor_slots
--     WHERE category_slug='financial-credit' AND subcategory_slug='mortgages';
--   -- Expected: 0
-- ============================================================================
