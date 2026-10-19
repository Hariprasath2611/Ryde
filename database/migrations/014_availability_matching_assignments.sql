-- 014_availability_matching_assignments.sql
-- Phase 3: Driver Availability, Matching Engine, Assignment Expiries, and Atomic Accept Transactions

-- 1. Ensure booking_status and trip_status enums contain Phase 3 states
DO $$
BEGIN
  -- Add 'searching' to booking_status if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'searching'
      AND enumtypid = 'public.booking_status'::regtype
  ) THEN
    ALTER TYPE public.booking_status ADD VALUE 'searching';
  END IF;

  -- Add 'no_driver_found' to booking_status if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'no_driver_found'
      AND enumtypid = 'public.booking_status'::regtype
  ) THEN
    ALTER TYPE public.booking_status ADD VALUE 'no_driver_found';
  END IF;

  -- Add 'driver_assigned' to booking_status if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'driver_assigned'
      AND enumtypid = 'public.booking_status'::regtype
  ) THEN
    ALTER TYPE public.booking_status ADD VALUE 'driver_assigned';
  END IF;

  -- Add 'assigned' to trip_status if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'assigned'
      AND enumtypid = 'public.trip_status'::regtype
  ) THEN
    ALTER TYPE public.trip_status ADD VALUE 'assigned';
  END IF;
END $$;

-- 2. Add rejection_reason column to driver_assignments
ALTER TABLE public.driver_assignments
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Add partial index on trips for all active trip statuses including 'assigned'
DROP INDEX IF EXISTS public.idx_trips_driver_active;
CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_driver_active
  ON public.trips(driver_id)
  WHERE trip_status IN ('assigned', 'dispatched', 'arrived_at_pickup', 'vehicle_handover_pending', 'started');

-- 4. Add index for searching bookings for fast SKIP LOCKED pickups
CREATE INDEX IF NOT EXISTS idx_bookings_searching
  ON public.bookings(created_at ASC)
  WHERE booking_status = 'searching';

-- 5. Atomic function to accept assignment safely without race conditions
CREATE OR REPLACE FUNCTION public.accept_driver_assignment(
  p_assignment_id UUID,
  p_driver_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_assignment RECORD;
  v_booking RECORD;
  v_driver RECORD;
  v_active_trip RECORD;
  v_new_trip_id UUID;
  v_result jsonb;
BEGIN
  -- 1. Lock and fetch assignment
  SELECT * INTO v_assignment
  FROM public.driver_assignments
  WHERE id = p_assignment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ASSIGNMENT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_assignment.driver_id != p_driver_id THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ASSIGNMENT' USING ERRCODE = '42501';
  END IF;

  IF v_assignment.assignment_status != 'offered' THEN
    RAISE EXCEPTION 'ASSIGNMENT_NOT_OFFERED' USING ERRCODE = 'P0001';
  END IF;

  IF v_assignment.expires_at IS NOT NULL AND v_assignment.expires_at <= now() THEN
    -- Mark expired
    UPDATE public.driver_assignments
    SET assignment_status = 'expired', updated_at = now()
    WHERE id = p_assignment_id;

    RAISE EXCEPTION 'ASSIGNMENT_EXPIRED' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Lock and fetch booking
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = v_assignment.booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_booking.booking_status NOT IN ('searching', 'pending') THEN
    RAISE EXCEPTION 'BOOKING_ALREADY_ASSIGNED' USING ERRCODE = 'P0001';
  END IF;

  -- 3. Lock and fetch driver
  SELECT * INTO v_driver
  FROM public.drivers
  WHERE id = p_driver_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'DRIVER_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_driver.availability_status != 'online' THEN
    RAISE EXCEPTION 'DRIVER_NOT_ONLINE' USING ERRCODE = 'P0001';
  END IF;

  -- Check if driver already has an active trip
  SELECT id INTO v_active_trip
  FROM public.trips
  WHERE driver_id = p_driver_id
    AND trip_status IN ('assigned', 'dispatched', 'arrived_at_pickup', 'vehicle_handover_pending', 'started')
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'DRIVER_HAS_ACTIVE_TRIP' USING ERRCODE = 'P0001';
  END IF;

  -- 4. Perform atomic state transitions
  -- Update assignment
  UPDATE public.driver_assignments
  SET assignment_status = 'accepted', updated_at = now()
  WHERE id = p_assignment_id;

  -- Cancel other assignments for this booking
  UPDATE public.driver_assignments
  SET assignment_status = 'cancelled', updated_at = now()
  WHERE booking_id = v_booking.id
    AND id != p_assignment_id
    AND assignment_status = 'offered';

  -- Update booking
  UPDATE public.bookings
  SET booking_status = 'assigned', updated_at = now()
  WHERE id = v_booking.id;

  -- Create trip
  INSERT INTO public.trips (
    booking_id,
    customer_id,
    driver_id,
    vehicle_id,
    trip_status
  ) VALUES (
    v_booking.id,
    v_booking.customer_id,
    p_driver_id,
    v_booking.vehicle_id,
    'assigned'
  )
  RETURNING id INTO v_new_trip_id;

  -- Update driver availability to on_trip
  UPDATE public.drivers
  SET availability_status = 'on_trip', updated_at = now()
  WHERE id = p_driver_id;

  -- Build response
  SELECT jsonb_build_object(
    'trip_id', v_new_trip_id,
    'booking_id', v_booking.id,
    'driver_id', p_driver_id,
    'assignment_id', p_assignment_id,
    'status', 'accepted'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execution to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.accept_driver_assignment(UUID, UUID) TO authenticated, service_role;

-- 6. Enable Realtime on driver_assignments if publication exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'driver_assignments'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_assignments;
    END IF;
  END IF;
END $$;
