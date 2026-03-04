CREATE TABLE IF NOT EXISTS resource_clicks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE,
  click_type text NOT NULL,
  user_state text,
  user_city text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resource_clicks_resource_id ON resource_clicks(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_clicks_click_type ON resource_clicks(click_type);
CREATE INDEX IF NOT EXISTS idx_resource_clicks_created_at ON resource_clicks(created_at);

ALTER TABLE resource_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON resource_clicks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow admin read" ON resource_clicks
  FOR SELECT
  USING (true);
