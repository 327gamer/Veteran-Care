-- =============================================================
-- FINAL Supabase Security Remediation — Complete RLS Lockdown
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL Editor)
-- =============================================================
--
-- ARCHITECTURE NOTES:
--   All server routes use supabaseAdmin (service_role key) which
--   BYPASSES RLS entirely. These policies protect against direct
--   access via the Supabase anon key or PostgREST API.
--
-- DUAL-DATABASE ARCHITECTURE:
--   Tables in the SEPARATE Neon/Replit Postgres (DATABASE_URL)
--   are NOT accessible via Supabase API and do NOT need Supabase
--   RLS. Those tables include: ambassadors, ambassador_links,
--   commissions, ambassador_payouts, partner_attribution,
--   user_attribution_sessions, partner_applications,
--   veteran_owned_businesses (Neon-only copies).
--
-- SUPABASE TABLES COVERED BY THIS SCRIPT (16 tables):
--   Public-read:     categories, resources, states,
--                    subcategories, resource_categories,
--                    resource_subcategories,
--                    trusted_service_categories
--   User-owned:      user_saved_resources
--   Server-only:     user_profiles, navigator_requests,
--                    partner_organizations, partner_routing_rules,
--                    resource_clicks, ai_usage_log,
--                    trusted_services, trusted_service_leads
-- =============================================================

-- =====================
-- STEP 1: DROP ALL LEGACY / STALE POLICIES
-- =====================

DROP POLICY IF EXISTS "states_public_read" ON states;
DROP POLICY IF EXISTS "states_anon_write" ON states;
DROP POLICY IF EXISTS "public_read_states" ON states;

DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
DROP POLICY IF EXISTS "Server-side anon key access" ON user_profiles;

DROP POLICY IF EXISTS "Users can read own saved resources" ON user_saved_resources;
DROP POLICY IF EXISTS "Users can insert own saved resources" ON user_saved_resources;
DROP POLICY IF EXISTS "Users can delete own saved resources" ON user_saved_resources;
DROP POLICY IF EXISTS "users_select_own_saved" ON user_saved_resources;
DROP POLICY IF EXISTS "users_insert_own_saved" ON user_saved_resources;
DROP POLICY IF EXISTS "users_delete_own_saved" ON user_saved_resources;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
DROP POLICY IF EXISTS "public_read_resources" ON resources;
DROP POLICY IF EXISTS "public_read_subcategories" ON subcategories;
DROP POLICY IF EXISTS "public_read_resource_categories" ON resource_categories;
DROP POLICY IF EXISTS "public_read_resource_subcategories" ON resource_subcategories;

-- =====================
-- STEP 2: PUBLIC READ-ONLY TABLES
-- Anonymous users can SELECT; no INSERT/UPDATE/DELETE.
-- =====================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_categories" ON categories
  FOR SELECT USING (true);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_resources" ON resources
  FOR SELECT USING (status = 'approved' OR status IS NULL);

ALTER TABLE states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_states" ON states
  FOR SELECT USING (true);

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_subcategories" ON subcategories
  FOR SELECT USING (true);

ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_resource_categories" ON resource_categories
  FOR SELECT USING (true);

ALTER TABLE resource_subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_resource_subcategories" ON resource_subcategories
  FOR SELECT USING (true);

ALTER TABLE trusted_service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_trusted_service_categories" ON trusted_service_categories
  FOR SELECT USING (true);

-- =====================
-- STEP 3: USER-OWNED TABLES
-- Authenticated users can read/write ONLY their own rows.
-- Routes use supabaseForUser(token) so auth.uid() is set.
-- =====================

ALTER TABLE user_saved_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_saved" ON user_saved_resources
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_saved" ON user_saved_resources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_saved" ON user_saved_resources
  FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- STEP 4: SERVER-ONLY TABLES
-- RLS enabled with NO anon/auth policies.
-- All access denied except service_role (which bypasses RLS).
-- This covers: user_profiles, navigator_requests,
--   partner_organizations, partner_routing_rules,
--   resource_clicks, ai_usage_log, trusted_services,
--   trusted_service_leads
-- =====================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigator_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_service_leads ENABLE ROW LEVEL SECURITY;

-- =====================
-- STEP 5: DEFENSIVE — legacy tables that may or may not exist
-- =====================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_resources') THEN
    EXECUTE 'ALTER TABLE saved_resources ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "users_select_own_saved_legacy" ON saved_resources FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "users_insert_own_saved_legacy" ON saved_resources FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "users_delete_own_saved_legacy" ON saved_resources FOR DELETE USING (auth.uid() = user_id)';
    RAISE NOTICE 'saved_resources: found and locked down';
  ELSE
    RAISE NOTICE 'saved_resources: does not exist — skipped';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partner_applications') THEN
    EXECUTE 'ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'partner_applications: found and locked down (server-only)';
  ELSE
    RAISE NOTICE 'partner_applications: does not exist in Supabase — skipped';
  END IF;
END $$;

-- =============================================================
-- VERIFICATION MATRIX
--
-- Table                      | RLS | Anon SELECT  | Anon WRITE | Auth Own | SvcRole
-- ---------------------------|-----|--------------|------------|----------|--------
-- categories                 | ON  | YES          | NO         | n/a      | BYPASS
-- resources                  | ON  | YES(approved)| NO         | n/a      | BYPASS
-- states                     | ON  | YES          | NO         | n/a      | BYPASS
-- subcategories              | ON  | YES          | NO         | n/a      | BYPASS
-- resource_categories        | ON  | YES          | NO         | n/a      | BYPASS
-- resource_subcategories     | ON  | YES          | NO         | n/a      | BYPASS
-- trusted_service_categories | ON  | YES          | NO         | n/a      | BYPASS
-- user_saved_resources       | ON  | NO           | NO         | YES      | BYPASS
-- user_profiles              | ON  | NO           | NO         | NO       | BYPASS
-- navigator_requests         | ON  | NO           | NO         | NO       | BYPASS
-- partner_organizations      | ON  | NO           | NO         | NO       | BYPASS
-- partner_routing_rules      | ON  | NO           | NO         | NO       | BYPASS
-- resource_clicks            | ON  | NO           | NO         | NO       | BYPASS
-- ai_usage_log               | ON  | NO           | NO         | NO       | BYPASS
-- trusted_services           | ON  | NO           | NO         | NO       | BYPASS
-- trusted_service_leads      | ON  | NO           | NO         | NO       | BYPASS
--
-- VERIFICATION QUERIES (run these AFTER the script above):
--   SELECT * FROM user_profiles LIMIT 1;       -- 0 rows (blocked)
--   SELECT * FROM navigator_requests LIMIT 1;  -- 0 rows (blocked)
--   SELECT * FROM trusted_service_leads LIMIT 1;-- 0 rows (blocked)
--   SELECT * FROM ai_usage_log LIMIT 1;        -- 0 rows (blocked)
--   SELECT * FROM trusted_services LIMIT 1;    -- 0 rows (blocked)
--   SELECT * FROM categories LIMIT 1;          -- returns data (allowed)
--   SELECT * FROM resources LIMIT 1;           -- returns approved (allowed)
--   SELECT * FROM subcategories LIMIT 1;       -- returns data (allowed)
--   INSERT INTO states (code, name) VALUES ('XX','Test'); -- ERROR (blocked)
-- =============================================================
