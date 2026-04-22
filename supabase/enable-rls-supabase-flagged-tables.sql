-- Veteran Care — Supabase Advisor remediation (run in Supabase SQL Editor)
-- ============================================================================
-- These 4 tables live in the SUPABASE Postgres (project ewvdrojlguslayeavtni),
-- not in the Replit Helium Postgres. They were created by chunk-5.3 / 5.8 / 7.1
-- migrations without ALTER TABLE ... ENABLE ROW LEVEL SECURITY, so Supabase
-- Advisor (correctly) flagged them as "RLS Disabled in Public".
--
-- The Replit-side boot enforcer cannot reach these tables — it scans the Helium
-- Postgres only. Until SUPABASE_DB_PASSWORD is provided to the app, this file
-- is the manual remediation path. Idempotent — safe to re-run.
--
-- After running, refresh Supabase Advisor — the 4 warnings will clear.
-- ============================================================================

ALTER TABLE public.billing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_rotation_state ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('billing_config','billing_runs','optimization_actions_log','partner_rotation_state')
ORDER BY tablename;
-- Expected: all four rows show rls_enabled = true
--
-- These tables are accessed exclusively via supabaseAdmin (service-role key)
-- which BYPASSES RLS by design. Enabling RLS with no policies attached gives
-- "deny-all" to anon and authenticated roles while keeping server-side reads
-- and writes fully functional. This is the same posture as the 22 SERVER_ONLY
-- tables on the Helium side.
