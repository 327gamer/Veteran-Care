-- Step 6.7: Batch Performance Tracking Columns
-- Run this in Supabase SQL Editor

-- Add batch-specific metrics columns to billing_runs
ALTER TABLE billing_runs ADD COLUMN IF NOT EXISTS batch_id TEXT;
ALTER TABLE billing_runs ADD COLUMN IF NOT EXISTS batch_size INTEGER;
ALTER TABLE billing_runs ADD COLUMN IF NOT EXISTS attempted_count INTEGER;
ALTER TABLE billing_runs ADD COLUMN IF NOT EXISTS success_count INTEGER;
ALTER TABLE billing_runs ADD COLUMN IF NOT EXISTS failure_count INTEGER;
ALTER TABLE billing_runs ADD COLUMN IF NOT EXISTS total_amount_attempted NUMERIC(10,2);
ALTER TABLE billing_runs ADD COLUMN IF NOT EXISTS total_amount_successful NUMERIC(10,2);
ALTER TABLE billing_runs ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER;

-- Index for batch-mode queries
CREATE INDEX IF NOT EXISTS idx_billing_runs_mode ON billing_runs(mode);
CREATE INDEX IF NOT EXISTS idx_billing_runs_batch_id ON billing_runs(batch_id);
