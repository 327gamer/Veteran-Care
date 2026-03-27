-- Consumer Referral Loop + Monthly Sweepstakes Schema
-- Step 62A / 63A — additive schema only, no endpoints or UI
-- Tables created in Neon/direct PG (same layer as ambassador/attribution tables)
-- User IDs are TEXT (logical FK to user_profiles; not enforced cross-DB)

-- 1) user_referrals — consumer-to-consumer referral tracking
CREATE TABLE IF NOT EXISTS user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id TEXT NOT NULL,
  referred_user_id TEXT,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'qualified', 'invalid')),
  qualified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  suspicion_flags JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON user_referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON user_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_referrals_status ON user_referrals(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_referrals_referred_unique
  ON user_referrals(referred_user_id) WHERE referred_user_id IS NOT NULL;

-- 2) referral_entries — sweepstakes entries earned from qualified referrals
CREATE TABLE IF NOT EXISTS referral_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  referral_id UUID NOT NULL REFERENCES user_referrals(id) ON DELETE CASCADE,
  entry_month TEXT NOT NULL,
  entry_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_entries_user ON referral_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_entries_month ON referral_entries(entry_month);
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_entries_referral_unique ON referral_entries(referral_id);

-- 3) sweepstakes_months — monthly contest windows
CREATE TABLE IF NOT EXISTS sweepstakes_months (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'closed', 'archived')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  sponsor_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sweepstakes_months_status ON sweepstakes_months(status);

-- 4) sweepstakes_winners — winner selection audit log
CREATE TABLE IF NOT EXISTS sweepstakes_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL,
  user_id TEXT NOT NULL,
  entry_id UUID REFERENCES referral_entries(id) ON DELETE SET NULL,
  selected_by_admin_id TEXT,
  selection_method TEXT NOT NULL DEFAULT 'random'
    CHECK (selection_method IN ('random', 'manual')),
  prize_notes TEXT,
  sponsor_notes TEXT,
  notified BOOLEAN NOT NULL DEFAULT false,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sweepstakes_winners_month ON sweepstakes_winners(month);
CREATE INDEX IF NOT EXISTS idx_sweepstakes_winners_user ON sweepstakes_winners(user_id);

-- 5) user_referral_profiles — permanent referral code per user (Step 62.2)
CREATE TABLE IF NOT EXISTS user_referral_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_urp_user_id ON user_referral_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_urp_referral_code ON user_referral_profiles(referral_code);

-- 6) Add source column to referral_entries (Step 62.2)
ALTER TABLE referral_entries ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'referral';
