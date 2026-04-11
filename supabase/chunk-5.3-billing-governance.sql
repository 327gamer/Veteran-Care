-- Chunk 5.3: Controlled Billing Launch + Payment Governance

-- STEP 1: billing_config table (runtime config, no redeploy needed)
CREATE TABLE IF NOT EXISTS billing_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO billing_config (key, value) VALUES
  ('billing_mode', 'manual_only'),
  ('allowed_categories_for_billing', ''),
  ('allowed_partners_for_billing', ''),
  ('allowed_states_for_billing', '')
ON CONFLICT (key) DO NOTHING;

-- STEP 5: Dispute + notes + retry fields on navigator_requests
ALTER TABLE navigator_requests
ADD COLUMN IF NOT EXISTS is_disputed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
ADD COLUMN IF NOT EXISTS billing_notes TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- STEP 6: billing_runs audit log
CREATE TABLE IF NOT EXISTS billing_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  executed_by TEXT,
  number_of_leads_charged INTEGER DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  mode TEXT DEFAULT 'manual',
  lead_ids TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_billing_runs_executed_at ON billing_runs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_nr_is_disputed ON navigator_requests(is_disputed) WHERE is_disputed = true;
