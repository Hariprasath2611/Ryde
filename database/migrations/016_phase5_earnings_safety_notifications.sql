-- 016_phase5_earnings_safety_notifications.sql
-- Phase 5: Earnings, Payout Accounts, Ratings, Complaints, Push/In-App Notifications, SOS Safety, and Live Trip Sharing

-- 1. Ensure settlement_status enum includes 'settled'
ALTER TYPE public.settlement_status ADD VALUE IF NOT EXISTS 'settled';

-- 2. Payout accounts table (UPI ID or Bank Account with IFSC validation)
CREATE TABLE IF NOT EXISTS public.payout_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL CHECK (account_type IN ('upi', 'bank_account')),
  upi_id TEXT,
  bank_name TEXT,
  account_number_masked TEXT,
  ifsc_code TEXT,
  beneficiary_name TEXT NOT NULL,
  provider_token TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  verification_status public.verification_status NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payout_accounts_driver_id ON public.payout_accounts(driver_id);

-- Ensure only one default payout account per driver
CREATE UNIQUE INDEX IF NOT EXISTS idx_payout_accounts_driver_default
  ON public.payout_accounts(driver_id)
  WHERE (is_default = true);

DROP TRIGGER IF EXISTS trigger_payout_accounts_updated_at ON public.payout_accounts;
CREATE TRIGGER trigger_payout_accounts_updated_at
  BEFORE UPDATE ON public.payout_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3. Live trip sharing tokens
CREATE TABLE IF NOT EXISTS public.trip_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_shares_trip_id ON public.trip_shares(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_shares_token ON public.trip_shares(share_token);

-- 4. Extend sos_events with resolution metadata and geocoded address
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sos_events' AND column_name = 'reverse_geocoded_address'
  ) THEN
    ALTER TABLE public.sos_events ADD COLUMN reverse_geocoded_address TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sos_events' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.sos_events ADD COLUMN notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sos_events' AND column_name = 'acknowledged_at'
  ) THEN
    ALTER TABLE public.sos_events ADD COLUMN acknowledged_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sos_events' AND column_name = 'acknowledged_by'
  ) THEN
    ALTER TABLE public.sos_events ADD COLUMN acknowledged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Extend notifications with metadata JSONB column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'data'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 6. Trigger to maintain drivers.rating_avg and rating_count when ratings are submitted
CREATE OR REPLACE FUNCTION public.update_driver_rating_aggregates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_driver_id UUID;
  v_avg NUMERIC(3,2);
  v_cnt INTEGER;
BEGIN
  -- Check if to_user_id is a driver
  SELECT id INTO v_driver_id FROM public.drivers WHERE user_id = NEW.to_user_id;

  IF v_driver_id IS NOT NULL THEN
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 5.00), COUNT(*)
    INTO v_avg, v_cnt
    FROM public.ratings
    WHERE to_user_id = NEW.to_user_id;

    UPDATE public.drivers
    SET rating_avg = v_avg,
        rating_count = v_cnt,
        updated_at = now()
    WHERE id = v_driver_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_ratings_update_driver ON public.ratings;
CREATE TRIGGER trigger_ratings_update_driver
  AFTER INSERT OR UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_rating_aggregates();

-- 7. Trigger to enforce max 5 emergency contacts per user
CREATE OR REPLACE FUNCTION public.check_max_emergency_contacts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.emergency_contacts
  WHERE user_id = NEW.user_id;

  IF v_count >= 5 THEN
    RAISE EXCEPTION 'A user may have a maximum of 5 emergency contacts' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_max_emergency_contacts ON public.emergency_contacts;
CREATE TRIGGER trigger_check_max_emergency_contacts
  BEFORE INSERT ON public.emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_emergency_contacts();

-- 8. Row Level Security Policies for Payout Accounts & Trip Shares
ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_shares ENABLE ROW LEVEL SECURITY;

-- payout_accounts: driver has full access to own payout accounts
DROP POLICY IF EXISTS "payout_accounts_driver_select" ON public.payout_accounts;
CREATE POLICY "payout_accounts_driver_select" ON public.payout_accounts
  FOR SELECT
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "payout_accounts_driver_insert" ON public.payout_accounts;
CREATE POLICY "payout_accounts_driver_insert" ON public.payout_accounts
  FOR INSERT
  WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "payout_accounts_driver_update" ON public.payout_accounts;
CREATE POLICY "payout_accounts_driver_update" ON public.payout_accounts
  FOR UPDATE
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "payout_accounts_driver_delete" ON public.payout_accounts;
CREATE POLICY "payout_accounts_driver_delete" ON public.payout_accounts
  FOR DELETE
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR public.is_admin()
  );

-- trip_shares: driver can create/read own trip shares, public can select active tokens
DROP POLICY IF EXISTS "trip_shares_driver_all" ON public.trip_shares;
CREATE POLICY "trip_shares_driver_all" ON public.trip_shares
  FOR ALL
  USING (
    trip_id IN (
      SELECT id FROM public.trips WHERE driver_id IN (
        SELECT id FROM public.drivers WHERE user_id = auth.uid()
      )
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "trip_shares_public_select" ON public.trip_shares;
CREATE POLICY "trip_shares_public_select" ON public.trip_shares
  FOR SELECT
  USING (expires_at > now());
