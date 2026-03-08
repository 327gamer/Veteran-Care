-- ============================================================
-- PARTNER ROUTING SYSTEM
-- Run this entire file in Supabase SQL Editor (one-time setup)
-- Safe to re-run: uses IF NOT EXISTS / IF NOT EXISTS throughout
-- ============================================================

-- 1) Ensure navigator_requests has category + subcategory columns
--    (needed for routing engine to match leads to partners)
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- 2) Create partner_organizations table
CREATE TABLE IF NOT EXISTS partner_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  state TEXT,
  cities TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_lead_enabled BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Create partner_routing_rules table
CREATE TABLE IF NOT EXISTS partner_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partner_organizations(id) ON DELETE CASCADE,
  category_slug TEXT,
  subcategory TEXT,
  urgency TEXT,
  state TEXT,
  city TEXT,
  priority INTEGER DEFAULT 100,
  max_leads_per_day INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routing_rules_partner ON partner_routing_rules(partner_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_category ON partner_routing_rules(category_slug);
CREATE INDEX IF NOT EXISTS idx_routing_rules_state ON partner_routing_rules(state);

-- 4) Add routing columns to navigator_requests
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS routed_to_partner_id UUID REFERENCES partner_organizations(id);
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS routed_at TIMESTAMPTZ;
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS partner_outcome TEXT;
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS escalation_count INTEGER DEFAULT 0;
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS routing_history JSONB DEFAULT '[]'::jsonb;

-- 5) Index for escalation queries (finds pending routed leads efficiently)
CREATE INDEX IF NOT EXISTS idx_nav_delivery_status ON navigator_requests(delivery_status) WHERE delivery_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_nav_routed_partner ON navigator_requests(routed_to_partner_id) WHERE routed_to_partner_id IS NOT NULL;
