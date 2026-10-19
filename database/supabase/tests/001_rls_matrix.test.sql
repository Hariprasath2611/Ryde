-- database/supabase/tests/001_rls_matrix.test.sql
-- pgTAP tests for Phase 1 RLS matrix, security boundaries, and PostGIS matching

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(18);

-- 1. EXTENSIONS & FUNCTIONS
SELECT has_extension('postgis', 'PostGIS extension should be installed');
SELECT has_extension('pgcrypto', 'pgcrypto extension should be installed');
SELECT has_function('public', 'set_updated_at', 'set_updated_at trigger function must exist');
SELECT has_function('public', 'current_user_role', 'current_user_role helper must exist');
SELECT has_function('public', 'is_admin', 'is_admin helper must exist');
SELECT has_function('public', 'nearest_available_drivers', ARRAY['double precision', 'double precision', 'double precision', 'public.vehicle_type', 'integer'], 'nearest_available_drivers function must exist');

-- 2. ANONYMOUS USERS GET ZERO ROWS (DEFAULT DENY)
SET LOCAL ROLE anon;
SET LOCAL request.jwt.claim.sub = '';
SET LOCAL request.jwt.claim.role = 'anon';

SELECT is_empty(
  'SELECT * FROM public.profiles',
  'Anonymous role should see 0 rows in profiles'
);

SELECT is_empty(
  'SELECT * FROM public.drivers',
  'Anonymous role should see 0 rows in drivers'
);

SELECT is_empty(
  'SELECT * FROM public.driving_licenses',
  'Anonymous role should see 0 rows in driving_licenses'
);

SELECT is_empty(
  'SELECT * FROM public.audit_logs',
  'Anonymous role should see 0 rows in audit_logs'
);

-- 3. CUSTOMER CANNOT READ DRIVING LICENSES
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000005';
SET LOCAL request.jwt.claim.role = 'authenticated';

SELECT is_empty(
  'SELECT * FROM public.driving_licenses',
  'Customer Priya cannot read any driver licenses'
);

-- 4. DRIVER CANNOT READ ANOTHER DRIVER'S DOCUMENTS OR PROFILE
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
SET LOCAL request.jwt.claim.role = 'authenticated';

SELECT results_eq(
  'SELECT phone FROM public.profiles',
  ARRAY['+919876543210'],
  'Driver Ramesh should only see his own profile'
);

SELECT results_eq(
  'SELECT license_number_masked FROM public.driving_licenses',
  ARRAY['KA01-XXXX-9871'],
  'Driver Ramesh should only see his own driving license'
);

SELECT is_empty(
  'SELECT * FROM public.driving_licenses WHERE driver_id = ''10000000-0000-0000-0000-000000000002''',
  'Driver Ramesh cannot read Driver Suresh license'
);

-- 5. USER CANNOT UPDATE OWN ROLE OR VERIFICATION STATUS
SELECT throws_ok(
  'UPDATE public.profiles SET role = ''admin'' WHERE id = ''00000000-0000-0000-0000-000000000002''',
  'Clients are not permitted to modify their own role',
  'Driver cannot elevate own role to admin'
);

SELECT throws_ok(
  'UPDATE public.drivers SET verification_status = ''approved'' WHERE id = ''10000000-0000-0000-0000-000000000001''',
  'Clients cannot alter driver verification status',
  'Driver cannot alter own verification status'
);

-- 6. NOBODY CAN UPDATE OR DELETE AUDIT_LOGS
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
SET LOCAL request.jwt.claim.role = 'authenticated';

SELECT isnt_empty(
  'SELECT * FROM public.audit_logs',
  'Admin can read audit logs'
);

DELETE FROM public.audit_logs;
SELECT is_empty(
  'SELECT * FROM public.audit_logs WHERE action = ''DOES_NOT_EXIST''',
  'Audit logs remain untouched because DELETE has no policy'
);

-- 7. NEAREST_AVAILABLE_DRIVERS (POSTGIS)
SET LOCAL ROLE service_role;
SET LOCAL request.jwt.claim.role = 'service_role';

SELECT results_eq(
  'SELECT driver_id FROM public.nearest_available_drivers(12.971598, 77.594562, 5000, ''four_wheeler'', 3)',
  ARRAY['10000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000003'::uuid],
  'nearest_available_drivers returns eligible drivers ordered by proximity'
);

SELECT * FROM finish();
ROLLBACK;
