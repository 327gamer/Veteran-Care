-- =====================================================
-- CHUNK 5.1: STRIPE PAYMENT CAPTURE — AUDIT FIELDS
-- Run in Supabase SQL Editor
-- =====================================================

ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS stripe_payment_status TEXT;

CREATE INDEX IF NOT EXISTS idx_nav_req_stripe_pi ON navigator_requests(stripe_payment_intent_id);

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'navigator_requests'
  AND column_name IN ('stripe_payment_intent_id', 'stripe_checkout_session_id', 'stripe_payment_status');

-- =====================================================
-- END CHUNK 5.1 MIGRATION
-- =====================================================
