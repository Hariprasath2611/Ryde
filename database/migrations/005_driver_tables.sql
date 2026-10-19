-- 005_driver_tables.sql
-- Driver domain tables: drivers, driving_licenses, driver_locations

-- 9. drivers
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  driver_code TEXT NOT NULL UNIQUE,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  availability_status public.availability_status NOT NULL DEFAULT 'offline',
  allowed_vehicle_types public.vehicle_type[] NOT NULL DEFAULT '{}',
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (rating_avg >= 1.00 AND rating_avg <= 5.00),
  rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_verification_status ON public.drivers(verification_status);
CREATE INDEX IF NOT EXISTS idx_drivers_availability_status ON public.drivers(availability_status);
CREATE INDEX IF NOT EXISTS idx_drivers_approved_by ON public.drivers(approved_by);

DROP TRIGGER IF EXISTS trigger_drivers_updated_at ON public.drivers;
CREATE TRIGGER trigger_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 10. driving_licenses
CREATE TABLE IF NOT EXISTS public.driving_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL UNIQUE REFERENCES public.drivers(id) ON DELETE CASCADE,
  license_number_masked TEXT NOT NULL,
  license_classes public.vehicle_type[] NOT NULL,
  expiry_date DATE NOT NULL,
  file_path TEXT NOT NULL,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driving_licenses_driver_id ON public.driving_licenses(driver_id);
CREATE INDEX IF NOT EXISTS idx_driving_licenses_verification_status ON public.driving_licenses(verification_status);

DROP TRIGGER IF EXISTS trigger_driving_licenses_updated_at ON public.driving_licenses;
CREATE TRIGGER trigger_driving_licenses_updated_at
  BEFORE UPDATE ON public.driving_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 11. driver_locations (latest position only, used for matching)
CREATE TABLE IF NOT EXISTS public.driver_locations (
  driver_id UUID PRIMARY KEY REFERENCES public.drivers(id) ON DELETE CASCADE,
  location geography(Point, 4326) NOT NULL,
  heading NUMERIC(5,2),
  speed NUMERIC(6,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_locations_gist ON public.driver_locations USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_driver_locations_updated_at ON public.driver_locations(updated_at);

DROP TRIGGER IF EXISTS trigger_driver_locations_updated_at ON public.driver_locations;
CREATE TRIGGER trigger_driver_locations_updated_at
  BEFORE UPDATE ON public.driver_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
