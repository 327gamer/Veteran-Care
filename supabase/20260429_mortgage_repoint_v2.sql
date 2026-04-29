-- Repoint USAA / Veterans United / Navy Federal Mortgage from housing-home
-- (with deprecated va-home-loans + home-ownership subs) to financial-credit
-- (canonical va-loans sub) with cross-listing back to housing-home so the
-- partner still surfaces under the housing tab.
--
-- Idempotent: re-runnable; uses CASE-based diffing so any partial state
-- converges to the target.
--
-- Founder MASTER LAW: SQL migrations only; never db:push.

BEGIN;

-- 1) Flip primary category_id to financial-credit for the 3 mortgage partners.
UPDATE trusted_services ts
SET category_id = (SELECT id FROM trusted_service_categories WHERE slug = 'financial-credit')
WHERE ts.name IN (
  'USAA Mortgage',
  'Veterans United Home Loans',
  'Navy Federal Credit Union — Mortgage'
)
  AND ts.category_id IS DISTINCT FROM (SELECT id FROM trusted_service_categories WHERE slug = 'financial-credit');

-- 2) Replace subcategory_slugs with the canonical ['va-loans'] (drops the
--    deprecated va-home-loans / home-ownership / financial-credit-mortgage
--    if any of those were ever attached). Idempotent.
UPDATE trusted_services
SET subcategory_slugs = ARRAY['va-loans']
WHERE name IN (
  'USAA Mortgage',
  'Veterans United Home Loans',
  'Navy Federal Credit Union — Mortgage'
)
  AND COALESCE(subcategory_slugs, '{}'::text[]) IS DISTINCT FROM ARRAY['va-loans'];

-- 3) Add housing-home to cross_list_category_slugs (array-union, keeps any
--    other cross-lists already present).
UPDATE trusted_services
SET cross_list_category_slugs = (
  SELECT ARRAY(
    SELECT DISTINCT unnest(
      COALESCE(cross_list_category_slugs, '{}'::text[]) || ARRAY['housing-home']::text[]
    )
  )
)
WHERE name IN (
  'USAA Mortgage',
  'Veterans United Home Loans',
  'Navy Federal Credit Union — Mortgage'
)
  AND NOT (COALESCE(cross_list_category_slugs, '{}'::text[]) @> ARRAY['housing-home']::text[]);

-- 4) Audit: report final state of these 3 rows.
SELECT
  ts.name,
  tsc.slug AS category_slug,
  ts.subcategory_slugs,
  ts.cross_list_category_slugs
FROM trusted_services ts
LEFT JOIN trusted_service_categories tsc ON ts.category_id = tsc.id
WHERE ts.name IN (
  'USAA Mortgage',
  'Veterans United Home Loans',
  'Navy Federal Credit Union — Mortgage'
)
ORDER BY ts.name;

COMMIT;
