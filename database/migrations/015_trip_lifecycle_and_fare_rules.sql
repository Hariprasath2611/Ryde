-- 015_trip_lifecycle_and_fare_rules.sql
-- Phase 4: Full Trip Lifecycle, State Machine, OTP Outbox, Fare Rules & Handover Verification

-- 1. Ensure trip_status enum contains all Phase 4 states
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'heading_to_pickup' AND enumtypid = 'public.trip_status'::regtype) THEN
    ALTER TYPE public.trip_status ADD VALUE 'heading_to_pickup';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'arrived' AND enumtypid = 'public.trip_status'::regtype) THEN
    ALTER TYPE public.trip_status ADD VALUE 'arrived';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'otp_verified' AND enumtypid = 'public.trip_status'::regtype) THEN
    ALTER TYPE public.trip_status ADD VALUE 'otp_verified';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'handover_done' AND enumtypid = 'public.trip_status'::regtype) THEN
    ALTER TYPE public.trip_status ADD VALUE 'handover_done';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'in_progress' AND enumtypid = 'public.trip_status'::regtype) THEN
    ALTER TYPE public.trip_status ADD VALUE 'in_progress';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cancelled_by_driver' AND enumtypid = 'public.trip_status'::regtype) THEN
    ALTER TYPE public.trip_status ADD VALUE 'cancelled_by_driver';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cancelled_by_customer' AND enumtypid = 'public.trip_status'::regtype) THEN
    ALTER TYPE public.trip_status ADD VALUE 'cancelled_by_customer';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cancelled_by_system' AND enumtypid = 'public.trip_status'::regtype) THEN
    ALTER TYPE public.trip_status ADD VALUE 'cancelled_by_system';
  END IF;
END $$;

-- 2. Update partial unique index on trips for all active trip statuses
DROP INDEX IF EXISTS public.idx_trips_driver_active;
CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_driver_active
  ON public.trips(driver_id)
  WHERE trip_status IN (
    'assigned',
    'heading_to_pickup',
    'arrived',
    'otp_verified',
    'handover_done',
    'in_progress',
    'dispatched',
    'arrived_at_pickup',
    'vehicle_handover_pending',
    'started'
  );

-- 3. Extend trips table with lifecycle metadata
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS waiting_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS waiting_duration_s INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS flagged_for_audit BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS audit_reason TEXT,
  ADD COLUMN IF NOT EXISTS actual_distance_m NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS estimated_distance_m NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS actual_duration_s INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_duration_s INTEGER;

-- 4. Extend trip_otps table with attempts and cooldown tracking
ALTER TABLE public.trip_otps
  ALTER COLUMN max_attempts SET DEFAULT 5;

ALTER TABLE public.trip_otps
  ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS locked_out_at TIMESTAMPTZ;

-- 5. Extend vehicle_handovers with damage and return notes
ALTER TABLE public.vehicle_handovers
  ADD COLUMN IF NOT EXISTS existing_damage_notes TEXT,
  ADD COLUMN IF NOT EXISTS return_notes TEXT,
  ADD COLUMN IF NOT EXISTS handover_type TEXT DEFAULT 'pickup';

-- 6. Create fare_rules table
CREATE TABLE IF NOT EXISTS public.fare_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type public.vehicle_type NOT NULL UNIQUE,
  base_fare NUMERIC(10,2) NOT NULL CHECK (base_fare >= 0),
  per_km_rate NUMERIC(10,2) NOT NULL CHECK (per_km_rate >= 0),
  per_minute_rate NUMERIC(10,2) NOT NULL CHECK (per_minute_rate >= 0),
  free_waiting_minutes INTEGER NOT NULL DEFAULT 5 CHECK (free_waiting_minutes >= 0),
  waiting_charge_per_minute NUMERIC(10,2) NOT NULL DEFAULT 2.0 CHECK (waiting_charge_per_minute >= 0),
  platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 15.0 CHECK (platform_fee_percent >= 0 AND platform_fee_percent <= 100),
  tax_percent NUMERIC(5,2) NOT NULL DEFAULT 5.0 CHECK (tax_percent >= 0 AND tax_percent <= 100),
  minimum_fare NUMERIC(10,2) NOT NULL CHECK (minimum_fare >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fare_rules_vehicle_type ON public.fare_rules(vehicle_type);

DROP TRIGGER IF EXISTS trigger_fare_rules_updated_at ON public.fare_rules;
CREATE TRIGGER trigger_fare_rules_updated_at
  BEFORE UPDATE ON public.fare_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Seed fare rules for India platform
INSERT INTO public.fare_rules (
  vehicle_type,
  base_fare,
  per_km_rate,
  per_minute_rate,
  free_waiting_minutes,
  waiting_charge_per_minute,
  platform_fee_percent,
  tax_percent,
  minimum_fare
) VALUES
  ('two_wheeler', 30.00, 8.00, 1.00, 5, 1.50, 15.00, 5.00, 40.00),
  ('three_wheeler', 45.00, 12.00, 1.50, 5, 2.00, 15.00, 5.00, 60.00),
  ('four_wheeler', 80.00, 16.00, 2.00, 5, 3.00, 15.00, 5.00, 100.00)
ON CONFLICT (vehicle_type) DO UPDATE SET
  base_fare = EXCLUDED.base_fare,
  per_km_rate = EXCLUDED.per_km_rate,
  per_minute_rate = EXCLUDED.per_minute_rate,
  free_waiting_minutes = EXCLUDED.free_waiting_minutes,
  waiting_charge_per_minute = EXCLUDED.waiting_charge_per_minute,
  platform_fee_percent = EXCLUDED.platform_fee_percent,
  tax_percent = EXCLUDED.tax_percent,
  minimum_fare = EXCLUDED.minimum_fare,
  updated_at = now();

-- 7. Dev-only trip OTP outbox table (for simulator pickup)
CREATE TABLE IF NOT EXISTS public.trip_otp_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_otp_outbox_trip_id ON public.trip_otp_outbox(trip_id);

-- 8. Idempotency keys storage table
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT PRIMARY KEY,
  target_resource TEXT NOT NULL,
  response_status INTEGER NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON public.idempotency_keys(created_at);

-- 9. Row Level Security policies
ALTER TABLE public.fare_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_otp_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- fare_rules: readable by all authenticated users
DROP POLICY IF EXISTS "fare_rules_read_authenticated" ON public.fare_rules;
CREATE POLICY "fare_rules_read_authenticated"
  ON public.fare_rules
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "fare_rules_service_role_all" ON public.fare_rules;
CREATE POLICY "fare_rules_service_role_all"
  ON public.fare_rules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- trip_otp_outbox: restricted exclusively to service_role (simulator CLI)
DROP POLICY IF EXISTS "trip_otp_outbox_service_role_all" ON public.trip_otp_outbox;
CREATE POLICY "trip_otp_outbox_service_role_all"
  ON public.trip_otp_outbox
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- idempotency_keys: service_role full management
DROP POLICY IF EXISTS "idempotency_keys_service_role_all" ON public.idempotency_keys;
CREATE POLICY "idempotency_keys_service_role_all"
  ON public.idempotency_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 10. Automated Customer No-Show Stale Trip Cancel Function
CREATE OR REPLACE FUNCTION public.cancel_stale_waiting_trips(p_waiting_timeout_minutes INTEGER DEFAULT 10)
RETURNS TABLE (
  cancelled_trip_id UUID,
  driver_id UUID,
  booking_id UUID
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH timed_out AS (
    UPDATE public.trips t
    SET
      trip_status = 'cancelled_by_system',
      cancellation_reason = 'Customer no-show: exceeded maximum waiting time of ' || p_waiting_timeout_minutes || ' minutes',
      ended_at = now(),
      updated_at = now()
    FROM public.drivers d
    WHERE t.driver_id = d.id
      AND t.trip_status = 'arrived'
      AND t.waiting_started_at IS NOT NULL
      AND t.waiting_started_at <= now() - (p_waiting_timeout_minutes || ' minutes')::interval
    RETURNING t.id AS trip_id, t.driver_id AS trip_driver_id, t.booking_id AS trip_booking_id
  ),
  updated_drivers AS (
    UPDATE public.drivers d
    SET
      availability_status = 'online',
      updated_at = now()
    FROM timed_out to_trips
    WHERE d.id = to_trips.trip_driver_id
  ),
  updated_bookings AS (
    UPDATE public.bookings b
    SET
      booking_status = 'cancelled',
      updated_at = now()
    FROM timed_out to_trips
    WHERE b.id = to_trips.trip_booking_id
  )
  SELECT trip_id, trip_driver_id, trip_booking_id FROM timed_out;
END;
$$;
