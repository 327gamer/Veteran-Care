-- Step 7.13: Partner Activation Conversion Intelligence Layer
-- Run in Supabase SQL Editor

-- Recovery attribution columns
ALTER TABLE partner_organizations ADD COLUMN IF NOT EXISTS recovery_source TEXT;
ALTER TABLE partner_organizations ADD COLUMN IF NOT EXISTS recovery_timestamp TIMESTAMPTZ;

-- Verify
SELECT recovery_source, COUNT(*) FROM partner_organizations GROUP BY recovery_source;
