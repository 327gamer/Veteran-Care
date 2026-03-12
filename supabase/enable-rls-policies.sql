-- =============================================================
-- Supabase Security Remediation: Enable RLS on all public tables
-- Run this in the Supabase SQL Editor
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
-- SERVER-SIDE ONLY TABLES
-- (user_profiles, navigator_requests, partner_organizations,
--  partner_routing_rules, resource_clicks,
--  user_saved_resources, saved_resources)
-- No anon or authenticated policies — only service_role bypasses RLS
-- =====================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE navigator_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE partner_organizations ENABLE ROW LEVEL SECURITY;

ALTER TABLE partner_routing_rules ENABLE ROW LEVEL SECURITY;

ALTER TABLE resource_clicks ENABLE ROW LEVEL SECURITY;

ALTER TABLE user_saved_resources ENABLE ROW LEVEL SECURITY;

ALTER TABLE saved_resources ENABLE ROW LEVEL SECURITY;
