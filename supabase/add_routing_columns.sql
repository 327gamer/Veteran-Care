ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS routed_to_partner_id UUID REFERENCES partner_organizations(id);
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS routed_at TIMESTAMPTZ;
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS partner_outcome TEXT;
ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
