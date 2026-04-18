-- Veteran Care — page_views (visitor / traffic beacon ingest)
-- Pure additive event log. Fire-and-forget from client, never blocks.
-- No FK to existing tables. No writes to existing tables.

CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  path TEXT NOT NULL,
  referrer TEXT,
  is_mobile BOOLEAN NOT NULL DEFAULT false,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  utm_id TEXT,
  ambassador_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_utm_id ON page_views(utm_id);
CREATE INDEX IF NOT EXISTS idx_page_views_ambassador_code ON page_views(ambassador_code);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
