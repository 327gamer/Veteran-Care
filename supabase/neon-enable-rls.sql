-- =============================================================
-- Neon/Replit Postgres — Enable RLS on all tables
-- Run this against the DATABASE_URL database
-- =============================================================
-- These tables are NOT exposed via Supabase PostgREST/anon key.
-- They are accessed ONLY via server-side pgQuery.
-- Enabling RLS here is defense-in-depth: it prevents exposure
-- if a direct connection is ever shared or misconfigured.
--
-- Since all access is via the database owner role (which bypasses
-- RLS by default in Postgres), these policies add protection
-- without breaking any existing functionality.
-- =============================================================

ALTER TABLE ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_attribution_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_service_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE veteran_owned_businesses ENABLE ROW LEVEL SECURITY;

-- partner_applications, trusted_services, trusted_service_categories
-- already have RLS=ON — no action needed.

-- =============================================================
-- VERIFICATION: Run after applying
--   SELECT tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public'
--   ORDER BY tablename;
-- All tables should show rowsecurity = true
-- =============================================================
