-- 013_driver_onboarding_and_verification.sql
-- Phase 2: Driver Onboarding, Identity, License Document Verification, and Trigger Guards

-- 1. Create driver_onboarding_status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_onboarding_status') THEN
    CREATE TYPE public.driver_onboarding_status AS ENUM (
      'not_started',
      'in_progress',
      'submitted',
      'under_review',
      'approved',
      'rejected'
    );
  END IF;
END
$$;

-- 2. Add profile and onboarding columns to drivers
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS address_line TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(6),
  ADD COLUMN IF NOT EXISTS experience_years INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_photo_path TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_status public.driver_onboarding_status NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_drivers_onboarding_status ON public.drivers(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_drivers_submitted_at ON public.drivers(submitted_at);

-- Set existing approved drivers in seed/DB to approved onboarding status
UPDATE public.drivers
SET onboarding_status = 'approved'
WHERE verification_status = 'approved' AND onboarding_status = 'not_started';

-- 3. Add front and back document file paths to driving_licenses
ALTER TABLE public.driving_licenses
  ADD COLUMN IF NOT EXISTS front_file_path TEXT,
  ADD COLUMN IF NOT EXISTS back_file_path TEXT;

-- Drop NOT NULL on legacy file_path column if present to support front/back uploads
ALTER TABLE public.driving_licenses
  ALTER COLUMN file_path DROP NOT NULL;

-- Backfill front_file_path from file_path where missing
UPDATE public.driving_licenses
SET front_file_path = file_path
WHERE front_file_path IS NULL AND file_path IS NOT NULL;

-- 4. Update trigger guard for drivers table to strictly protect onboarding and review metadata
CREATE OR REPLACE FUNCTION public.guard_driver_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Service role and superusers bypass this guard
  IF auth.role() = 'service_role' OR current_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  -- Platform admins and support staff can review and alter statuses
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Regular drivers cannot alter their own onboarding status directly
  IF NEW.onboarding_status IS DISTINCT FROM OLD.onboarding_status THEN
    RAISE EXCEPTION 'Clients cannot alter driver onboarding status';
  END IF;

  -- Regular drivers cannot alter verification status directly
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    RAISE EXCEPTION 'Clients cannot alter driver verification status';
  END IF;

  -- Regular drivers cannot clear or fabricate rejection reasons
  IF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    RAISE EXCEPTION 'Clients cannot alter driver rejection reason';
  END IF;

  -- Regular drivers cannot alter submitted_at timestamp
  IF NEW.submitted_at IS DISTINCT FROM OLD.submitted_at THEN
    RAISE EXCEPTION 'Clients cannot alter driver submission timestamp';
  END IF;

  -- Regular drivers cannot modify approval metadata
  IF NEW.approved_by IS DISTINCT FROM OLD.approved_by OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'Clients cannot alter driver approval metadata';
  END IF;

  -- Regular drivers cannot modify rating metadata
  IF NEW.rating_avg IS DISTINCT FROM OLD.rating_avg OR NEW.rating_count IS DISTINCT FROM OLD.rating_count THEN
    RAISE EXCEPTION 'Clients cannot alter driver ratings directly';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_driver_updates ON public.drivers;
CREATE TRIGGER trigger_guard_driver_updates
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_driver_updates();

-- 5. RLS Policies: Allow drivers to update their own driving license details during onboarding
DROP POLICY IF EXISTS "driving_licenses_update_policy" ON public.driving_licenses;
CREATE POLICY "driving_licenses_update_policy" ON public.driving_licenses
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

-- Allow drivers to update their own identity documents during onboarding
DROP POLICY IF EXISTS "identity_documents_update_policy" ON public.identity_documents;
CREATE POLICY "identity_documents_update_policy" ON public.identity_documents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
