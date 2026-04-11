-- =====================================================
-- CHUNK 5.0: BILLING ENGINE — PHASE 1
-- Delivered Lead Billing (Internal Tracking Only)
-- Run in Supabase SQL Editor
-- =====================================================

-- Step 1: Add billing columns
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS is_billable BOOLEAN DEFAULT false;
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS billed BOOLEAN DEFAULT false;
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS billed_at TIMESTAMPTZ;
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS billing_amount DECIMAL(10,2) DEFAULT 49.99;
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'not_billable';

-- Step 2: Index for billing queries
CREATE INDEX IF NOT EXISTS idx_nav_req_billing_status ON navigator_requests(billing_status);
CREATE INDEX IF NOT EXISTS idx_nav_req_is_billable ON navigator_requests(is_billable);

-- Step 3: Backfill — mark existing delivered leads as billable
UPDATE navigator_requests
SET
  is_billable = true,
  billing_status = 'billable'
WHERE
  routed_to_partner_id IS NOT NULL
  AND email_sent = true
  AND email_sent_at IS NOT NULL
  AND is_billable = false;

-- Step 4: Ensure non-delivered leads are explicitly not_billable
UPDATE navigator_requests
SET billing_status = 'not_billable'
WHERE (
  routed_to_partner_id IS NULL
  OR email_sent = false
  OR email_sent_at IS NULL
)
AND billing_status IS NULL;

-- =====================================================
-- VERIFICATION QUERIES (run after migration)
-- =====================================================

-- Check billable count
SELECT billing_status, COUNT(*) FROM navigator_requests GROUP BY billing_status;

-- Verify no false positives
SELECT id, veteran_name, email_sent, email_sent_at, routed_to_partner_id, billing_status
FROM navigator_requests
WHERE is_billable = true AND (email_sent = false OR email_sent_at IS NULL OR routed_to_partner_id IS NULL);
-- Should return 0 rows

-- =====================================================
-- END CHUNK 5.0 MIGRATION
-- =====================================================
