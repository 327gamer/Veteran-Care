CREATE TABLE IF NOT EXISTS resource_clicks (
  id bigserial PRIMARY KEY,
  resource_id uuid NOT NULL,
  click_type text NOT NULL,
  user_state text,
  user_city text,
  user_zip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resource_clicks_resource_id ON resource_clicks(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_clicks_created_at ON resource_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_resource_clicks_click_type ON resource_clicks(click_type);

-- Run this if the table already exists and is missing user_zip:
-- ALTER TABLE resource_clicks ADD COLUMN IF NOT EXISTS user_zip text;
