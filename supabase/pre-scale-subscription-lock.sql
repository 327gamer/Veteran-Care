-- Pre-Scale Check: Add subscription_status and active_paid_partner to partner_organizations
-- Run in Supabase SQL Editor

-- Step 1: Add subscription_status column
ALTER TABLE partner_organizations
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Step 2: Add active_paid_partner boolean
ALTER TABLE partner_organizations
  ADD COLUMN IF NOT EXISTS active_paid_partner BOOLEAN DEFAULT true;

-- Step 3: Set existing active partners as paid (preserve current behavior)
UPDATE partner_organizations
  SET subscription_status = 'active',
      active_paid_partner = true
  WHERE is_active = true;

-- Step 4: Set inactive partners to canceled
UPDATE partner_organizations
  SET subscription_status = 'canceled',
      active_paid_partner = false
  WHERE is_active = false;

-- Step 5: Verify
SELECT id, name, is_active, is_lead_enabled, subscription_status, active_paid_partner
  FROM partner_organizations
  ORDER BY is_active DESC, name;
