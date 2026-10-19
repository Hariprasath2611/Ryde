-- 006_booking_and_matching_tables.sql
-- Booking and matching domain tables: bookings, driver_assignments

-- 12. bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  pickup_location geography(Point, 4326) NOT NULL,
  pickup_address TEXT NOT NULL,
  destination_location geography(Point, 4326) NOT NULL,
  destination_address TEXT NOT NULL,
  booking_status public.booking_status NOT NULL DEFAULT 'pending',
  estimated_fare NUMERIC(10,2) NOT NULL CHECK (estimated_fare >= 0),
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON public.bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_gist ON public.bookings USING GIST (pickup_location);
CREATE INDEX IF NOT EXISTS idx_bookings_destination_gist ON public.bookings USING GIST (destination_location);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON public.bookings(scheduled_at);

DROP TRIGGER IF EXISTS trigger_bookings_updated_at ON public.bookings;
CREATE TRIGGER trigger_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 13. driver_assignments
CREATE TABLE IF NOT EXISTS public.driver_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  distance_to_customer_m NUMERIC(10,2),
  estimated_arrival_s INTEGER,
  assignment_status public.assignment_status NOT NULL DEFAULT 'offered',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_driver_assignments_booking_driver UNIQUE (booking_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_driver_assignments_booking_id ON public.driver_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_driver_id ON public.driver_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_status ON public.driver_assignments(assignment_status);

DROP TRIGGER IF EXISTS trigger_driver_assignments_updated_at ON public.driver_assignments;
CREATE TRIGGER trigger_driver_assignments_updated_at
  BEFORE UPDATE ON public.driver_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
