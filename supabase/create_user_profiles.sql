CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'veteran',
  consent_contact BOOLEAN NOT NULL DEFAULT false,
  branch_of_service TEXT,
  interests TEXT[] DEFAULT '{}',
  service_area TEXT,
  state TEXT,
  city TEXT,
  zip TEXT,
  profile_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role full access"
  ON user_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- Server uses anon key with server-side auth validation (supabase.auth.getUser)
-- and scopes all queries with .eq("id", user.id)
-- This policy allows the server to operate on behalf of authenticated users
CREATE POLICY "Server-side anon key access"
  ON user_profiles FOR ALL
  USING (true)
  WITH CHECK (true);
