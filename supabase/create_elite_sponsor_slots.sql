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


-- ============================================================
-- ECSS PHASE B SCHEMA — additive extensions to Phase A
--
-- Founder-approved extensions (BUILD ONLY, no parallel systems):
--   - subcategory_slug architecture (no UI marketplace yet)
--   - ambassador attribution inheritance from partner_application UTM
--   - creative_approval_status gate (admin must approve before public render)
--   - sponsor_partner_application_id / sponsor_partner_organization_id links
--   - navigator_requests.elite_sponsor_slot_id (auto-bill targeting)
--   - elite_sponsor_leads.navigator_request_id (lifecycle linkage)
--   - partner_organizations.auto_bill_on_accept opt-in flag
--   - elite_sponsor_waitlist for SOLD slots
--   - Insurance category as 4th launch category
--
-- All ALTER + CREATE statements use IF NOT EXISTS or DROP-then-CREATE.
-- Idempotent. Safe to re-run. No destructive ops.
-- ============================================================

-- ----------------------------------------------------------------
-- B1) elite_sponsor_slots — additive columns
-- ----------------------------------------------------------------
ALTER TABLE elite_sponsor_slots
  ADD COLUMN IF NOT EXISTS subcategory_slug TEXT NULL;

ALTER TABLE elite_sponsor_slots
  ADD COLUMN IF NOT EXISTS attributed_ambassador_id UUID NULL,
  ADD COLUMN IF NOT EXISTS attributed_ambassador_code TEXT NULL,
  ADD COLUMN IF NOT EXISTS attributed_session_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS attributed_utm_source TEXT NULL,
  ADD COLUMN IF NOT EXISTS attributed_utm_medium TEXT NULL,
  ADD COLUMN IF NOT EXISTS attributed_utm_campaign TEXT NULL;

ALTER TABLE elite_sponsor_slots
  ADD COLUMN IF NOT EXISTS sponsor_partner_application_id UUID NULL,
  ADD COLUMN IF NOT EXISTS sponsor_partner_organization_id UUID NULL;

-- Creative approval gate — admin must approve banner/logo before public render
ALTER TABLE elite_sponsor_slots
  ADD COLUMN IF NOT EXISTS creative_approval_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS creative_rejection_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS creative_approved_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS creative_approved_by TEXT NULL,
  ADD COLUMN IF NOT EXISTS creative_submitted_at TIMESTAMPTZ NULL;

-- Backfill any existing rows: leave 'pending' for vacant slots (no creative yet).
-- Rows that already had data manually entered as 'sold' will need admin approval before public render.

-- ----------------------------------------------------------------
-- B2) Replace UNIQUE constraint with partial unique indexes
--    (supports both top-sponsor and subcategory slots)
-- ----------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'elite_sponsor_slots_unique_state_category'
      AND conrelid = 'elite_sponsor_slots'::regclass
  ) THEN
    ALTER TABLE elite_sponsor_slots
      DROP CONSTRAINT elite_sponsor_slots_unique_state_category;
  END IF;
END $$;

-- Top Sponsor slot (no subcategory) — one per state×category
CREATE UNIQUE INDEX IF NOT EXISTS elite_sponsor_slots_top_uq
  ON elite_sponsor_slots(category_slug, state_code)
  WHERE subcategory_slug IS NULL;

-- Subcategory slot — one per state×category×subcategory
CREATE UNIQUE INDEX IF NOT EXISTS elite_sponsor_slots_sub_uq
  ON elite_sponsor_slots(category_slug, subcategory_slug, state_code)
  WHERE subcategory_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_elite_slots_creative_approval
  ON elite_sponsor_slots(creative_approval_status);
CREATE INDEX IF NOT EXISTS idx_elite_slots_partner_app
  ON elite_sponsor_slots(sponsor_partner_application_id)
  WHERE sponsor_partner_application_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_elite_slots_partner_org
  ON elite_sponsor_slots(sponsor_partner_organization_id)
  WHERE sponsor_partner_organization_id IS NOT NULL;

-- ----------------------------------------------------------------
-- B3) navigator_requests — tag ECSS-originated leads
--    (auto-bill hook keys off this column)
-- ----------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'navigator_requests'
  ) THEN
    BEGIN
      ALTER TABLE navigator_requests
        ADD COLUMN IF NOT EXISTS elite_sponsor_slot_id UUID NULL;
      CREATE INDEX IF NOT EXISTS idx_navigator_requests_elite_slot
        ON navigator_requests(elite_sponsor_slot_id)
        WHERE elite_sponsor_slot_id IS NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '[ECSS Phase B] navigator_requests extend skipped: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '[ECSS Phase B] navigator_requests not present — skipping link column';
  END IF;
END $$;

-- ----------------------------------------------------------------
-- B4) elite_sponsor_leads — link to navigator_requests lifecycle
-- ----------------------------------------------------------------
ALTER TABLE elite_sponsor_leads
  ADD COLUMN IF NOT EXISTS navigator_request_id UUID NULL;

CREATE INDEX IF NOT EXISTS idx_elite_leads_navigator_request
  ON elite_sponsor_leads(navigator_request_id)
  WHERE navigator_request_id IS NOT NULL;

-- ----------------------------------------------------------------
-- B5) partner_organizations — opt-in auto-bill flag (default FALSE)
--    ECSS sponsors flipped TRUE on slot activation; legacy partners untouched.
-- ----------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'partner_organizations'
  ) THEN
    BEGIN
      ALTER TABLE partner_organizations
        ADD COLUMN IF NOT EXISTS auto_bill_on_accept BOOLEAN NOT NULL DEFAULT FALSE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '[ECSS Phase B] partner_organizations extend skipped: %', SQLERRM;
    END;
  END IF;
END $$;

-- ----------------------------------------------------------------
-- B6) elite_sponsor_waitlist — captured when veteran/sponsor lands on a SOLD slot
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS elite_sponsor_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Slot location identity
  category_slug TEXT NOT NULL,
  state_code TEXT NOT NULL,
  subcategory_slug TEXT NULL,

  -- Contact
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  contact_company TEXT,
  notes TEXT,

  -- Attribution (carried from session/UTM at capture time)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  attributed_session_id TEXT,

  -- Notification tracking (admin marks when they reach out)
  notified_at TIMESTAMPTZ,
  notified_outcome TEXT,
  internal_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_elite_waitlist_target
  ON elite_sponsor_waitlist(state_code, category_slug, subcategory_slug);
CREATE INDEX IF NOT EXISTS idx_elite_waitlist_email
  ON elite_sponsor_waitlist(contact_email);
CREATE INDEX IF NOT EXISTS idx_elite_waitlist_created
  ON elite_sponsor_waitlist(created_at DESC);

ALTER TABLE elite_sponsor_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert elite_sponsor_waitlist" ON elite_sponsor_waitlist;
CREATE POLICY "Public insert elite_sponsor_waitlist"
  ON elite_sponsor_waitlist
  FOR INSERT
  WITH CHECK (true);

-- ----------------------------------------------------------------
-- B7) Tighten public-read RLS — banner only renders APPROVED creatives
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Public read active elite_sponsor_slots" ON elite_sponsor_slots;
CREATE POLICY "Public read active elite_sponsor_slots"
  ON elite_sponsor_slots
  FOR SELECT
  USING (
    status = 'sold'
    AND billing_status = 'active'
    AND creative_approval_status = 'approved'
  );

-- ----------------------------------------------------------------
-- B8) Insurance — 4th launch category (founder decision #6)
-- ----------------------------------------------------------------
INSERT INTO trusted_service_categories (name, slug, description, icon, display_order)
VALUES (
  'Insurance',
  'insurance',
  'Auto, home, life, and health insurance for veterans and military families.',
  'shield',
  10
)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------------
-- B9) Trusted-services tile auto-link column (T008)
-- When an ECSS slot activates, an idempotent trusted_services row is
-- created/updated with elite_sponsor_slot_id set so the public list can
-- ORDER BY (elite_sponsor_slot_id IS NOT NULL) DESC, is_featured DESC.
-- ON DELETE SET NULL → if the slot is hard-deleted, the tile demotes
-- gracefully rather than vanishing.
-- ----------------------------------------------------------------
ALTER TABLE trusted_services
  ADD COLUMN IF NOT EXISTS elite_sponsor_slot_id UUID NULL
  REFERENCES elite_sponsor_slots(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trusted_services_ecss_slot
  ON trusted_services(elite_sponsor_slot_id)
  WHERE elite_sponsor_slot_id IS NOT NULL;

-- ============================================================
-- VERIFICATION (Phase B)
-- ============================================================
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'elite_sponsor_slots' AND column_name IN
--   ('subcategory_slug','creative_approval_status','attributed_ambassador_id',
--    'sponsor_partner_application_id','sponsor_partner_organization_id');
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'navigator_requests' AND column_name = 'elite_sponsor_slot_id';
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'partner_organizations' AND column_name = 'auto_bill_on_accept';
-- SELECT COUNT(*) FROM elite_sponsor_waitlist;
-- SELECT slug FROM trusted_service_categories WHERE slug = 'insurance';
-- ============================================================
-- END ECSS PHASE B SCHEMA
-- ============================================================

-- ============================================================
-- ECSS PHASE C — Click tracking (founder QA item #7, 2026-04-30)
-- ============================================================
-- Captures every outbound click on an Elite sponsor's website / phone /
-- CTA button so the founder can prove ROI to paying Elite partners.
-- Insert-only ledger: NEVER updated, NEVER deleted by app code (only by
-- admin retention policy if added later).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS elite_sponsor_clicks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id       UUID NOT NULL REFERENCES elite_sponsor_slots(id) ON DELETE CASCADE,
  click_type    TEXT NOT NULL CHECK (click_type IN ('website','phone','cta_primary','cta_secondary')),
  user_state    TEXT NULL,
  user_session  TEXT NULL,
  user_agent    TEXT NULL,
  referrer      TEXT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_elite_clicks_slot
  ON elite_sponsor_clicks(slot_id);
CREATE INDEX IF NOT EXISTS idx_elite_clicks_type
  ON elite_sponsor_clicks(click_type);
CREATE INDEX IF NOT EXISTS idx_elite_clicks_created
  ON elite_sponsor_clicks(created_at);

-- RLS: write-only for service role (tracked via the server endpoint).
-- Public reads disallowed; admin reads happen via service-role bypass.
ALTER TABLE elite_sponsor_clicks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'elite_sponsor_clicks'
      AND policyname = 'elite_clicks_no_public_access'
  ) THEN
    CREATE POLICY elite_clicks_no_public_access
      ON elite_sponsor_clicks
      FOR ALL
      TO PUBLIC
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- ============================================================
-- END ECSS PHASE C SCHEMA
-- ============================================================
