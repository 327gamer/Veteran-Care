CREATE TABLE IF NOT EXISTS trusted_service_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES trusted_services(id),
  provider_name TEXT NOT NULL,
  category_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  state TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trusted_service_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read trusted_service_leads" ON trusted_service_leads FOR SELECT USING (true);
CREATE POLICY "Public insert trusted_service_leads" ON trusted_service_leads FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_trusted_service_leads_provider ON trusted_service_leads(provider_id);
CREATE INDEX IF NOT EXISTS idx_trusted_service_leads_status ON trusted_service_leads(status);
CREATE INDEX IF NOT EXISTS idx_trusted_service_leads_created ON trusted_service_leads(created_at DESC);
