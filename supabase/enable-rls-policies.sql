-- =============================================================
-- Supabase Security Remediation: Enable RLS on ALL public tables
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- =============================================================
-- Architecture: All server routes use supabaseAdmin (service_role)
-- for writes, which bypasses RLS. These policies provide
-- defense-in-depth and protect against direct client access.
-- =============================================================
-- VERIFIED TABLE INVENTORY (15 tables):
--   Public-read:   categories, resources, states,
--                  subcategories, resource_categories,
--                  resource_subcategories
--   User-owned:    user_saved_resources
--   Server-only:   user_profiles, navigator_requests,
--                  partner_organizations, partner_routing_rules,
--                  resource_clicks, ai_usage_log
--   Legacy/unused: saved_resources (defensive, may not exist)
--
-- NOTE: ambassadors, ambassador_links, commissions,
--       user_attribution_sessions, partner_attribution,
--       ambassador_payouts, trusted_services, trusted_service_leads,
--       trusted_service_categories, veteran_owned_businesses
--       are in a SEPARATE Neon/Replit Postgres database accessed
--       via pgQuery (DATABASE_URL). They are NOT exposed via
--       Supabase PostgREST/anon key and do NOT need Supabase RLS.
-- =============================================================

-- =====================
-- STEP 1: DROP ALL LEGACY PERMISSIVE POLICIES
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
-- (categories, resources, states, subcategories,
--  resource_categories, resource_subcategories)
-- Anyone can SELECT; no INSERT/UPDATE/DELETE for anon
-- =====================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories
  FOR SELECT USING (true);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_resources" ON resources;
CREATE POLICY "public_read_resources" ON resources
  FOR SELECT USING (status = 'approved' OR status IS NULL);

ALTER TABLE states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_states" ON states;
CREATE POLICY "public_read_states" ON states
  FOR SELECT USING (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subcategories') THEN
    EXECUTE 'ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "public_read_subcategories" ON subcategories';
    EXECUTE 'CREATE POLICY "public_read_subcategories" ON subcategories FOR SELECT USING (true)';
    RAISE NOTICE 'subcategories: RLS enabled, public read policy applied';
  ELSE
    RAISE NOTICE 'subcategories: table does not exist — skipped';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resource_categories') THEN
    EXECUTE 'ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "public_read_resource_categories" ON resource_categories';
    EXECUTE 'CREATE POLICY "public_read_resource_categories" ON resource_categories FOR SELECT USING (true)';
    RAISE NOTICE 'resource_categories: RLS enabled, public read policy applied';
  ELSE
    RAISE NOTICE 'resource_categories: table does not exist — skipped';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resource_subcategories') THEN
    EXECUTE 'ALTER TABLE resource_subcategories ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "public_read_resource_subcategories" ON resource_subcategories';
    EXECUTE 'CREATE POLICY "public_read_resource_subcategories" ON resource_subcategories FOR SELECT USING (true)';
    RAISE NOTICE 'resource_subcategories: RLS enabled, public read policy applied';
  ELSE
    RAISE NOTICE 'resource_subcategories: table does not exist — skipped';
  END IF;
END $$;

-- =====================
-- STEP 3: USER-OWNED TABLES
-- (user_saved_resources)
-- Authenticated users can read/write their own rows only.
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
-- Defensive: if it exists, lock it down.
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
    RAISE NOTICE 'saved_resources: found — RLS enabled with ownership policies';
  ELSE
    RAISE NOTICE 'saved_resources: does not exist — skipped (expected)';
  END IF;
END $$;

-- =====================
-- STEP 5: SERVER-SIDE ONLY TABLES
-- RLS enabled with NO policies = all access denied except service_role.
-- =====================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE navigator_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE partner_organizations ENABLE ROW LEVEL SECURITY;

ALTER TABLE partner_routing_rules ENABLE ROW LEVEL SECURITY;

ALTER TABLE resource_clicks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_usage_log') THEN
    EXECUTE 'ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'ai_usage_log: RLS enabled (server-only, no policies)';
  ELSE
    RAISE NOTICE 'ai_usage_log: table does not exist — skipped';
  END IF;
END $$;

-- =============================================================
-- VERIFICATION MATRIX (run after applying this script):
--
-- Table                    | RLS  | Anon SELECT | Anon WRITE | Auth Own-Row | Service-Role
-- -------------------------|------|-------------|------------|--------------|-------------
-- categories               | ON   | ALLOW       | DENY       | n/a          | BYPASS
-- resources                | ON   | ALLOW*      | DENY       | n/a          | BYPASS
-- states                   | ON   | ALLOW       | DENY       | n/a          | BYPASS
-- subcategories            | ON   | ALLOW       | DENY       | n/a          | BYPASS
-- resource_categories      | ON   | ALLOW       | DENY       | n/a          | BYPASS
-- resource_subcategories   | ON   | ALLOW       | DENY       | n/a          | BYPASS
-- user_saved_resources     | ON   | DENY        | DENY       | ALLOW        | BYPASS
-- saved_resources (if any) | ON   | DENY        | DENY       | ALLOW        | BYPASS
-- user_profiles            | ON   | DENY        | DENY       | DENY         | BYPASS
-- navigator_requests       | ON   | DENY        | DENY       | DENY         | BYPASS
-- partner_organizations    | ON   | DENY        | DENY       | DENY         | BYPASS
-- partner_routing_rules    | ON   | DENY        | DENY       | DENY         | BYPASS
-- resource_clicks          | ON   | DENY        | DENY       | DENY         | BYPASS
-- ai_usage_log             | ON   | DENY        | DENY       | DENY         | BYPASS
--
-- * resources: only rows with status='approved' or NULL are visible
--
-- Verification queries (run as anon role from SQL Editor):
--   SELECT * FROM user_profiles LIMIT 1;       -- Expected: 0 rows
--   SELECT * FROM navigator_requests LIMIT 1;  -- Expected: 0 rows
--   SELECT * FROM ai_usage_log LIMIT 1;        -- Expected: 0 rows
--   INSERT INTO states (code, name) VALUES ('XX','Test'); -- Expected: ERROR
--   SELECT * FROM categories LIMIT 1;          -- Expected: returns data
--   SELECT * FROM resources LIMIT 1;           -- Expected: returns approved data
--   SELECT * FROM subcategories LIMIT 1;       -- Expected: returns data
-- =============================================================
