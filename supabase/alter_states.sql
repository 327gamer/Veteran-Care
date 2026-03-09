-- ============================================================
-- STATES TABLE: Add missing columns
-- Run this in Supabase SQL Editor if the states table was
-- created with a simplified schema (code, name, active, created_at)
-- Safe to re-run: uses IF NOT EXISTS throughout
-- ============================================================

ALTER TABLE states ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE states ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE states ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE states ADD COLUMN IF NOT EXISTS launch_date DATE;
ALTER TABLE states ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';
ALTER TABLE states ADD COLUMN IF NOT EXISTS admin_contact_name TEXT;
ALTER TABLE states ADD COLUMN IF NOT EXISTS admin_contact_email TEXT;
ALTER TABLE states ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';
ALTER TABLE states ADD COLUMN IF NOT EXISTS resource_count INTEGER DEFAULT 0;
ALTER TABLE states ADD COLUMN IF NOT EXISTS partner_count INTEGER DEFAULT 0;

-- Migrate 'active' column to 'is_active' if active exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'states' AND column_name = 'active'
  ) THEN
    UPDATE states SET is_active = active WHERE is_active IS DISTINCT FROM active;
  END IF;
END $$;

-- Set SC as template
UPDATE states SET is_template = true, admin_contact_name = 'Colin Slaven', admin_contact_email = 'Colin@VeteranCare.com', config = '{"pilot_categories": ["housing"], "launched": true}' WHERE code = 'SC';

-- Make id the primary key if code was the PK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'states' AND constraint_type = 'PRIMARY KEY'
    AND constraint_name LIKE '%id%'
  ) THEN
    -- Ensure all rows have an id
    UPDATE states SET id = gen_random_uuid() WHERE id IS NULL;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_states_code ON states(code);
CREATE INDEX IF NOT EXISTS idx_states_active ON states(is_active) WHERE is_active = true;

-- Ensure UNIQUE constraint on code
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'states' AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%code%'
  ) THEN
    ALTER TABLE states ADD CONSTRAINT states_code_unique UNIQUE (code);
  END IF;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- RLS policies (anon read/write; admin access enforced by Express x-admin-key middleware)
ALTER TABLE states ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'states' AND policyname = 'states_public_read'
  ) THEN
    CREATE POLICY "states_public_read"
      ON states FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'states' AND policyname = 'states_anon_write'
  ) THEN
    CREATE POLICY "states_anon_write"
      ON states FOR ALL
      TO anon, authenticated, service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
