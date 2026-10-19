-- database/tests/006_phase6_security_rls.test.sql
-- pgTAP tests for Phase 6 Security Hardening, DPDP Act Tables, Anonymization, and Retention

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(9);

-- 1. Check driver_consent_logs table exists
SELECT has_table('public', 'driver_consent_logs', 'driver_consent_logs table must exist');

-- 2. Check driver_consent_logs columns
SELECT columns_are(
  'public',
  'driver_consent_logs',
  ARRAY[
    'id',
    'driver_id',
    'purpose',
    'consent_version',
    'ip_address',
    'user_agent',
    'is_granted',
    'consented_at',
    'withdrawn_at',
    'created_at'
  ],
  'driver_consent_logs must have all DPDP consent tracking columns'
);

-- 3. Check account_deletion_requests table exists
SELECT has_table('public', 'account_deletion_requests', 'account_deletion_requests table must exist');

-- 4. Check account_deletion_requests columns
SELECT columns_are(
  'public',
  'account_deletion_requests',
  ARRAY[
    'id',
    'driver_id',
    'reason',
    'requested_at',
    'scheduled_deletion_at',
    'status',
    'processed_at',
    'created_at',
    'updated_at'
  ],
  'account_deletion_requests must have all erasure and grace period columns'
);

-- 5. Check drivers has deletion and anonymization columns
SELECT has_column('public', 'drivers', 'is_deleted', 'drivers must have is_deleted column');
SELECT has_column('public', 'drivers', 'anonymized_at', 'drivers must have anonymized_at column');

-- 6. Check function prune_stale_telemetry exists
SELECT has_function('public', 'prune_stale_telemetry', ARRAY['integer'], 'prune_stale_telemetry function must exist');

-- 7. Check function anonymize_driver_account exists
SELECT has_function('public', 'anonymize_driver_account', ARRAY['uuid'], 'anonymize_driver_account function must exist');

-- 8. Check RLS is enabled on driver_consent_logs and account_deletion_requests
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'driver_consent_logs'),
  'driver_consent_logs must have RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'account_deletion_requests'),
  'account_deletion_requests must have RLS enabled'
);

SELECT * FROM finish();

ROLLBACK;
