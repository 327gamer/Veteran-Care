-- Step 7.1: Partner Rotation / Fair Distribution
-- Run this in Supabase SQL Editor

-- 1. Rotation state table
CREATE TABLE IF NOT EXISTS partner_rotation_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routing_scope_key TEXT NOT NULL UNIQUE,
  last_assigned_partner_id UUID,
  last_assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rotation_scope ON partner_rotation_state(routing_scope_key);

-- 2. Add routing_method and routing_scope_key to navigator_requests
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS routing_method TEXT;
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS routing_scope_key TEXT;
