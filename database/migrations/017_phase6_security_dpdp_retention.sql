-- 017_phase6_security_dpdp_retention.sql
-- Phase 6: Security Hardening, DPDP Act Readiness (Consent & Erasure), and Telemetry Retention Pruning

-- 1. Extend drivers table with account lifecycle and DPDP deletion flags
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_drivers_deletion_status
  ON public.drivers(is_deleted, deletion_scheduled_at)
  WHERE is_deleted = TRUE OR deletion_scheduled_at IS NOT NULL;

-- 2. Digital Personal Data Protection (DPDP) Act: Driver Consent Logs
CREATE TABLE IF NOT EXISTS public.driver_consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  ip_address TEXT,
  user_agent TEXT,
  is_granted BOOLEAN NOT NULL DEFAULT TRUE,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_consent_logs_driver ON public.driver_consent_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_consent_logs_purpose ON public.driver_consent_logs(purpose);

-- 3. Account Deletion Requests (Right to Erasure with statutory 30-day grace period)
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_deletion_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  status TEXT NOT NULL DEFAULT 'pending_grace_period' CHECK (status IN ('pending_grace_period', 'processed', 'cancelled')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_driver ON public.account_deletion_requests(driver_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status ON public.account_deletion_requests(status, scheduled_deletion_at);

DROP TRIGGER IF EXISTS trigger_account_deletion_requests_updated_at ON public.account_deletion_requests;
CREATE TRIGGER trigger_account_deletion_requests_updated_at
  BEFORE UPDATE ON public.account_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Stored Procedure: Telemetry Retention Pruning Job
-- Removes location breadcrumbs older than retention_days (default 30 days) to comply with data minimization
CREATE OR REPLACE FUNCTION public.prune_stale_telemetry(retention_days INTEGER DEFAULT 30)
RETURNS TABLE (
  pruned_trip_locations BIGINT,
  pruned_driver_locations BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ;
  v_trip_loc_count BIGINT;
  v_driver_loc_count BIGINT;
BEGIN
  v_cutoff := now() - (retention_days || ' days')::INTERVAL;

  -- 1. Delete trip breadcrumbs older than cutoff
  WITH deleted AS (
    DELETE FROM public.trip_locations
    WHERE recorded_at < v_cutoff
    RETURNING 1
  )
  SELECT count(*) INTO v_trip_loc_count FROM deleted;

  -- 2. Delete driver_locations that haven't been updated for > cutoff (inactive / orphaned)
  WITH deleted AS (
    DELETE FROM public.driver_locations
    WHERE updated_at < v_cutoff
    RETURNING 1
  )
  SELECT count(*) INTO v_driver_loc_count FROM deleted;

  RETURN QUERY SELECT v_trip_loc_count, v_driver_loc_count;
END;
$$;

-- Restrict execution to service_role and postgres
REVOKE ALL ON FUNCTION public.prune_stale_telemetry(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_stale_telemetry(INTEGER) TO service_role;

-- 5. Stored Procedure: Driver Anonymization (Right to Erasure compliance)
-- Scrub PII while retaining anonymized trip distances, durations, and financial ledgers for statutory audit
CREATE OR REPLACE FUNCTION public.anonymize_driver_account(p_driver_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_anon_code TEXT;
BEGIN
  -- Get user_id for the driver
  SELECT user_id INTO v_user_id
  FROM public.drivers
  WHERE id = p_driver_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  v_anon_code := 'ANON_' || substr(p_driver_id::text, 1, 8);

  -- 1. Anonymize driver record
  UPDATE public.drivers
  SET
    address_line = NULL,
    city = NULL,
    state = NULL,
    pincode = NULL,
    profile_photo_path = NULL,
    is_deleted = TRUE,
    availability_status = 'offline',
    anonymized_at = now(),
    updated_at = now()
  WHERE id = p_driver_id;

  -- 2. Anonymize user profile
  UPDATE public.profiles
  SET
    full_name = 'Anonymized Driver',
    phone_number = '+910000000000',
    email = NULL,
    account_status = 'suspended',
    updated_at = now()
  WHERE id = v_user_id;

  -- 3. Mask driving license document paths
  UPDATE public.driving_licenses
  SET
    license_number_masked = 'XXXX-XXXX-XXXX',
    front_file_path = 'anonymized/license_front.png',
    back_file_path = 'anonymized/license_back.png',
    updated_at = now()
  WHERE driver_id = p_driver_id;

  -- 4. Mask emergency contacts
  DELETE FROM public.emergency_contacts
  WHERE driver_id = p_driver_id;

  -- 5. Mask payout accounts details
  UPDATE public.payout_accounts
  SET
    upi_id = NULL,
    account_number_masked = 'XXXX-XXXX-XXXX',
    ifsc_code = 'XXXX0000000',
    beneficiary_name = 'Anonymized',
    provider_token = NULL,
    updated_at = now()
  WHERE driver_id = p_driver_id;

  -- 6. Mark deletion request as processed
  UPDATE public.account_deletion_requests
  SET
    status = 'processed',
    processed_at = now(),
    updated_at = now()
  WHERE driver_id = p_driver_id AND status = 'pending_grace_period';

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.anonymize_driver_account(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.anonymize_driver_account(UUID) TO service_role;

-- 6. Row Level Security Policies
ALTER TABLE public.driver_consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- driver_consent_logs RLS
CREATE POLICY "Drivers can view their own consent logs"
  ON public.driver_consent_logs
  FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can insert their own consent logs"
  ON public.driver_consent_logs
  FOR INSERT
  WITH CHECK (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to driver_consent_logs"
  ON public.driver_consent_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- account_deletion_requests RLS
CREATE POLICY "Drivers can view their own deletion requests"
  ON public.account_deletion_requests
  FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can request account deletion"
  ON public.account_deletion_requests
  FOR INSERT
  WITH CHECK (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can cancel pending deletion request"
  ON public.account_deletion_requests
  FOR UPDATE
  USING (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    status = 'cancelled'
  );

CREATE POLICY "Service role full access to account_deletion_requests"
  ON public.account_deletion_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
