-- =====================================================
-- CHUNK 4.5: POST-LAUNCH VALIDATION + INTELLIGENCE LAYER
-- Read-only Supabase SQL queries — copy/paste ready
-- No system behavior changes. Visibility only.
-- =====================================================


-- =====================================================
-- 1) FULL LEAD LIFECYCLE VIEW
-- =====================================================

SELECT
  id,
  veteran_name,
  category,
  subcategory,
  user_state,
  user_city,
  created_at,
  assigned_at,
  email_sent,
  email_sent_at,
  response_status,
  response_at,
  reassignment_count,
  routed_to_partner_id,
  delivery_status,
  escalation_count,
  last_reassigned_at,
  previous_assigned_to,
  last_action_source,
  status,
  source
FROM navigator_requests
ORDER BY created_at DESC
LIMIT 100;


-- =====================================================
-- 2) RESPONSE TIME (per lead, in hours)
-- =====================================================

SELECT
  id,
  veteran_name,
  category,
  routed_to_partner_id,
  assigned_at,
  response_at,
  response_status,
  CASE
    WHEN response_at IS NOT NULL AND assigned_at IS NOT NULL
    THEN ROUND(EXTRACT(EPOCH FROM (response_at - assigned_at)) / 3600.0, 1)
    ELSE NULL
  END AS response_time_hours
FROM navigator_requests
WHERE routed_to_partner_id IS NOT NULL
  AND response_at IS NOT NULL
ORDER BY response_time_hours ASC;


-- =====================================================
-- 3A) TOTAL LEADS BY DATE (last 30 days)
-- =====================================================

SELECT
  DATE(created_at) AS lead_date,
  COUNT(*) AS lead_count
FROM navigator_requests
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY lead_date DESC;


-- =====================================================
-- 3B) LEADS BY CATEGORY
-- =====================================================

SELECT
  COALESCE(category, 'uncategorized') AS category,
  COUNT(*) AS lead_count,
  COUNT(*) FILTER (WHERE routed_to_partner_id IS NOT NULL) AS routed,
  COUNT(*) FILTER (WHERE routed_to_partner_id IS NULL) AS unrouted
FROM navigator_requests
GROUP BY COALESCE(category, 'uncategorized')
ORDER BY lead_count DESC;


-- =====================================================
-- 3C) LEADS BY CITY / STATE
-- =====================================================

SELECT
  COALESCE(user_state, 'unknown') AS state,
  COALESCE(user_city, 'unknown') AS city,
  COUNT(*) AS lead_count
FROM navigator_requests
GROUP BY COALESCE(user_state, 'unknown'), COALESCE(user_city, 'unknown')
ORDER BY lead_count DESC;


-- =====================================================
-- 3D) RESPONSE STATUS BREAKDOWN
-- =====================================================

SELECT
  COALESCE(response_status, 'null') AS response_status,
  COUNT(*) AS count,
  ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) AS pct
FROM navigator_requests
WHERE routed_to_partner_id IS NOT NULL
GROUP BY COALESCE(response_status, 'null')
ORDER BY count DESC;


-- =====================================================
-- 3E) AVERAGE + MEDIAN RESPONSE TIME (hours)
-- =====================================================

SELECT
  COUNT(*) FILTER (WHERE response_at IS NOT NULL AND assigned_at IS NOT NULL) AS responses_with_time,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (response_at - assigned_at)) / 3600.0)
    FILTER (WHERE response_at IS NOT NULL AND assigned_at IS NOT NULL),
    1
  ) AS avg_response_hours,
  ROUND(
    PERCENTILE_CONT(0.5) WITHIN GROUP (
      ORDER BY EXTRACT(EPOCH FROM (response_at - assigned_at)) / 3600.0
    ) FILTER (WHERE response_at IS NOT NULL AND assigned_at IS NOT NULL),
    1
  ) AS median_response_hours
FROM navigator_requests
WHERE routed_to_partner_id IS NOT NULL;


-- =====================================================
-- 3F) REASSIGNMENT FREQUENCY
-- =====================================================

SELECT
  reassignment_count,
  COUNT(*) AS lead_count
FROM navigator_requests
WHERE routed_to_partner_id IS NOT NULL
GROUP BY reassignment_count
ORDER BY reassignment_count;


-- =====================================================
-- 3G) % LEADS WITH NO RESPONSE AFTER 72 HOURS
-- =====================================================

SELECT
  COUNT(*) AS total_routed,
  COUNT(*) FILTER (
    WHERE response_status = 'pending'
      AND assigned_at IS NOT NULL
      AND NOW() - assigned_at > INTERVAL '72 hours'
  ) AS stale_no_response,
  ROUND(
    100.0 * COUNT(*) FILTER (
      WHERE response_status = 'pending'
        AND assigned_at IS NOT NULL
        AND NOW() - assigned_at > INTERVAL '72 hours'
    ) / NULLIF(COUNT(*), 0),
    1
  ) AS stale_pct
FROM navigator_requests
WHERE routed_to_partner_id IS NOT NULL
  AND delivery_status NOT IN ('fallback_manual');


-- =====================================================
-- 4A) FAILURE: DELIVERED BUT email_sent = false
-- =====================================================

SELECT id, veteran_name, category, delivery_status, email_sent, assigned_at
FROM navigator_requests
WHERE routed_to_partner_id IS NOT NULL
  AND delivery_status = 'delivered'
  AND email_sent = false;


-- =====================================================
-- 4B) FAILURE: ROUTED BUT assigned_at IS NULL
-- =====================================================

SELECT id, veteran_name, category, delivery_status, routed_at
FROM navigator_requests
WHERE routed_to_partner_id IS NOT NULL
  AND assigned_at IS NULL
  AND delivery_status NOT IN ('fallback_manual');


-- =====================================================
-- 4C) ALL ABNORMAL STATES (composite check)
-- =====================================================

SELECT id, veteran_name, category, delivery_status, response_status, email_sent, assigned_at,
  CASE
    WHEN delivery_status = 'delivered' AND email_sent = false THEN 'delivered_no_email'
    WHEN delivery_status = 'delivered' AND email_sent_at IS NULL THEN 'delivered_no_email_timestamp'
    WHEN assigned_at IS NULL AND delivery_status NOT IN ('fallback_manual', 'unrouted') THEN 'missing_assigned_at'
    WHEN response_status IS NULL AND delivery_status = 'delivered' THEN 'missing_response_status'
    WHEN delivery_status = 'delivery_failed' THEN 'delivery_failed'
  END AS issue_type
FROM navigator_requests
WHERE routed_to_partner_id IS NOT NULL
  AND (
    (delivery_status = 'delivered' AND email_sent = false)
    OR (delivery_status = 'delivered' AND email_sent_at IS NULL)
    OR (assigned_at IS NULL AND delivery_status NOT IN ('fallback_manual', 'unrouted'))
    OR (response_status IS NULL AND delivery_status = 'delivered')
    OR (delivery_status = 'delivery_failed')
  );


-- =====================================================
-- 5A) CATEGORY DEMAND — TOP CATEGORIES BY VOLUME
-- =====================================================

SELECT
  COALESCE(category, 'uncategorized') AS category,
  COUNT(*) AS total_leads,
  COUNT(*) FILTER (WHERE routed_to_partner_id IS NOT NULL) AS routed,
  COUNT(*) FILTER (WHERE delivery_status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE response_status IN ('accepted', 'completed')) AS converted
FROM navigator_requests
GROUP BY COALESCE(category, 'uncategorized')
ORDER BY total_leads DESC;


-- =====================================================
-- 5B) SUBCATEGORY USAGE
-- =====================================================

SELECT
  COALESCE(category, 'uncategorized') AS category,
  COALESCE(subcategory, '(none)') AS subcategory,
  COUNT(*) AS lead_count
FROM navigator_requests
WHERE subcategory IS NOT NULL
GROUP BY category, subcategory
ORDER BY lead_count DESC;


-- =====================================================
-- 6A) PARTNER ENGAGEMENT — LEADS PER PARTNER
-- =====================================================

SELECT
  po.name AS partner_name,
  nr.routed_to_partner_id,
  COUNT(*) AS total_leads,
  COUNT(*) FILTER (WHERE nr.delivery_status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE nr.delivery_status = 'delivery_failed') AS failed,
  COUNT(*) FILTER (WHERE nr.delivery_status = 'fallback_manual') AS manual_fallback
FROM navigator_requests nr
JOIN partner_organizations po ON po.id = nr.routed_to_partner_id
GROUP BY po.name, nr.routed_to_partner_id
ORDER BY total_leads DESC;


-- =====================================================
-- 6B) RESPONSE RATE PER PARTNER
-- =====================================================

SELECT
  po.name AS partner_name,
  COUNT(*) AS total_delivered,
  COUNT(*) FILTER (WHERE nr.response_status IN ('accepted', 'completed', 'declined', 'need_info')) AS responded,
  COUNT(*) FILTER (WHERE nr.response_status = 'pending') AS no_response,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE nr.response_status IN ('accepted', 'completed', 'declined', 'need_info'))
    / NULLIF(COUNT(*), 0),
    1
  ) AS response_rate_pct
FROM navigator_requests nr
JOIN partner_organizations po ON po.id = nr.routed_to_partner_id
WHERE nr.delivery_status = 'delivered'
GROUP BY po.name
ORDER BY response_rate_pct DESC;


-- =====================================================
-- 6C) AVG RESPONSE TIME PER PARTNER (hours)
-- =====================================================

SELECT
  po.name AS partner_name,
  COUNT(*) FILTER (WHERE nr.response_at IS NOT NULL) AS responses,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (nr.response_at - nr.assigned_at)) / 3600.0)
    FILTER (WHERE nr.response_at IS NOT NULL AND nr.assigned_at IS NOT NULL),
    1
  ) AS avg_response_hours
FROM navigator_requests nr
JOIN partner_organizations po ON po.id = nr.routed_to_partner_id
WHERE nr.delivery_status = 'delivered'
GROUP BY po.name
ORDER BY avg_response_hours ASC NULLS LAST;


-- =====================================================
-- END OF CHUNK 4.5 QUERY SET
-- =====================================================
