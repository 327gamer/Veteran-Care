-- ============================================================
-- STATES MANAGEMENT TABLE
-- Run this in Supabase SQL Editor (one-time setup)
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT throughout
-- Security: RLS allows anon read/write (consistent with other tables);
--           actual admin access is enforced by Express x-admin-key middleware
-- ============================================================

CREATE TABLE IF NOT EXISTS states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_template BOOLEAN NOT NULL DEFAULT false,
  launch_date DATE,
  timezone TEXT DEFAULT 'America/New_York',
  admin_contact_name TEXT,
  admin_contact_email TEXT,
  config JSONB DEFAULT '{}',
  resource_count INTEGER DEFAULT 0,
  partner_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_states_code ON states(code);
CREATE INDEX IF NOT EXISTS idx_states_active ON states(is_active) WHERE is_active = true;

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

-- Seed South Carolina as the first template state
INSERT INTO states (code, name, is_active, is_template, timezone, admin_contact_name, admin_contact_email, config)
VALUES (
  'SC',
  'South Carolina',
  true,
  true,
  'America/New_York',
  'Colin Slaven',
  'Colin@VeteranCare.com',
  '{"pilot_categories": ["housing"], "launched": true}'
)
ON CONFLICT (code) DO NOTHING;
