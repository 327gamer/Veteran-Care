-- ============================================================
-- ELITE CATEGORY SPONSOR SLOT (ECSS) — PHASE A SCHEMA
--
-- Single-occupancy premium banner placement above category
-- listings. ONE sponsor per (state × category) — enforced by
-- UNIQUE constraint on (category_slug, state_code).
--
-- Vacant slots render the "YOUR BUSINESS HERE" placeholder.
-- Sold/active slots render the sponsor card (Phase B).
--
-- This is a SEPARATE PRODUCT from:
--   - $99 state listing
--   - $499 national listing
--   - featured placement (trusted_services.is_featured)
--   - near-me boost
--
-- It does NOT touch any existing table.
-- It does NOT modify any existing column.
-- All statements are idempotent (IF NOT EXISTS).
-- Safe to re-run.
--
-- Run in Supabase SQL Editor, or via server/elite-sponsor.ts
-- ensureEliteSponsorTables() bootstrap.
-- ============================================================

-- ----------------------------------------------------------------
-- 1) elite_sponsor_slots — inventory & sponsor identity
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS elite_sponsor_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Targeting (joiner key — no FK; standalone product)
  category_slug TEXT NOT NULL,        -- 'legal-services' | 'mortgage-lending' | 'real-estate'
  state_code TEXT NOT NULL,           -- 'AL', 'CA', 'FL', 'GA', 'NC', 'OH', 'PA', 'SC', 'TX', 'NY'

  -- Status
  status TEXT NOT NULL DEFAULT 'vacant',  -- 'vacant' | 'sold' | 'paused'

  -- Pricing (founder-approved Phase A defaults: $499/mo, $49.99/lead)
  monthly_price_cents INTEGER NOT NULL DEFAULT 49900,
  lead_price_cents INTEGER NOT NULL DEFAULT 4999,

  -- Sponsor identity (denormalized; nullable until slot is sold)
  sponsor_name TEXT,
  sponsor_logo_url TEXT,
  sponsor_short_description TEXT,
  sponsor_cta_text TEXT,
  sponsor_lead_email TEXT,
  sponsor_phone TEXT,
  sponsor_website_url TEXT,

  -- Billing (Stripe-ready, manually managed in Phase A; webhook-driven in Phase C)
  billing_status TEXT NOT NULL DEFAULT 'unpaid',  -- 'unpaid' | 'active' | 'past_due' | 'cancelled'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  -- Audit
  sold_at TIMESTAMPTZ,
  unsold_at TIMESTAMPTZ,
  notes_internal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One-and-only-one sponsor per (state × category)
  CONSTRAINT elite_sponsor_slots_unique_state_category UNIQUE (category_slug, state_code)
);

-- ----------------------------------------------------------------
-- 2) elite_sponsor_leads — leads delivered to elite sponsor inbox
--    (Phase B will write here; Phase A creates the table only.)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS elite_sponsor_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES elite_sponsor_slots(id) ON DELETE CASCADE,

  -- Snapshots so historical leads survive sponsor turnover on the slot
  sponsor_name_snapshot TEXT,
  delivered_to_email TEXT,

  -- Lead details
  lead_name TEXT NOT NULL,
  lead_email TEXT NOT NULL,
  lead_phone TEXT,
  lead_message TEXT,
  lead_state TEXT,
  lead_city TEXT,

  -- Delivery + status
  delivery_status TEXT NOT NULL DEFAULT 'queued',  -- 'queued' | 'sent' | 'failed' | 'bounced'
  delivered_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'new',              -- 'new' | 'contacted' | 'qualified' | 'closed'

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 3) Indexes for common lookups
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_elite_slots_state_category
  ON elite_sponsor_slots(state_code, category_slug);
CREATE INDEX IF NOT EXISTS idx_elite_slots_status
  ON elite_sponsor_slots(status);
CREATE INDEX IF NOT EXISTS idx_elite_slots_billing_status
  ON elite_sponsor_slots(billing_status);

CREATE INDEX IF NOT EXISTS idx_elite_leads_slot
  ON elite_sponsor_leads(slot_id);
CREATE INDEX IF NOT EXISTS idx_elite_leads_status
  ON elite_sponsor_leads(status);
CREATE INDEX IF NOT EXISTS idx_elite_leads_created
  ON elite_sponsor_leads(created_at DESC);

-- ----------------------------------------------------------------
-- 4) updated_at trigger for elite_sponsor_slots
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION elite_sponsor_slots_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_elite_sponsor_slots_updated_at ON elite_sponsor_slots;
CREATE TRIGGER trg_elite_sponsor_slots_updated_at
  BEFORE UPDATE ON elite_sponsor_slots
  FOR EACH ROW EXECUTE FUNCTION elite_sponsor_slots_set_updated_at();

-- ----------------------------------------------------------------
-- 5) RLS — admin-write via service role; public-read for active slots only
-- ----------------------------------------------------------------
ALTER TABLE elite_sponsor_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE elite_sponsor_leads ENABLE ROW LEVEL SECURITY;

-- Public can read only sold+active slot rows (banner needs sponsor data)
DROP POLICY IF EXISTS "Public read active elite_sponsor_slots" ON elite_sponsor_slots;
CREATE POLICY "Public read active elite_sponsor_slots"
  ON elite_sponsor_slots
  FOR SELECT
  USING (status = 'sold' AND billing_status = 'active');

-- Public can insert leads (Phase B form will use this)
DROP POLICY IF EXISTS "Public insert elite_sponsor_leads" ON elite_sponsor_leads;
CREATE POLICY "Public insert elite_sponsor_leads"
  ON elite_sponsor_leads
  FOR INSERT
  WITH CHECK (true);

-- (Service role bypasses RLS for full admin CRUD via supabaseAdmin client)

-- ----------------------------------------------------------------
-- 6) Add 'real-estate' to trusted_service_categories (founder decision #1)
--    NEW top-level category — not buried under housing or financial.
-- ----------------------------------------------------------------
INSERT INTO trusted_service_categories (name, slug, description, icon, display_order)
VALUES (
  'Real Estate',
  'real-estate',
  'Veteran-friendly real estate professionals — homebuying, selling, investment, and relocation support.',
  'home',
  9
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- VERIFICATION (run after apply)
-- ============================================================
-- SELECT COUNT(*) FROM elite_sponsor_slots;        -- expect 0 then 30 after seed
-- SELECT COUNT(*) FROM elite_sponsor_leads;        -- expect 0 in Phase A
-- SELECT slug FROM trusted_service_categories WHERE slug = 'real-estate';  -- expect 1 row
-- ============================================================
-- END ECSS PHASE A SCHEMA
-- ============================================================
