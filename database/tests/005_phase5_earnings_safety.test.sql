-- database/tests/005_phase5_earnings_safety.test.sql
-- pgTAP tests for Phase 5 Earnings, Payout Accounts, Safety, and Ratings

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(8);

-- 1. Check settlement_status enum has 'settled'
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'settled'
      AND enumtypid = 'public.settlement_status'::regtype
  ),
  'settlement_status enum must have settled'
);

-- 2. Check payout_accounts table exists
SELECT has_table('public', 'payout_accounts', 'payout_accounts table must exist');

-- 3. Check payout_accounts required columns
SELECT columns_are(
  'public',
  'payout_accounts',
  ARRAY[
    'id',
    'driver_id',
    'account_type',
    'upi_id',
    'bank_name',
    'account_number_masked',
    'ifsc_code',
    'beneficiary_name',
    'provider_token',
    'is_default',
    'verification_status',
    'created_at',
    'updated_at'
  ],
  'payout_accounts must have all Phase 5 columns'
);

-- 4. Check trip_shares table exists
SELECT has_table('public', 'trip_shares', 'trip_shares table must exist');

-- 5. Check trip_shares required columns
SELECT columns_are(
  'public',
  'trip_shares',
  ARRAY[
    'id',
    'trip_id',
    'share_token',
    'expires_at',
    'created_at'
  ],
  'trip_shares must have all Phase 5 columns'
);

-- 6. Check sos_events has reverse_geocoded_address column
SELECT has_column('public', 'sos_events', 'reverse_geocoded_address', 'sos_events must have reverse_geocoded_address');

-- 7. Check trigger on ratings exists
SELECT has_trigger('public', 'ratings', 'trigger_ratings_update_driver', 'ratings must have update driver aggregates trigger');

-- 8. Check trigger on emergency_contacts exists
SELECT has_trigger('public', 'emergency_contacts', 'trigger_check_max_emergency_contacts', 'emergency_contacts must have max 5 check trigger');

SELECT * FROM finish();

ROLLBACK;
