CREATE TABLE IF NOT EXISTS navigator_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id uuid,
  resource_title text,
  veteran_name text NOT NULL,
  veteran_phone text,
  veteran_email text,
  message text,
  preferred_contact text DEFAULT 'phone',
  user_state text,
  user_city text,
  user_zip text,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_navigator_requests_status ON navigator_requests(status);
CREATE INDEX IF NOT EXISTS idx_navigator_requests_created_at ON navigator_requests(created_at);
