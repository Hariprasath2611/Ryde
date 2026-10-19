-- 010_functions.sql
-- Database helper functions, security definer role helpers, privilege elevation guards, and spatial matching

-- 1. current_user_role()
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'support')
  );
$$;

-- 3. Trigger guards: Prevent clients from mutating role, account_status, or verification_status
CREATE OR REPLACE FUNCTION public.guard_profile_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Service role and DB admins bypass this guard
  IF auth.role() = 'service_role' OR current_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  -- Admins can update roles and statuses
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Regular users cannot alter their role or account_status
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Clients are not permitted to modify their own role';
  END IF;

  IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
    RAISE EXCEPTION 'Clients are not permitted to modify their account status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_profile_updates ON public.profiles;
CREATE TRIGGER trigger_guard_profile_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_updates();

CREATE OR REPLACE FUNCTION public.guard_driver_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.role() = 'service_role' OR current_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    RAISE EXCEPTION 'Clients cannot alter driver verification status';
  END IF;

  IF NEW.approved_by IS DISTINCT FROM OLD.approved_by OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'Clients cannot alter driver approval metadata';
  END IF;

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

CREATE OR REPLACE FUNCTION public.guard_verification_status_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.role() = 'service_role' OR current_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    RAISE EXCEPTION 'Clients cannot modify verification status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_identity_doc_status ON public.identity_documents;
CREATE TRIGGER trigger_guard_identity_doc_status
  BEFORE UPDATE ON public.identity_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_verification_status_updates();

DROP TRIGGER IF EXISTS trigger_guard_driving_license_status ON public.driving_licenses;
CREATE TRIGGER trigger_guard_driving_license_status
  BEFORE UPDATE ON public.driving_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_verification_status_updates();

DROP TRIGGER IF EXISTS trigger_guard_vehicle_status ON public.vehicles;
CREATE TRIGGER trigger_guard_vehicle_status
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_verification_status_updates();

DROP TRIGGER IF EXISTS trigger_guard_vehicle_doc_status ON public.vehicle_documents;
CREATE TRIGGER trigger_guard_vehicle_doc_status
  BEFORE UPDATE ON public.vehicle_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_verification_status_updates();

-- 4. nearest_available_drivers()
-- PostGIS spatial query: approved, online, allowed vehicle type, updated in last 10 mins
CREATE OR REPLACE FUNCTION public.nearest_available_drivers(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_m DOUBLE PRECISION,
  p_vehicle_type public.vehicle_type,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  driver_id UUID,
  distance_m DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    d.id AS driver_id,
    ST_Distance(
      dl.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) AS distance_m
  FROM public.drivers d
  INNER JOIN public.driver_locations dl ON dl.driver_id = d.id
  WHERE d.verification_status = 'approved'
    AND d.availability_status = 'online'
    AND p_vehicle_type = ANY(d.allowed_vehicle_types)
    AND dl.updated_at >= (now() - INTERVAL '10 minutes')
    AND ST_DWithin(
      dl.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_m
    )
  ORDER BY distance_m ASC
  LIMIT LEAST(GREATEST(max_results, 1), 100);
$$;

-- Restrict nearest_available_drivers to service_role only
REVOKE ALL ON FUNCTION public.nearest_available_drivers(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, public.vehicle_type, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nearest_available_drivers(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, public.vehicle_type, INTEGER) TO service_role;
