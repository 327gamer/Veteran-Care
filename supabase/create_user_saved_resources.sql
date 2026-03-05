CREATE TABLE IF NOT EXISTS user_saved_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_resources_user_id ON user_saved_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_resources_resource_id ON user_saved_resources(resource_id);

ALTER TABLE user_saved_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saved resources"
  ON user_saved_resources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved resources"
  ON user_saved_resources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved resources"
  ON user_saved_resources FOR DELETE
  USING (auth.uid() = user_id);
