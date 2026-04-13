-- Step 7.12: Partner Activation Recovery / Follow-Up Layer
-- Run in Supabase SQL Editor

-- Follow-up tracking columns
ALTER TABLE partner_organizations ADD COLUMN IF NOT EXISTS follow_up_status TEXT DEFAULT 'none';
ALTER TABLE partner_organizations ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;
ALTER TABLE partner_organizations ADD COLUMN IF NOT EXISTS last_contact_type TEXT;

-- Set existing active partners to 'none' (no follow-up needed)
UPDATE partner_organizations SET follow_up_status = 'none' WHERE onboarding_status = 'active' AND follow_up_status IS NULL;

-- Verify
SELECT follow_up_status, COUNT(*) FROM partner_organizations GROUP BY follow_up_status;
