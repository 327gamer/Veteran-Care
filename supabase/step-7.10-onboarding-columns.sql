-- Step 7.10: Add onboarding_status and activation_date to partner_organizations
-- Run in Supabase SQL Editor

-- Step 1: Add onboarding_status column
ALTER TABLE partner_organizations
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending';

-- Step 2: Add activation_date column
ALTER TABLE partner_organizations
  ADD COLUMN IF NOT EXISTS activation_date TIMESTAMPTZ;

-- Step 3: Set active paid partners to onboarding_status = 'active'
UPDATE partner_organizations
  SET onboarding_status = 'active',
      activation_date = created_at
  WHERE active_paid_partner = true AND is_active = true;

-- Step 4: Set inactive partners to 'pending'
UPDATE partner_organizations
  SET onboarding_status = 'pending'
  WHERE active_paid_partner = false OR is_active = false;

-- Step 5: Verify
SELECT id, name, subscription_status, active_paid_partner, onboarding_status, activation_date
  FROM partner_organizations
  WHERE is_lead_enabled = true
  ORDER BY name;
