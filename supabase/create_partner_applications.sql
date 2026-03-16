CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  city TEXT,
  state TEXT,
  category_id UUID REFERENCES trusted_service_categories(id),
  service_description TEXT,
  pricing_interest TEXT NOT NULL DEFAULT 'both',
  status TEXT NOT NULL DEFAULT 'prospect',
  admin_notes TEXT,
  converted_provider_id UUID REFERENCES trusted_services(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  stripe_checkout_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access partner_applications" ON partner_applications
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_applications_category ON partner_applications(category_id);
CREATE INDEX IF NOT EXISTS idx_partner_applications_state ON partner_applications(state);
CREATE INDEX IF NOT EXISTS idx_partner_applications_created ON partner_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_apps_stripe_customer ON partner_applications(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_partner_apps_stripe_sub ON partner_applications(stripe_subscription_id);
