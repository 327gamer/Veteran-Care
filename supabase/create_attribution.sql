CREATE TABLE IF NOT EXISTS user_attribution_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  landing_page TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attribution_sessions_session ON user_attribution_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_attribution_sessions_ambassador ON user_attribution_sessions(utm_content);
CREATE INDEX IF NOT EXISTS idx_attribution_sessions_created ON user_attribution_sessions(created_at);

ALTER TABLE trusted_service_leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE trusted_service_leads ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE trusted_service_leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE trusted_service_leads ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE trusted_service_leads ADD COLUMN IF NOT EXISTS session_id TEXT;

ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS session_id TEXT;

CREATE TABLE IF NOT EXISTS partner_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES partner_applications(id),
  ambassador TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT,
  revenue_amount NUMERIC(10, 2),
  event_type TEXT NOT NULL DEFAULT 'checkout_completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_attribution_ambassador ON partner_attribution(ambassador);
CREATE INDEX IF NOT EXISTS idx_partner_attribution_created ON partner_attribution(created_at);
