-- 007_trip_and_safety_tables.sql
-- Trip and safety domain tables: trips, trip_otps, vehicle_handovers, handover_photos, trip_locations, sos_events

-- 14. trips
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  trip_status public.trip_status NOT NULL DEFAULT 'dispatched',
  distance_m NUMERIC(10,2),
  duration_s INTEGER,
  final_fare NUMERIC(10,2),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trips_booking_id ON public.trips(booking_id);
CREATE INDEX IF NOT EXISTS idx_trips_customer_id ON public.trips(customer_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(trip_status);

-- Partial unique index: a driver can have only one active trip at any time
CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_driver_active
  ON public.trips(driver_id)
  WHERE trip_status IN ('dispatched', 'arrived_at_pickup', 'vehicle_handover_pending', 'started');

DROP TRIGGER IF EXISTS trigger_trips_updated_at ON public.trips;
CREATE TRIGGER trigger_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 15. trip_otps (never store raw OTPs, only hashes)
CREATE TABLE IF NOT EXISTS public.trip_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL UNIQUE REFERENCES public.trips(id) ON DELETE CASCADE,
  otp_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_otps_trip_id ON public.trip_otps(trip_id);

DROP TRIGGER IF EXISTS trigger_trip_otps_updated_at ON public.trip_otps;
CREATE TRIGGER trigger_trip_otps_updated_at
  BEFORE UPDATE ON public.trip_otps
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 16. vehicle_handovers
CREATE TABLE IF NOT EXISTS public.vehicle_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL UNIQUE REFERENCES public.trips(id) ON DELETE CASCADE,
  odometer_before NUMERIC(10,2),
  odometer_after NUMERIC(10,2),
  fuel_level_before NUMERIC(5,2),
  fuel_level_after NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_handovers_trip_id ON public.vehicle_handovers(trip_id);

DROP TRIGGER IF EXISTS trigger_vehicle_handovers_updated_at ON public.vehicle_handovers;
CREATE TRIGGER trigger_vehicle_handovers_updated_at
  BEFORE UPDATE ON public.vehicle_handovers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 17. handover_photos
CREATE TABLE IF NOT EXISTS public.handover_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handover_id UUID NOT NULL REFERENCES public.vehicle_handovers(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_handover_photos_handover_id ON public.handover_photos(handover_id);

DROP TRIGGER IF EXISTS trigger_handover_photos_updated_at ON public.handover_photos;
CREATE TRIGGER trigger_handover_photos_updated_at
  BEFORE UPDATE ON public.handover_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 18. trip_locations (telemetry breadcrumbs during a trip)
CREATE TABLE IF NOT EXISTS public.trip_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  location geography(Point, 4326) NOT NULL,
  speed NUMERIC(6,2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_locations_trip_recorded ON public.trip_locations(trip_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_trip_locations_driver_id ON public.trip_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_locations_gist ON public.trip_locations USING GIST (location);

-- 19. sos_events
CREATE TABLE IF NOT EXISTS public.sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  triggered_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location geography(Point, 4326),
  sos_status public.sos_status NOT NULL DEFAULT 'triggered',
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sos_events_trip_id ON public.sos_events(trip_id);
CREATE INDEX IF NOT EXISTS idx_sos_events_triggered_by ON public.sos_events(triggered_by);
CREATE INDEX IF NOT EXISTS idx_sos_events_status ON public.sos_events(sos_status);
CREATE INDEX IF NOT EXISTS idx_sos_events_gist ON public.sos_events USING GIST (location);

DROP TRIGGER IF EXISTS trigger_sos_events_updated_at ON public.sos_events;
CREATE TRIGGER trigger_sos_events_updated_at
  BEFORE UPDATE ON public.sos_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
