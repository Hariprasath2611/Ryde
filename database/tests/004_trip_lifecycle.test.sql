-- database/tests/004_trip_lifecycle.test.sql
-- pgTAP tests for Phase 4 Trip Lifecycle, Fare Rules, and State Machine functions

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(10);

-- 1. Check trip_status enum values
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'heading_to_pickup'
      AND enumtypid = 'public.trip_status'::regtype
  ),
  'trip_status enum must have heading_to_pickup'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'arrived'
      AND enumtypid = 'public.trip_status'::regtype
  ),
  'trip_status enum must have arrived'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'otp_verified'
      AND enumtypid = 'public.trip_status'::regtype
  ),
  'trip_status enum must have otp_verified'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'handover_done'
      AND enumtypid = 'public.trip_status'::regtype
  ),
  'trip_status enum must have handover_done'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'in_progress'
      AND enumtypid = 'public.trip_status'::regtype
  ),
  'trip_status enum must have in_progress'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'cancelled_by_driver'
      AND enumtypid = 'public.trip_status'::regtype
  ),
  'trip_status enum must have cancelled_by_driver'
);

-- 2. Check table existence
SELECT has_table('public', 'fare_rules', 'fare_rules table must exist');
SELECT has_table('public', 'trip_otp_outbox', 'trip_otp_outbox table must exist');
SELECT has_table('public', 'idempotency_keys', 'idempotency_keys table must exist');

-- 3. Check function existence
SELECT has_function(
  'public',
  'cancel_stale_waiting_trips',
  ARRAY['integer'],
  'cancel_stale_waiting_trips function must exist'
);

SELECT * FROM finish();
ROLLBACK;
