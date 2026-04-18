-- Stage A: Seeded Provider System foundation
-- Idempotent: safe to re-run.

-- 1) Add seeded-provider columns to partner_organizations
ALTER TABLE partner_organizations ADD COLUMN IF NOT EXISTS provider_type TEXT NOT NULL DEFAULT 'partner';
ALTER TABLE partner_organizations ADD COLUMN IF NOT EXISTS is_seeded BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE partner_organizations ADD COLUMN IF NOT EXISTS seeded_source TEXT;

-- 2) Constrain provider_type values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partner_organizations_provider_type_check'
  ) THEN
    ALTER TABLE partner_organizations
      ADD CONSTRAINT partner_organizations_provider_type_check
      CHECK (provider_type IN ('seeded', 'partner'));
  END IF;
END $$;

-- 3) Hard DB-level lock: a seeded provider can NEVER be marked as a paid partner.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'seeded_cannot_be_active_paid'
  ) THEN
    ALTER TABLE partner_organizations
      ADD CONSTRAINT seeded_cannot_be_active_paid
      CHECK ( provider_type = 'partner' OR active_paid_partner IS NOT TRUE );
  END IF;
END $$;

-- 4) Hard DB-level lock: a seeded provider can NEVER be lead-enabled.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'seeded_cannot_be_lead_enabled'
  ) THEN
    ALTER TABLE partner_organizations
      ADD CONSTRAINT seeded_cannot_be_lead_enabled
      CHECK ( provider_type = 'partner' OR is_lead_enabled IS NOT TRUE );
  END IF;
END $$;

-- 5) Mirror flag stays in sync with provider_type (defense in depth)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'is_seeded_matches_provider_type'
  ) THEN
    ALTER TABLE partner_organizations
      ADD CONSTRAINT is_seeded_matches_provider_type
      CHECK ( (provider_type = 'seeded') = (is_seeded = true) );
  END IF;
END $$;

-- 6) Indexes for fast filtering and future matching helpers
CREATE INDEX IF NOT EXISTS idx_partner_orgs_provider_type ON partner_organizations(provider_type);
CREATE INDEX IF NOT EXISTS idx_partner_orgs_is_seeded ON partner_organizations(is_seeded);

-- 7) Link directory listings (trusted_services) back to partner identity
ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS partner_organization_id UUID REFERENCES partner_organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_trusted_services_partner_org_id ON trusted_services(partner_organization_id);

-- 8) Backfill: ensure every existing row is consistent
UPDATE partner_organizations
SET provider_type = 'partner', is_seeded = false
WHERE provider_type IS NULL OR (provider_type = 'partner' AND is_seeded = true);
