-- Veteran Care API Monetization (SLEEP MODE)
-- Adds a per-row kill switch so the future paid API can only ever surface
-- resources the founder has explicitly opted in.
--
-- Safe to run multiple times (IF NOT EXISTS).
-- Default is FALSE: nothing becomes public until each row is opted in.

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS public_api_eligible BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_resources_api_eligible
  ON resources(public_api_eligible)
  WHERE public_api_eligible = true;

-- Verify:
-- SELECT column_name, data_type, column_default
--   FROM information_schema.columns
--  WHERE table_name='resources' AND column_name='public_api_eligible';
