-- =============================================================
-- Supabase Security Remediation: Enable RLS on all public tables
-- Run this in the Supabase SQL Editor
-- =============================================================
-- Architecture: All server routes use supabaseAdmin (service_role)
-- for writes, which bypasses RLS. These policies provide
-- defense-in-depth and protect against direct client access.
-- =============================================================
-- VERIFIED TABLE INVENTORY (10 tables):
--   Public-read:   categories, resources, states
--   User-owned:    user_saved_resources
--   Server-only:   user_profiles, navigator_requests,
--                  partner_organizations, partner_routing_rules,
--                  resource_clicks
--   Legacy/unused: saved_resources (may not exist; handled defensively)
-- =============================================================

-- =====================
-- STEP 1: DROP ALL LEGACY PERMISSIVE POLICIES
-- Remove any pre-existing overly-permissive policies from
-- earlier SQL scripts before applying least-privilege policies.
-- =====================

DROP POLICY IF EXISTS "states_public_read" ON states;
DROP POLICY IF EXISTS "states_anon_write" ON states;

DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
DROP POLICY IF EXISTS "Server-side anon key access" ON user_profiles;

DROP POLICY IF EXISTS "Users can read own saved resources" ON user_saved_resources;
DROP POLICY IF EXISTS "Users can insert own saved resources" ON user_saved_resources;
DROP POLICY IF EXISTS "Users can delete own saved resources" ON user_saved_resources;

-- =====================
-- STEP 2: PUBLIC READ-ONLY TABLES
-- (categories, resources, states)
-- Anyone can SELECT; no INSERT/UPDATE/DELETE for anon
-- =====================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories
  FOR SELECT USING (true);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_resources" ON resources;
CREATE POLICY "public_read_resources" ON resources
  FOR SELECT USING (true);

ALTER TABLE states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_states" ON states;
CREATE POLICY "public_read_states" ON states
  FOR SELECT USING (true);

-- =====================
-- STEP 3: USER-OWNED TABLES
-- (user_saved_resources)
-- Authenticated users can read/write their own rows only.
-- Server saved-resources routes use supabaseForUser(token) so
-- these auth.uid() policies are actively enforced on every request.
-- =====================

ALTER TABLE user_saved_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_saved" ON user_saved_resources;
CREATE POLICY "users_select_own_saved" ON user_saved_resources
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_saved" ON user_saved_resources;
CREATE POLICY "users_insert_own_saved" ON user_saved_resources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_saved" ON user_saved_resources;
CREATE POLICY "users_delete_own_saved" ON user_saved_resources
  FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- STEP 4: LEGACY TABLE — saved_resources
-- This table does not exist in the current codebase.
-- Defensive block: if it exists in production, enable RLS
-- and add ownership policies to prevent anonymous access.
-- =====================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_resources') THEN
    EXECUTE 'ALTER TABLE saved_resources ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "users_select_own_saved_legacy" ON saved_resources';
    EXECUTE 'CREATE POLICY "users_select_own_saved_legacy" ON saved_resources FOR SELECT USING (auth.uid() = user_id)';

    EXECUTE 'DROP POLICY IF EXISTS "users_insert_own_saved_legacy" ON saved_resources';
    EXECUTE 'CREATE POLICY "users_insert_own_saved_legacy" ON saved_resources FOR INSERT WITH CHECK (auth.uid() = user_id)';

    EXECUTE 'DROP POLICY IF EXISTS "users_delete_own_saved_legacy" ON saved_resources';
    EXECUTE 'CREATE POLICY "users_delete_own_saved_legacy" ON saved_resources FOR DELETE USING (auth.uid() = user_id)';

    RAISE NOTICE 'saved_resources table found — RLS enabled with ownership policies';
  ELSE
    RAISE NOTICE 'saved_resources table does not exist — skipped (expected)';
  END IF;
END $$;

-- =====================
-- STEP 5: SERVER-SIDE ONLY TABLES
-- (user_profiles, navigator_requests, partner_organizations,
--  partner_routing_rules, resource_clicks)
-- RLS enabled with NO policies = all access denied except service_role.
-- All access goes through server routes using supabaseAdmin.
-- =====================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE navigator_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE partner_organizations ENABLE ROW LEVEL SECURITY;

ALTER TABLE partner_routing_rules ENABLE ROW LEVEL SECURITY;

ALTER TABLE resource_clicks ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- VERIFICATION MATRIX (run after applying this script):
--
-- Table                    | RLS  | Anon SELECT | Anon WRITE | Auth Own-Row | Service-Role
-- -------------------------|------|-------------|------------|--------------|-------------
-- categories               | ON   | ALLOW       | DENY       | n/a          | BYPASS
-- resources                | ON   | ALLOW       | DENY       | n/a          | BYPASS
-- states                   | ON   | ALLOW       | DENY       | n/a          | BYPASS
-- user_saved_resources     | ON   | DENY        | DENY       | ALLOW        | BYPASS
-- saved_resources (if any) | ON   | DENY        | DENY       | ALLOW        | BYPASS
-- user_profiles            | ON   | DENY        | DENY       | DENY         | BYPASS
-- navigator_requests       | ON   | DENY        | DENY       | DENY         | BYPASS
-- partner_organizations    | ON   | DENY        | DENY       | DENY         | BYPASS
-- partner_routing_rules    | ON   | DENY        | DENY       | DENY         | BYPASS
-- resource_clicks          | ON   | DENY        | DENY       | DENY         | BYPASS
--
-- Verification queries (run as anon role):
--   SELECT * FROM user_profiles LIMIT 1;       -- Expected: 0 rows (denied)
--   INSERT INTO states (code, name) VALUES ('XX','Test'); -- Expected: ERROR (denied)
--   SELECT * FROM user_saved_resources LIMIT 1; -- Expected: 0 rows (denied, no auth.uid())
--   SELECT * FROM categories LIMIT 1;           -- Expected: returns data (allowed)
--   SELECT * FROM resources LIMIT 1;            -- Expected: returns data (allowed)
-- =============================================================
