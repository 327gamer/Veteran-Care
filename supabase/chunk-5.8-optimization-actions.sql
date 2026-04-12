-- Chunk 5.8: Launch Optimization Decision Layer

-- STEP 1: partner_status_override on partner_organizations
ALTER TABLE partner_organizations
ADD COLUMN IF NOT EXISTS partner_status_override TEXT DEFAULT 'active';

-- STEP 2: category_action_flag on billing_config (reuse key-value table)
-- We store category flags as: category_flag:<slug> = normal|expand|review|deprioritize
-- No new table needed — uses billing_config

-- STEP 3: optimization_actions_log audit table
CREATE TABLE IF NOT EXISTS optimization_actions_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  admin_user TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opt_actions_created ON optimization_actions_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opt_actions_entity ON optimization_actions_log(entity_id);
