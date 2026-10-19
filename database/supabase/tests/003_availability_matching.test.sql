-- database/supabase/tests/003_availability_matching.test.sql
-- pgTAP tests for Phase 3 driver availability, matching, and atomic assignment acceptance

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(8);

-- ============================================================================
-- 1. COLUMN & TYPE EXISTENCE
-- ============================================================================
SELECT has_column('public', 'driver_assignments', 'rejection_reason', 'driver_assignments.rejection_reason column must exist');
SELECT has_function('public', 'accept_driver_assignment', ARRAY['uuid', 'uuid'], 'accept_driver_assignment function must exist');

-- Check booking_status enum values
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'searching'
      AND enumtypid = 'public.booking_status'::regtype
  ),
  'booking_status enum must have searching'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'no_driver_found'
      AND enumtypid = 'public.booking_status'::regtype
  ),
  'booking_status enum must have no_driver_found'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'driver_assigned'
      AND enumtypid = 'public.booking_status'::regtype
  ),
  'booking_status enum must have driver_assigned'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'assigned'
      AND enumtypid = 'public.trip_status'::regtype
  ),
  'trip_status enum must have assigned'
);

-- Check accept_driver_assignment error handling with non-existent assignment
SELECT throws_ok(
  $$SELECT public.accept_driver_assignment('00000000-0000-0000-0000-000000000000'::uuid, '00000000-0000-0000-0000-000000000001'::uuid)$$,
  'ASSIGNMENT_NOT_FOUND',
  'accept_driver_assignment throws ASSIGNMENT_NOT_FOUND for non-existent assignment'
);

-- Check spatial query function exists
SELECT has_function('public', 'nearest_available_drivers', ARRAY['double precision', 'double precision', 'double precision', 'public.vehicle_type', 'integer'], 'nearest_available_drivers function must exist');

SELECT * FROM finish();
ROLLBACK;
