-- database/tests/002_driver_onboarding.test.sql
-- pgTAP tests for Phase 2 driver onboarding columns, RLS, and trigger protection matrix

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(13);

-- ============================================================================
-- 1. COLUMN & TYPE EXISTENCE
-- ============================================================================
SELECT has_type('public', 'driver_onboarding_status', 'driver_onboarding_status enum type must exist');

SELECT has_column('public', 'drivers', 'date_of_birth', 'drivers.date_of_birth column must exist');
SELECT has_column('public', 'drivers', 'address_line', 'drivers.address_line column must exist');
SELECT has_column('public', 'drivers', 'city', 'drivers.city column must exist');
SELECT has_column('public', 'drivers', 'pincode', 'drivers.pincode column must exist');
SELECT has_column('public', 'drivers', 'onboarding_status', 'drivers.onboarding_status column must exist');
SELECT has_column('public', 'drivers', 'rejection_reason', 'drivers.rejection_reason column must exist');
SELECT has_column('public', 'drivers', 'submitted_at', 'drivers.submitted_at column must exist');

SELECT has_column('public', 'driving_licenses', 'front_file_path', 'driving_licenses.front_file_path column must exist');
SELECT has_column('public', 'driving_licenses', 'back_file_path', 'driving_licenses.back_file_path column must exist');

-- ============================================================================
-- 2. DRIVER CAN UPDATE PROFILE FIELDS BUT NOT REVIEW/STATUS METADATA
-- ============================================================================
-- Act as Driver Ramesh (00000000-0000-0000-0000-000000000002, driver id: 10000000-0000-0000-0000-000000000001)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
SET LOCAL request.jwt.claim.role = 'authenticated';

-- Driver can update their own personal details
SELECT lives_ok(
  $$UPDATE public.drivers SET city = 'Bengaluru', pincode = '560001', experience_years = 5 WHERE user_id = '00000000-0000-0000-0000-000000000002'$$,
  'Driver can update their own profile fields'
);

-- Driver CANNOT alter onboarding_status directly
SELECT throws_ok(
  $$UPDATE public.drivers SET onboarding_status = 'approved' WHERE user_id = '00000000-0000-0000-0000-000000000002'$$,
  'Clients cannot alter driver onboarding status',
  'Driver cannot alter own onboarding status directly'
);

-- Driver CANNOT alter rejection_reason directly
SELECT throws_ok(
  $$UPDATE public.drivers SET rejection_reason = 'Falsified Reason' WHERE user_id = '00000000-0000-0000-0000-000000000002'$$,
  'Clients cannot alter driver rejection reason',
  'Driver cannot alter own rejection reason directly'
);

SELECT * FROM finish();
ROLLBACK;
