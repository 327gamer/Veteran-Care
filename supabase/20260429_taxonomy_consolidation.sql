-- ============================================================================
-- 20260429_taxonomy_consolidation.sql
-- Founder-approved taxonomy alignment + consolidation.
--
-- REMAPPING ONLY — no DELETE statements, no DROPs.
-- Legacy partner_subcategories rows are deactivated (is_active=false), never
-- removed, so the audit trail is preserved.
-- Idempotent: re-runs are no-ops because every UPDATE is bounded by a
-- predicate that no longer matches after a successful first run.
--
-- Source of truth for the data shape: .local/reports/TAXONOMY_AUDIT.md
--
-- Helium portion (this file) targets DATABASE_URL.
-- Supabase elite_sponsor_slots updates are applied separately via the
-- Supabase REST API in the same migration window (see migration runner notes).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Activate canonical financial-credit subcategories that had been left
--    inactive but are now the consolidation target.
-- ----------------------------------------------------------------------------
UPDATE partner_subcategories ps
SET is_active = true
FROM trusted_service_categories c
WHERE ps.category_id = c.id
  AND c.slug = 'financial-credit'
  AND ps.slug IN ('mortgages', 'debt-management')
  AND ps.is_active = false;

-- ----------------------------------------------------------------------------
-- 2. Dedupe Freedom Debt Relief tag set:
--    {debt-relief, debt-management} -> {debt-management}
-- ----------------------------------------------------------------------------
UPDATE trusted_services
SET subcategory_slugs = ARRAY['debt-management']::text[]
WHERE id = '29999579-bb6c-4b5b-be46-2a729d27b5ca'
  AND 'debt-relief' = ANY(subcategory_slugs);

-- ----------------------------------------------------------------------------
-- 3. Move 3 housing-home VA mortgage partners to financial-credit.
--    Cross-list back to housing-home so they remain visible there.
--      - Navy Federal Credit Union — Mortgage
--      - USAA Mortgage
--      - Veterans United Home Loans
-- ----------------------------------------------------------------------------
UPDATE trusted_services
SET category_id = (SELECT id FROM trusted_service_categories WHERE slug = 'financial-credit'),
    subcategory_slugs = ARRAY['va-loans']::text[],
    cross_list_category_slugs = ARRAY['housing-home']::text[]
WHERE id IN (
  'a11f26d4-c546-4583-9bc2-67eea254c06c',  -- Navy Federal Credit Union — Mortgage
  '34b5ef03-de85-4cc0-9fcd-2cb9b16ee404',  -- USAA Mortgage
  '0cf4705d-59e5-4381-9ffd-a72a48ad9170'   -- Veterans United Home Loans
)
AND category_id <> (SELECT id FROM trusted_service_categories WHERE slug = 'financial-credit');

-- ----------------------------------------------------------------------------
-- 4. Deactivate legacy partner_subcategories rows (preserved, not deleted).
-- ----------------------------------------------------------------------------

-- 4a. Mortgage variants in financial-credit -> consolidated to 'mortgages'
UPDATE partner_subcategories ps
SET is_active = false
FROM trusted_service_categories c
WHERE ps.category_id = c.id
  AND c.slug = 'financial-credit'
  AND ps.slug IN ('mortgage-home-loans', 'mortgages-home-loans', 'home-loans')
  AND ps.is_active = true;

-- 4b. Debt variants in financial-credit -> consolidated to 'debt-management'
UPDATE partner_subcategories ps
SET is_active = false
FROM trusted_service_categories c
WHERE ps.category_id = c.id
  AND c.slug = 'financial-credit'
  AND ps.slug IN ('debt-consolidation', 'debt-counseling', 'debt-relief')
  AND ps.is_active = true;

-- 4c. Refinance synonym in financial-credit -> consolidated to 'refinancing'
UPDATE partner_subcategories ps
SET is_active = false
FROM trusted_service_categories c
WHERE ps.category_id = c.id
  AND c.slug = 'financial-credit'
  AND ps.slug = 'refinance'
  AND ps.is_active = true;

-- 4d. Auto-insurance dup in auto-services -> canonical lives in insurance
UPDATE partner_subcategories ps
SET is_active = false
FROM trusted_service_categories c
WHERE ps.category_id = c.id
  AND c.slug = 'auto-services'
  AND ps.slug = 'auto-insurance-svc'
  AND ps.is_active = true;

-- 4e. Estate-planning dup in end-of-life-services -> canonical lives in legal
UPDATE partner_subcategories ps
SET is_active = false
FROM trusted_service_categories c
WHERE ps.category_id = c.id
  AND c.slug = 'end-of-life-services'
  AND ps.slug = 'estate-planning-eol'
  AND ps.is_active = true;

-- 4f. Estate variants in legal-services -> consolidated to 'estate-planning'
UPDATE partner_subcategories ps
SET is_active = false
FROM trusted_service_categories c
WHERE ps.category_id = c.id
  AND c.slug = 'legal-services'
  AND ps.slug IN ('estate-planning-legal', 'wills-estate-planning')
  AND ps.is_active = true;

-- 4g. va-home-loans in housing-home -> moved to financial-credit:va-loans
UPDATE partner_subcategories ps
SET is_active = false
FROM trusted_service_categories c
WHERE ps.category_id = c.id
  AND c.slug = 'housing-home'
  AND ps.slug = 'va-home-loans'
  AND ps.is_active = true;

COMMIT;

-- ============================================================================
-- 5. Repair pre-existing broken subcategory references (services tagged with
--    slugs that have no active row in partner_subcategories). Activate where
--    a canonical row exists; otherwise create the missing canonical row.
--    No service tags are removed.
-- ============================================================================

BEGIN;

-- 5a. Activate canonical legal-services:va-claims (3 services already tagged)
UPDATE partner_subcategories ps
SET is_active = true
FROM trusted_service_categories c
WHERE ps.category_id = c.id
  AND c.slug = 'legal-services'
  AND ps.slug = 'va-claims'
  AND ps.is_active = false;

-- 5b. Create missing canonical subs in employment-support
INSERT INTO partner_subcategories (category_id, name, slug, display_order, is_active)
SELECT c.id, v.name, v.slug, v.display_order, true
FROM trusted_service_categories c,
     (VALUES
       ('Job Placement Programs',     'job-placement-programs',     50),
       ('Veteran-Friendly Employers', 'veteran-friendly-employers', 51),
       ('DVOP / Workforce Programs',  'dvop-workforce-programs',    52)
     ) AS v(name, slug, display_order)
WHERE c.slug = 'employment-support'
  AND NOT EXISTS (
    SELECT 1 FROM partner_subcategories ps
    WHERE ps.category_id = c.id AND ps.slug = v.slug
  );

-- 5c. Create missing canonical subs in education-training
INSERT INTO partner_subcategories (category_id, name, slug, display_order, is_active)
SELECT c.id, v.name, v.slug, v.display_order, true
FROM trusted_service_categories c,
     (VALUES
       ('Resume & Career Coaching', 'resume-career-coaching', 50),
       ('Job Placement Programs',   'job-placement-programs', 51)
     ) AS v(name, slug, display_order)
WHERE c.slug = 'education-training'
  AND NOT EXISTS (
    SELECT 1 FROM partner_subcategories ps
    WHERE ps.category_id = c.id AND ps.slug = v.slug
  );

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION (read-only, run separately):
--
-- 1. All trusted_services still have a valid category_id?
--      SELECT count(*) FROM trusted_services ts
--      LEFT JOIN trusted_service_categories c ON c.id = ts.category_id
--      WHERE c.id IS NULL;  -- expect 0
--
-- 2. Every subcategory slug on every trusted_services row resolves to an
--    active partner_subcategory in that service's category?
--      SELECT ts.id, ts.name, s
--      FROM trusted_services ts, unnest(ts.subcategory_slugs) AS s
--      WHERE NOT EXISTS (
--        SELECT 1 FROM partner_subcategories ps
--        WHERE ps.category_id = ts.category_id AND ps.slug = s AND ps.is_active = true
--      );  -- expect 0 rows
--
-- 3. No trusted_services left tagged with deactivated mortgage/debt/refinance
--    /va-home-loans/estate variants (they should have been remapped).
--
-- 4. elite_sponsor_slots only reference categories that exist in
--    trusted_service_categories (after Supabase REST patch).
-- ============================================================================
