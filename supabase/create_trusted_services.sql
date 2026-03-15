CREATE TABLE IF NOT EXISTS trusted_service_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'shield',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trusted_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES trusted_service_categories(id),
  name TEXT NOT NULL,
  short_description TEXT,
  website_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  logo_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verification_label TEXT,
  cta_text TEXT NOT NULL DEFAULT 'Learn More',
  cta_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  notes_internal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trusted_service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read trusted_service_categories" ON trusted_service_categories FOR SELECT USING (true);
CREATE POLICY "Public read trusted_services" ON trusted_services FOR SELECT USING (true);

INSERT INTO trusted_service_categories (name, slug, description, icon, display_order) VALUES
  ('Housing & Home Services', 'housing-home', 'Trusted housing, moving, and home services for veterans and families', 'home', 1),
  ('Legal Services', 'legal-services', 'Vetted legal professionals experienced with veteran-specific needs', 'scale', 2),
  ('Financial & Credit Services', 'financial-credit', 'Trusted financial advisors, credit counseling, and lending partners', 'dollar-sign', 3),
  ('Insurance Services', 'insurance', 'Insurance providers offering veteran-friendly coverage options', 'shield', 4),
  ('Education & Training', 'education-training', 'Accredited programs and training providers supporting veteran success', 'graduation-cap', 5),
  ('Employment Support', 'employment-support', 'Employers and staffing partners committed to hiring veterans', 'briefcase', 6),
  ('Benefits Assistance', 'benefits-assistance', 'Professional services to help navigate and maximize veteran benefits', 'award', 7),
  ('Wellness & Recovery', 'wellness-recovery', 'Wellness providers, recovery programs, and holistic support services', 'heart-pulse', 8)
ON CONFLICT (slug) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_trusted_services_category ON trusted_services(category_id);
CREATE INDEX IF NOT EXISTS idx_trusted_services_state ON trusted_services(state);
CREATE INDEX IF NOT EXISTS idx_trusted_services_active ON trusted_services(is_active);
