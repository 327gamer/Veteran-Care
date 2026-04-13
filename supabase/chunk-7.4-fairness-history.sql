-- Step 7.4: Fairness History / Trend Layer
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS rotation_fairness_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routing_scope_key TEXT NOT NULL,
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  total_rotated_leads INTEGER NOT NULL DEFAULT 0,
  partner_distribution_json JSONB,
  fairness_status TEXT,
  advisory_flag TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fairness_history_scope ON rotation_fairness_history(routing_scope_key);
CREATE INDEX IF NOT EXISTS idx_fairness_history_time ON rotation_fairness_history(snapshot_at DESC);
