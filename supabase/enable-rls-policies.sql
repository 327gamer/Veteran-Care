-- =============================================================
-- Supabase Security Remediation: Enable RLS on all public tables
-- Run this in the Supabase SQL Editor
-- =============================================================
-- Architecture: All server routes use supabaseAdmin (service_role)
-- for writes, which bypasses RLS. These policies provide
-- defense-in-depth and protect against direct client access.
-- =============================================================

-- =====================
-- PUBLIC READ-ONLY TABLES
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
-- USER-OWNED TABLES
-- (user_saved_resources)
-- Authenticated users can read/write their own rows only.
-- Server routes also use supabaseAdmin for these operations
-- as defense-in-depth; these policies guard direct client access.
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
-- SERVER-SIDE ONLY TABLES
-- (user_profiles, navigator_requests, partner_organizations,
--  partner_routing_rules, resource_clicks)
-- No anon or authenticated policies — only service_role bypasses RLS.
-- All access goes through server routes using supabaseAdmin.
-- =====================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE navigator_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE partner_organizations ENABLE ROW LEVEL SECURITY;

ALTER TABLE partner_routing_rules ENABLE ROW LEVEL SECURITY;

ALTER TABLE resource_clicks ENABLE ROW LEVEL SECURITY;
