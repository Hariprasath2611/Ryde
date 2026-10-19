-- ========================================================
-- RYDE PLATFORM: COMPLETE CONSOLIDATED DATABASE MIGRATION
-- Phases 0 through 6 (Schema, RLS, Functions, Triggers)
-- ========================================================


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 001_extensions_and_helpers.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- 001_extensions_and_helpers.sql
-- Enables core extensions and creates shared helper functions

-- Extensions
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Function: set_updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 002_enums.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- 002_enums.sql
-- Creates all 12 domain enums for the Ryde Platform, kept in sync with @ryde/shared constants

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('driver', 'customer', 'admin', 'support');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE public.account_status AS ENUM ('active', 'suspended', 'deleted');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_type') THEN
    CREATE TYPE public.vehicle_type AS ENUM ('two_wheeler', 'three_wheeler', 'four_wheeler');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_status') THEN
    CREATE TYPE public.availability_status AS ENUM ('offline', 'online', 'on_trip');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE public.booking_status AS ENUM ('pending', 'assigned', 'driver_arrived', 'in_progress', 'completed', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_status') THEN
    CREATE TYPE public.assignment_status AS ENUM ('offered', 'accepted', 'rejected', 'expired', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_status') THEN
    CREATE TYPE public.trip_status AS ENUM ('dispatched', 'arrived_at_pickup', 'vehicle_handover_pending', 'started', 'completed', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'settlement_status') THEN
    CREATE TYPE public.settlement_status AS ENUM ('pending', 'processed', 'failed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sos_status') THEN
    CREATE TYPE public.sos_status AS ENUM ('triggered', 'acknowledged', 'resolved', 'false_alarm');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'complaint_status') THEN
    CREATE TYPE public.complaint_status AS ENUM ('filed', 'under_investigation', 'resolved', 'dismissed');
  END IF;
END
$$;



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 003_identity_tables.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- 003_identity_tables.sql
-- Identity domain tables: profiles, identity_documents, emergency_contacts, payment_accounts, device_tokens

-- 1. profiles (1-to-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  email TEXT,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'customer',
  account_status public.account_status NOT NULL DEFAULT 'active',
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2. identity_documents
CREATE TABLE IF NOT EXISTS public.identity_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  masked_reference TEXT NOT NULL,
  file_path TEXT NOT NULL,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_identity_documents_user_id ON public.identity_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_documents_reviewed_by ON public.identity_documents(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_identity_documents_verification_status ON public.identity_documents(verification_status);

DROP TRIGGER IF EXISTS trigger_identity_documents_updated_at ON public.identity_documents;
CREATE TRIGGER trigger_identity_documents_updated_at
  BEFORE UPDATE ON public.identity_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3. emergency_contacts
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);

DROP TRIGGER IF EXISTS trigger_emergency_contacts_updated_at ON public.emergency_contacts;
CREATE TRIGGER trigger_emergency_contacts_updated_at
  BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. payment_accounts (token-only references, never raw card numbers)
CREATE TABLE IF NOT EXISTS public.payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  payment_reference TEXT NOT NULL,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_accounts_user_id ON public.payment_accounts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_accounts_user_default
  ON public.payment_accounts(user_id)
  WHERE (is_default = true);

DROP TRIGGER IF EXISTS trigger_payment_accounts_updated_at ON public.payment_accounts;
CREATE TRIGGER trigger_payment_accounts_updated_at
  BEFORE UPDATE ON public.payment_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 5. device_tokens
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_device_tokens_user_token UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);

DROP TRIGGER IF EXISTS trigger_device_tokens_updated_at ON public.device_tokens;
CREATE TRIGGER trigger_device_tokens_updated_at
  BEFORE UPDATE ON public.device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 004_customer_and_vehicle_tables.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- 004_customer_and_vehicle_tables.sql
-- Customer and vehicle domain tables: customers, vehicles, vehicle_documents

-- 6. customers
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_code TEXT NOT NULL UNIQUE,
  verification_status public.verification_status NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_verification_status ON public.customers(verification_status);

DROP TRIGGER IF EXISTS trigger_customers_updated_at ON public.customers;
CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 7. vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  vehicle_code TEXT NOT NULL UNIQUE,
  registration_number TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  vehicle_type public.vehicle_type NOT NULL,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON public.vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type ON public.vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_verification_status ON public.vehicles(verification_status);

DROP TRIGGER IF EXISTS trigger_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER trigger_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 8. vehicle_documents
CREATE TABLE IF NOT EXISTS public.vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id ON public.vehicle_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_verification_status ON public.vehicle_documents(verification_status);

DROP TRIGGER IF EXISTS trigger_vehicle_documents_updated_at ON public.vehicle_documents;
CREATE TRIGGER trigger_vehicle_documents_updated_at
  BEFORE UPDATE ON public.vehicle_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 005_driver_tables.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- 005_driver_tables.sql
-- Driver domain tables: drivers, driving_licenses, driver_locations

-- 9. drivers
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  driver_code TEXT NOT NULL UNIQUE,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  availability_status public.availability_status NOT NULL DEFAULT 'offline',
  allowed_vehicle_types public.vehicle_type[] NOT NULL DEFAULT '{}',
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (rating_avg >= 1.00 AND rating_avg <= 5.00),
  rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_verification_status ON public.drivers(verification_status);
CREATE INDEX IF NOT EXISTS idx_drivers_availability_status ON public.drivers(availability_status);
CREATE INDEX IF NOT EXISTS idx_drivers_approved_by ON public.drivers(approved_by);

DROP TRIGGER IF EXISTS trigger_drivers_updated_at ON public.drivers;
CREATE TRIGGER trigger_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 10. driving_licenses
CREATE TABLE IF NOT EXISTS public.driving_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL UNIQUE REFERENCES public.drivers(id) ON DELETE CASCADE,
  license_number_masked TEXT NOT NULL,
  license_classes public.vehicle_type[] NOT NULL,
  expiry_date DATE NOT NULL,
  file_path TEXT NOT NULL,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driving_licenses_driver_id ON public.driving_licenses(driver_id);
CREATE INDEX IF NOT EXISTS idx_driving_licenses_verification_status ON public.driving_licenses(verification_status);

DROP TRIGGER IF EXISTS trigger_driving_licenses_updated_at ON public.driving_licenses;
CREATE TRIGGER trigger_driving_licenses_updated_at
  BEFORE UPDATE ON public.driving_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 11. driver_locations (latest position only, used for matching)
CREATE TABLE IF NOT EXISTS public.driver_locations (
  driver_id UUID PRIMARY KEY REFERENCES public.drivers(id) ON DELETE CASCADE,
  location geography(Point, 4326) NOT NULL,
  heading NUMERIC(5,2),
  speed NUMERIC(6,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_locations_gist ON public.driver_locations USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_driver_locations_updated_at ON public.driver_locations(updated_at);

DROP TRIGGER IF EXISTS trigger_driver_locations_updated_at ON public.driver_locations;
CREATE TRIGGER trigger_driver_locations_updated_at
  BEFORE UPDATE ON public.driver_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 006_booking_and_matching_tables.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 007_trip_and_safety_tables.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 008_money_tables.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- 008_money_tables.sql
-- Money domain tables: fares, payments, driver_earnings

-- 20. fares
CREATE TABLE IF NOT EXISTS public.fares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL UNIQUE REFERENCES public.trips(id) ON DELETE CASCADE,
  base_fare NUMERIC(10,2) NOT NULL DEFAULT 0,
  distance_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  time_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  waiting_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fares_trip_id ON public.fares(trip_id);

DROP TRIGGER IF EXISTS trigger_fares_updated_at ON public.fares;
CREATE TRIGGER trigger_fares_updated_at
  BEFORE UPDATE ON public.fares
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 21. payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  gateway_transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_trip_id ON public.payments(trip_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);

DROP TRIGGER IF EXISTS trigger_payments_updated_at ON public.payments;
CREATE TRIGGER trigger_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 22. driver_earnings
CREATE TABLE IF NOT EXISTS public.driver_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL UNIQUE REFERENCES public.trips(id) ON DELETE RESTRICT,
  gross_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  settlement_status public.settlement_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver_id ON public.driver_earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_trip_id ON public.driver_earnings(trip_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_status ON public.driver_earnings(settlement_status);

DROP TRIGGER IF EXISTS trigger_driver_earnings_updated_at ON public.driver_earnings;
CREATE TRIGGER trigger_driver_earnings_updated_at
  BEFORE UPDATE ON public.driver_earnings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 009_communication_and_audit_tables.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- 009_communication_and_audit_tables.sql
-- Communication and audit domain tables: ratings, complaints, notifications, audit_logs

-- 23. ratings
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_ratings_trip_from_user UNIQUE (trip_id, from_user_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_trip_id ON public.ratings(trip_id);
CREATE INDEX IF NOT EXISTS idx_ratings_from_user_id ON public.ratings(from_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_to_user_id ON public.ratings(to_user_id);

DROP TRIGGER IF EXISTS trigger_ratings_updated_at ON public.ratings;
CREATE TRIGGER trigger_ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 24. complaints
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  complaint_type TEXT NOT NULL,
  description TEXT NOT NULL,
  complaint_status public.complaint_status NOT NULL DEFAULT 'filed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_complaints_trip_id ON public.complaints(trip_id);
CREATE INDEX IF NOT EXISTS idx_complaints_reported_by ON public.complaints(reported_by);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(complaint_status);

DROP TRIGGER IF EXISTS trigger_complaints_updated_at ON public.complaints;
CREATE TRIGGER trigger_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 25. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON public.notifications;
CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 26. audit_logs (append-only: no update, no delete)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 010_functions.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- 010_functions.sql
-- Database helper functions, security definer role helpers, privilege elevation guards, and spatial matching

-- 1. current_user_role()
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'support')
  );
$$;

-- 3. Trigger guards: Prevent clients from mutating role, account_status, or verification_status
CREATE OR REPLACE FUNCTION public.guard_profile_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Service role and DB admins bypass this guard
  IF auth.role() = 'service_role' OR current_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  -- Admins can update roles and statuses
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Regular users cannot alter their role or account_status
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Clients are not permitted to modify their own role';
  END IF;

  IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
    RAISE EXCEPTION 'Clients are not permitted to modify their account status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_profile_updates ON public.profiles;
CREATE TRIGGER trigger_guard_profile_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_updates();

CREATE OR REPLACE FUNCTION public.guard_driver_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.role() = 'service_role' OR current_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    RAISE EXCEPTION 'Clients cannot alter driver verification status';
  END IF;

  IF NEW.approved_by IS DISTINCT FROM OLD.approved_by OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'Clients cannot alter driver approval metadata';
  END IF;

  IF NEW.rating_avg IS DISTINCT FROM OLD.rating_avg OR NEW.rating_count IS DISTINCT FROM OLD.rating_count THEN
    RAISE EXCEPTION 'Clients cannot alter driver ratings directly';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_driver_updates ON public.drivers;
CREATE TRIGGER trigger_guard_driver_updates
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_driver_updates();

CREATE OR REPLACE FUNCTION public.guard_verification_status_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.role() = 'service_role' OR current_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    RAISE EXCEPTION 'Clients cannot modify verification status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_identity_doc_status ON public.identity_documents;
CREATE TRIGGER trigger_guard_identity_doc_status
  BEFORE UPDATE ON public.identity_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_verification_status_updates();

DROP TRIGGER IF EXISTS trigger_guard_driving_license_status ON public.driving_licenses;
CREATE TRIGGER trigger_guard_driving_license_status
  BEFORE UPDATE ON public.driving_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_verification_status_updates();

DROP TRIGGER IF EXISTS trigger_guard_vehicle_status ON public.vehicles;
CREATE TRIGGER trigger_guard_vehicle_status
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_verification_status_updates();

DROP TRIGGER IF EXISTS trigger_guard_vehicle_doc_status ON public.vehicle_documents;
CREATE TRIGGER trigger_guard_vehicle_doc_status
  BEFORE UPDATE ON public.vehicle_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_verification_status_updates();

-- 4. nearest_available_drivers()
-- PostGIS spatial query: approved, online, allowed vehicle type, updated in last 10 mins
CREATE OR REPLACE FUNCTION public.nearest_available_drivers(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_m DOUBLE PRECISION,
  p_vehicle_type public.vehicle_type,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  driver_id UUID,
  distance_m DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    d.id AS driver_id,
    ST_Distance(
      dl.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) AS distance_m
  FROM public.drivers d
  INNER JOIN public.driver_locations dl ON dl.driver_id = d.id
  WHERE d.verification_status = 'approved'
    AND d.availability_status = 'online'
    AND p_vehicle_type = ANY(d.allowed_vehicle_types)
    AND dl.updated_at >= (now() - INTERVAL '10 minutes')
    AND ST_DWithin(
      dl.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_m
    )
  ORDER BY distance_m ASC
  LIMIT LEAST(GREATEST(max_results, 1), 100);
$$;

-- Restrict nearest_available_drivers to service_role only
REVOKE ALL ON FUNCTION public.nearest_available_drivers(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, public.vehicle_type, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nearest_available_drivers(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, public.vehicle_type, INTEGER) TO service_role;



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 011_rls_policies.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- 011_rls_policies.sql
-- Enables RLS on ALL 26 tables and implements the strict Phase 1 RLS policy matrix.

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON EVERY TABLE
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driving_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. IDENTITY POLICIES
-- ============================================================================

-- profiles: read/update own (cannot change role/account_status, protected by trigger + policy)
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- identity_documents: read/insert own, admin update verification
DROP POLICY IF EXISTS "identity_documents_select_policy" ON public.identity_documents;
CREATE POLICY "identity_documents_select_policy" ON public.identity_documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "identity_documents_insert_policy" ON public.identity_documents;
CREATE POLICY "identity_documents_insert_policy" ON public.identity_documents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "identity_documents_update_policy" ON public.identity_documents;
CREATE POLICY "identity_documents_update_policy" ON public.identity_documents
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- emergency_contacts: full control of own rows, admin read
DROP POLICY IF EXISTS "emergency_contacts_select_policy" ON public.emergency_contacts;
CREATE POLICY "emergency_contacts_select_policy" ON public.emergency_contacts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "emergency_contacts_insert_policy" ON public.emergency_contacts;
CREATE POLICY "emergency_contacts_insert_policy" ON public.emergency_contacts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "emergency_contacts_update_policy" ON public.emergency_contacts;
CREATE POLICY "emergency_contacts_update_policy" ON public.emergency_contacts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "emergency_contacts_delete_policy" ON public.emergency_contacts;
CREATE POLICY "emergency_contacts_delete_policy" ON public.emergency_contacts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- payment_accounts: full control of own rows, admin read
DROP POLICY IF EXISTS "payment_accounts_select_policy" ON public.payment_accounts;
CREATE POLICY "payment_accounts_select_policy" ON public.payment_accounts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "payment_accounts_insert_policy" ON public.payment_accounts;
CREATE POLICY "payment_accounts_insert_policy" ON public.payment_accounts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "payment_accounts_update_policy" ON public.payment_accounts;
CREATE POLICY "payment_accounts_update_policy" ON public.payment_accounts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "payment_accounts_delete_policy" ON public.payment_accounts;
CREATE POLICY "payment_accounts_delete_policy" ON public.payment_accounts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- device_tokens: full control of own rows, admin read
DROP POLICY IF EXISTS "device_tokens_select_policy" ON public.device_tokens;
CREATE POLICY "device_tokens_select_policy" ON public.device_tokens
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "device_tokens_insert_policy" ON public.device_tokens;
CREATE POLICY "device_tokens_insert_policy" ON public.device_tokens
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "device_tokens_update_policy" ON public.device_tokens;
CREATE POLICY "device_tokens_update_policy" ON public.device_tokens
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "device_tokens_delete_policy" ON public.device_tokens;
CREATE POLICY "device_tokens_delete_policy" ON public.device_tokens
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- 3. CUSTOMER AND VEHICLE POLICIES
-- ============================================================================

-- customers: customer read/update own, admin all
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
CREATE POLICY "customers_select_policy" ON public.customers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "customers_insert_policy" ON public.customers;
CREATE POLICY "customers_insert_policy" ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "customers_update_policy" ON public.customers;
CREATE POLICY "customers_update_policy" ON public.customers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- vehicles: customer full control of own, driver read vehicles on their active trip, admin all
DROP POLICY IF EXISTS "vehicles_select_policy" ON public.vehicles;
CREATE POLICY "vehicles_select_policy" ON public.vehicles
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
    OR id IN (
      SELECT t.vehicle_id FROM public.trips t
      INNER JOIN public.drivers d ON t.driver_id = d.id
      WHERE d.user_id = auth.uid()
        AND t.trip_status IN ('dispatched', 'arrived_at_pickup', 'vehicle_handover_pending', 'started')
    )
  );

DROP POLICY IF EXISTS "vehicles_insert_policy" ON public.vehicles;
CREATE POLICY "vehicles_insert_policy" ON public.vehicles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "vehicles_update_policy" ON public.vehicles;
CREATE POLICY "vehicles_update_policy" ON public.vehicles
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "vehicles_delete_policy" ON public.vehicles;
CREATE POLICY "vehicles_delete_policy" ON public.vehicles
  FOR DELETE TO authenticated
  USING (
    public.is_admin()
    OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

-- vehicle_documents: customer full control of own, driver read on active trip, admin all
DROP POLICY IF EXISTS "vehicle_documents_select_policy" ON public.vehicle_documents;
CREATE POLICY "vehicle_documents_select_policy" ON public.vehicle_documents
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR vehicle_id IN (
      SELECT v.id FROM public.vehicles v
      INNER JOIN public.customers c ON v.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
    OR vehicle_id IN (
      SELECT t.vehicle_id FROM public.trips t
      INNER JOIN public.drivers d ON t.driver_id = d.id
      WHERE d.user_id = auth.uid()
        AND t.trip_status IN ('dispatched', 'arrived_at_pickup', 'vehicle_handover_pending', 'started')
    )
  );

DROP POLICY IF EXISTS "vehicle_documents_insert_policy" ON public.vehicle_documents;
CREATE POLICY "vehicle_documents_insert_policy" ON public.vehicle_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR vehicle_id IN (
      SELECT v.id FROM public.vehicles v
      INNER JOIN public.customers c ON v.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "vehicle_documents_update_policy" ON public.vehicle_documents;
CREATE POLICY "vehicle_documents_update_policy" ON public.vehicle_documents
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR vehicle_id IN (
      SELECT v.id FROM public.vehicles v
      INNER JOIN public.customers c ON v.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR vehicle_id IN (
      SELECT v.id FROM public.vehicles v
      INNER JOIN public.customers c ON v.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "vehicle_documents_delete_policy" ON public.vehicle_documents;
CREATE POLICY "vehicle_documents_delete_policy" ON public.vehicle_documents
  FOR DELETE TO authenticated
  USING (
    public.is_admin()
    OR vehicle_id IN (
      SELECT v.id FROM public.vehicles v
      INNER JOIN public.customers c ON v.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. DRIVER POLICIES
-- ============================================================================

-- drivers: driver read/update own (status/approvals protected), admin all, customer none
DROP POLICY IF EXISTS "drivers_select_policy" ON public.drivers;
CREATE POLICY "drivers_select_policy" ON public.drivers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "drivers_update_policy" ON public.drivers;
CREATE POLICY "drivers_update_policy" ON public.drivers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "drivers_insert_policy" ON public.drivers;
CREATE POLICY "drivers_insert_policy" ON public.drivers
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- driving_licenses: driver read/insert own, admin all, customer none
DROP POLICY IF EXISTS "driving_licenses_select_policy" ON public.driving_licenses;
CREATE POLICY "driving_licenses_select_policy" ON public.driving_licenses
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "driving_licenses_insert_policy" ON public.driving_licenses;
CREATE POLICY "driving_licenses_insert_policy" ON public.driving_licenses
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "driving_licenses_update_policy" ON public.driving_licenses;
CREATE POLICY "driving_licenses_update_policy" ON public.driving_licenses
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- driver_locations: driver write/read own, admin read, customer none
DROP POLICY IF EXISTS "driver_locations_select_policy" ON public.driver_locations;
CREATE POLICY "driver_locations_select_policy" ON public.driver_locations
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "driver_locations_insert_policy" ON public.driver_locations;
CREATE POLICY "driver_locations_insert_policy" ON public.driver_locations
  FOR INSERT TO authenticated
  WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "driver_locations_update_policy" ON public.driver_locations;
CREATE POLICY "driver_locations_update_policy" ON public.driver_locations
  FOR UPDATE TO authenticated
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 5. BOOKING AND MATCHING POLICIES
-- ============================================================================

-- bookings: customer full control of own, driver read assigned, admin all
DROP POLICY IF EXISTS "bookings_select_policy" ON public.bookings;
CREATE POLICY "bookings_select_policy" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
    OR id IN (
      SELECT da.booking_id FROM public.driver_assignments da
      INNER JOIN public.drivers d ON da.driver_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "bookings_insert_policy" ON public.bookings;
CREATE POLICY "bookings_insert_policy" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "bookings_update_policy" ON public.bookings;
CREATE POLICY "bookings_update_policy" ON public.bookings
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "bookings_delete_policy" ON public.bookings;
CREATE POLICY "bookings_delete_policy" ON public.bookings
  FOR DELETE TO authenticated
  USING (
    public.is_admin()
    OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

-- driver_assignments: driver read/update own, admin all, customer none
DROP POLICY IF EXISTS "driver_assignments_select_policy" ON public.driver_assignments;
CREATE POLICY "driver_assignments_select_policy" ON public.driver_assignments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "driver_assignments_update_policy" ON public.driver_assignments;
CREATE POLICY "driver_assignments_update_policy" ON public.driver_assignments
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "driver_assignments_insert_policy" ON public.driver_assignments;
CREATE POLICY "driver_assignments_insert_policy" ON public.driver_assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 6. TRIP AND SAFETY POLICIES
-- ============================================================================

-- trips: driver read own, customer read own, admin all
DROP POLICY IF EXISTS "trips_select_policy" ON public.trips;
CREATE POLICY "trips_select_policy" ON public.trips
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "trips_insert_policy" ON public.trips;
CREATE POLICY "trips_insert_policy" ON public.trips
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "trips_update_policy" ON public.trips;
CREATE POLICY "trips_update_policy" ON public.trips
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- trip_otps: none for anyone (service role only)
-- Default deny is active since RLS is enabled and NO policies exist for anon/authenticated.

-- vehicle_handovers: read on own trips, driver insert/update on own trips, admin all
DROP POLICY IF EXISTS "vehicle_handovers_select_policy" ON public.vehicle_handovers;
CREATE POLICY "vehicle_handovers_select_policy" ON public.vehicle_handovers
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR trip_id IN (
      SELECT t.id FROM public.trips t
      INNER JOIN public.drivers d ON t.driver_id = d.id
      WHERE d.user_id = auth.uid()
    )
    OR trip_id IN (
      SELECT t.id FROM public.trips t
      INNER JOIN public.customers c ON t.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "vehicle_handovers_insert_policy" ON public.vehicle_handovers;
CREATE POLICY "vehicle_handovers_insert_policy" ON public.vehicle_handovers
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR trip_id IN (
      SELECT t.id FROM public.trips t
      INNER JOIN public.drivers d ON t.driver_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "vehicle_handovers_update_policy" ON public.vehicle_handovers;
CREATE POLICY "vehicle_handovers_update_policy" ON public.vehicle_handovers
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR trip_id IN (
      SELECT t.id FROM public.trips t
      INNER JOIN public.drivers d ON t.driver_id = d.id
      WHERE d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR trip_id IN (
      SELECT t.id FROM public.trips t
      INNER JOIN public.drivers d ON t.driver_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- handover_photos: read/insert on own trips, admin all
DROP POLICY IF EXISTS "handover_photos_select_policy" ON public.handover_photos;
CREATE POLICY "handover_photos_select_policy" ON public.handover_photos
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR handover_id IN (
      SELECT vh.id FROM public.vehicle_handovers vh
      INNER JOIN public.trips t ON vh.trip_id = t.id
      INNER JOIN public.drivers d ON t.driver_id = d.id
      WHERE d.user_id = auth.uid()
    )
    OR handover_id IN (
      SELECT vh.id FROM public.vehicle_handovers vh
      INNER JOIN public.trips t ON vh.trip_id = t.id
      INNER JOIN public.customers c ON t.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "handover_photos_insert_policy" ON public.handover_photos;
CREATE POLICY "handover_photos_insert_policy" ON public.handover_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR handover_id IN (
      SELECT vh.id FROM public.vehicle_handovers vh
      INNER JOIN public.trips t ON vh.trip_id = t.id
      INNER JOIN public.drivers d ON t.driver_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- trip_locations: driver and customer read own trip locations, driver insert, admin all
DROP POLICY IF EXISTS "trip_locations_select_policy" ON public.trip_locations;
CREATE POLICY "trip_locations_select_policy" ON public.trip_locations
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR trip_id IN (
      SELECT t.id FROM public.trips t
      INNER JOIN public.customers c ON t.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "trip_locations_insert_policy" ON public.trip_locations;
CREATE POLICY "trip_locations_insert_policy" ON public.trip_locations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

-- sos_events: insert/read own, admin all
DROP POLICY IF EXISTS "sos_events_select_policy" ON public.sos_events;
CREATE POLICY "sos_events_select_policy" ON public.sos_events
  FOR SELECT TO authenticated
  USING (triggered_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "sos_events_insert_policy" ON public.sos_events;
CREATE POLICY "sos_events_insert_policy" ON public.sos_events
  FOR INSERT TO authenticated
  WITH CHECK (triggered_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "sos_events_update_policy" ON public.sos_events;
CREATE POLICY "sos_events_update_policy" ON public.sos_events
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 7. MONEY POLICIES
-- ============================================================================

-- fares: driver read own trip fares, customer read own trip fares, admin all
DROP POLICY IF EXISTS "fares_select_policy" ON public.fares;
CREATE POLICY "fares_select_policy" ON public.fares
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR trip_id IN (
      SELECT t.id FROM public.trips t
      INNER JOIN public.drivers d ON t.driver_id = d.id
      WHERE d.user_id = auth.uid()
    )
    OR trip_id IN (
      SELECT t.id FROM public.trips t
      INNER JOIN public.customers c ON t.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- payments: driver none, customer read own, admin all
DROP POLICY IF EXISTS "payments_select_policy" ON public.payments;
CREATE POLICY "payments_select_policy" ON public.payments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  );

-- driver_earnings: driver read own, customer none, admin all
DROP POLICY IF EXISTS "driver_earnings_select_policy" ON public.driver_earnings;
CREATE POLICY "driver_earnings_select_policy" ON public.driver_earnings
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 8. COMMUNICATION AND AUDIT POLICIES
-- ============================================================================

-- ratings: insert/read own, admin all
DROP POLICY IF EXISTS "ratings_select_policy" ON public.ratings;
CREATE POLICY "ratings_select_policy" ON public.ratings
  FOR SELECT TO authenticated
  USING (
    from_user_id = auth.uid()
    OR to_user_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "ratings_insert_policy" ON public.ratings;
CREATE POLICY "ratings_insert_policy" ON public.ratings
  FOR INSERT TO authenticated
  WITH CHECK (from_user_id = auth.uid() OR public.is_admin());

-- complaints: insert/read own, admin all
DROP POLICY IF EXISTS "complaints_select_policy" ON public.complaints;
CREATE POLICY "complaints_select_policy" ON public.complaints
  FOR SELECT TO authenticated
  USING (reported_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "complaints_insert_policy" ON public.complaints;
CREATE POLICY "complaints_insert_policy" ON public.complaints
  FOR INSERT TO authenticated
  WITH CHECK (reported_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "complaints_update_policy" ON public.complaints;
CREATE POLICY "complaints_update_policy" ON public.complaints
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- notifications: own rows, admin read
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
CREATE POLICY "notifications_select_policy" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
CREATE POLICY "notifications_update_policy" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- audit_logs: append-only, admin read only, NO UPDATE OR DELETE FOR ANYONE
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 012_storage.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- 012_storage.sql
-- Configures private storage buckets and secure folder-level RLS policies for uploads

-- Create private buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('identity-docs', 'identity-docs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('driver-docs', 'driver-docs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('vehicle-docs', 'vehicle-docs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('handover-photos', 'handover-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Storage RLS Policies on storage.objects

-- 1. SELECT: Users can only read files under their own {auth.uid()} path; admins can read all
DROP POLICY IF EXISTS "storage_objects_select_policy" ON storage.objects;
CREATE POLICY "storage_objects_select_policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('identity-docs', 'driver-docs', 'vehicle-docs', 'handover-photos')
    AND (
      public.is_admin()
      OR name LIKE (auth.uid()::text || '/%')
    )
  );

-- 2. INSERT: Users can only upload files under their own {auth.uid()} path
DROP POLICY IF EXISTS "storage_objects_insert_policy" ON storage.objects;
CREATE POLICY "storage_objects_insert_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('identity-docs', 'driver-docs', 'vehicle-docs', 'handover-photos')
    AND name LIKE (auth.uid()::text || '/%')
  );

-- 3. UPDATE: Users can only modify files under their own {auth.uid()} path
DROP POLICY IF EXISTS "storage_objects_update_policy" ON storage.objects;
CREATE POLICY "storage_objects_update_policy" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('identity-docs', 'driver-docs', 'vehicle-docs', 'handover-photos')
    AND name LIKE (auth.uid()::text || '/%')
  )
  WITH CHECK (
    bucket_id IN ('identity-docs', 'driver-docs', 'vehicle-docs', 'handover-photos')
    AND name LIKE (auth.uid()::text || '/%')
  );

-- 4. DELETE: Users can only delete files under their own {auth.uid()} path
DROP POLICY IF EXISTS "storage_objects_delete_policy" ON storage.objects;
CREATE POLICY "storage_objects_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('identity-docs', 'driver-docs', 'vehicle-docs', 'handover-photos')
    AND name LIKE (auth.uid()::text || '/%')
  );



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 013_driver_onboarding_and_verification.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- 013_driver_onboarding_and_verification.sql
-- Phase 2: Driver Onboarding, Identity, License Document Verification, and Trigger Guards

-- 1. Create driver_onboarding_status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_onboarding_status') THEN
    CREATE TYPE public.driver_onboarding_status AS ENUM (
      'not_started',
      'in_progress',
      'submitted',
      'under_review',
      'approved',
      'rejected'
    );
  END IF;
END
$$;

-- 2. Add profile and onboarding columns to drivers
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS address_line TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(6),
  ADD COLUMN IF NOT EXISTS experience_years INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_photo_path TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_status public.driver_onboarding_status NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_drivers_onboarding_status ON public.drivers(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_drivers_submitted_at ON public.drivers(submitted_at);

-- Set existing approved drivers in seed/DB to approved onboarding status
UPDATE public.drivers
SET onboarding_status = 'approved'
WHERE verification_status = 'approved' AND onboarding_status = 'not_started';

-- 3. Add front and back document file paths to driving_licenses
ALTER TABLE public.driving_licenses
  ADD COLUMN IF NOT EXISTS front_file_path TEXT,
  ADD COLUMN IF NOT EXISTS back_file_path TEXT;

-- Drop NOT NULL on legacy file_path column if present to support front/back uploads
ALTER TABLE public.driving_licenses
  ALTER COLUMN file_path DROP NOT NULL;

-- Backfill front_file_path from file_path where missing
UPDATE public.driving_licenses
SET front_file_path = file_path
WHERE front_file_path IS NULL AND file_path IS NOT NULL;

-- 4. Update trigger guard for drivers table to strictly protect onboarding and review metadata
CREATE OR REPLACE FUNCTION public.guard_driver_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Service role and superusers bypass this guard
  IF auth.role() = 'service_role' OR current_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  -- Platform admins and support staff can review and alter statuses
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Regular drivers cannot alter their own onboarding status directly
  IF NEW.onboarding_status IS DISTINCT FROM OLD.onboarding_status THEN
    RAISE EXCEPTION 'Clients cannot alter driver onboarding status';
  END IF;

  -- Regular drivers cannot alter verification status directly
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    RAISE EXCEPTION 'Clients cannot alter driver verification status';
  END IF;

  -- Regular drivers cannot clear or fabricate rejection reasons
  IF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    RAISE EXCEPTION 'Clients cannot alter driver rejection reason';
  END IF;

  -- Regular drivers cannot alter submitted_at timestamp
  IF NEW.submitted_at IS DISTINCT FROM OLD.submitted_at THEN
    RAISE EXCEPTION 'Clients cannot alter driver submission timestamp';
  END IF;

  -- Regular drivers cannot modify approval metadata
  IF NEW.approved_by IS DISTINCT FROM OLD.approved_by OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'Clients cannot alter driver approval metadata';
  END IF;

  -- Regular drivers cannot modify rating metadata
  IF NEW.rating_avg IS DISTINCT FROM OLD.rating_avg OR NEW.rating_count IS DISTINCT FROM OLD.rating_count THEN
    RAISE EXCEPTION 'Clients cannot alter driver ratings directly';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_driver_updates ON public.drivers;
CREATE TRIGGER trigger_guard_driver_updates
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_driver_updates();

-- 5. RLS Policies: Allow drivers to update their own driving license details during onboarding
DROP POLICY IF EXISTS "driving_licenses_update_policy" ON public.driving_licenses;
CREATE POLICY "driving_licenses_update_policy" ON public.driving_licenses
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

-- Allow drivers to update their own identity documents during onboarding
DROP POLICY IF EXISTS "identity_documents_update_policy" ON public.identity_documents;
CREATE POLICY "identity_documents_update_policy" ON public.identity_documents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 014_availability_matching_assignments.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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

-- 6. Helper function to record driver location and append to trip_locations if on active trip
CREATE OR REPLACE FUNCTION public.record_driver_location(
  p_driver_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_heading DOUBLE PRECISION DEFAULT NULL,
  p_speed DOUBLE PRECISION DEFAULT NULL,
  p_recorded_at TIMESTAMPTZ DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_active_trip_id UUID;
BEGIN
  -- 1. Upsert into driver_locations
  INSERT INTO public.driver_locations (
    driver_id,
    location,
    heading,
    speed,
    updated_at
  ) VALUES (
    p_driver_id,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_heading,
    p_speed,
    p_recorded_at
  )
  ON CONFLICT (driver_id) DO UPDATE SET
    location = EXCLUDED.location,
    heading = EXCLUDED.heading,
    speed = EXCLUDED.speed,
    updated_at = EXCLUDED.updated_at;

  -- 2. Check if driver is on an active trip, append to trip_locations
  SELECT id INTO v_active_trip_id
  FROM public.trips
  WHERE driver_id = p_driver_id
    AND trip_status IN ('assigned', 'dispatched', 'arrived_at_pickup', 'vehicle_handover_pending', 'started')
  LIMIT 1;

  IF v_active_trip_id IS NOT NULL THEN
    INSERT INTO public.trip_locations (
      trip_id,
      driver_id,
      location,
      speed,
      recorded_at
    ) VALUES (
      v_active_trip_id,
      p_driver_id,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_speed,
      p_recorded_at
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_driver_location TO service_role, authenticated;

-- 7. Helper function to set stale online drivers (no location update for 2 minutes) offline
CREATE OR REPLACE FUNCTION public.set_stale_drivers_offline(
  p_threshold_interval INTERVAL DEFAULT INTERVAL '2 minutes'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  WITH stale_drivers AS (
    SELECT d.id
    FROM public.drivers d
    LEFT JOIN public.driver_locations dl ON dl.driver_id = d.id
    WHERE d.availability_status = 'online'
      AND (dl.updated_at IS NULL OR dl.updated_at < (now() - p_threshold_interval))
      AND NOT EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.driver_id = d.id
          AND t.trip_status IN ('assigned', 'dispatched', 'arrived_at_pickup', 'vehicle_handover_pending', 'started')
      )
  )
  UPDATE public.drivers
  SET availability_status = 'offline', updated_at = now()
  WHERE id IN (SELECT id FROM stale_drivers);

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_stale_drivers_offline TO service_role;

-- 8. Enable Realtime on driver_assignments if publication exists
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




-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 015_trip_lifecycle_and_fare_rules.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 016_phase5_earnings_safety_notifications.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- 016_phase5_earnings_safety_notifications.sql
-- Phase 5: Earnings, Payout Accounts, Ratings, Complaints, Push/In-App Notifications, SOS Safety, and Live Trip Sharing

-- 1. Ensure settlement_status enum includes 'settled'
ALTER TYPE public.settlement_status ADD VALUE IF NOT EXISTS 'settled';

-- 2. Payout accounts table (UPI ID or Bank Account with IFSC validation)
CREATE TABLE IF NOT EXISTS public.payout_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL CHECK (account_type IN ('upi', 'bank_account')),
  upi_id TEXT,
  bank_name TEXT,
  account_number_masked TEXT,
  ifsc_code TEXT,
  beneficiary_name TEXT NOT NULL,
  provider_token TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  verification_status public.verification_status NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payout_accounts_driver_id ON public.payout_accounts(driver_id);

-- Ensure only one default payout account per driver
CREATE UNIQUE INDEX IF NOT EXISTS idx_payout_accounts_driver_default
  ON public.payout_accounts(driver_id)
  WHERE (is_default = true);

DROP TRIGGER IF EXISTS trigger_payout_accounts_updated_at ON public.payout_accounts;
CREATE TRIGGER trigger_payout_accounts_updated_at
  BEFORE UPDATE ON public.payout_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3. Live trip sharing tokens
CREATE TABLE IF NOT EXISTS public.trip_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_shares_trip_id ON public.trip_shares(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_shares_token ON public.trip_shares(share_token);

-- 4. Extend sos_events with resolution metadata and geocoded address
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sos_events' AND column_name = 'reverse_geocoded_address'
  ) THEN
    ALTER TABLE public.sos_events ADD COLUMN reverse_geocoded_address TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sos_events' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.sos_events ADD COLUMN notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sos_events' AND column_name = 'acknowledged_at'
  ) THEN
    ALTER TABLE public.sos_events ADD COLUMN acknowledged_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sos_events' AND column_name = 'acknowledged_by'
  ) THEN
    ALTER TABLE public.sos_events ADD COLUMN acknowledged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Extend notifications with metadata JSONB column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'data'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 6. Trigger to maintain drivers.rating_avg and rating_count when ratings are submitted
CREATE OR REPLACE FUNCTION public.update_driver_rating_aggregates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_driver_id UUID;
  v_avg NUMERIC(3,2);
  v_cnt INTEGER;
BEGIN
  -- Check if to_user_id is a driver
  SELECT id INTO v_driver_id FROM public.drivers WHERE user_id = NEW.to_user_id;

  IF v_driver_id IS NOT NULL THEN
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 5.00), COUNT(*)
    INTO v_avg, v_cnt
    FROM public.ratings
    WHERE to_user_id = NEW.to_user_id;

    UPDATE public.drivers
    SET rating_avg = v_avg,
        rating_count = v_cnt,
        updated_at = now()
    WHERE id = v_driver_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_ratings_update_driver ON public.ratings;
CREATE TRIGGER trigger_ratings_update_driver
  AFTER INSERT OR UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_rating_aggregates();

-- 7. Trigger to enforce max 5 emergency contacts per user
CREATE OR REPLACE FUNCTION public.check_max_emergency_contacts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.emergency_contacts
  WHERE user_id = NEW.user_id;

  IF v_count >= 5 THEN
    RAISE EXCEPTION 'A user may have a maximum of 5 emergency contacts' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_max_emergency_contacts ON public.emergency_contacts;
CREATE TRIGGER trigger_check_max_emergency_contacts
  BEFORE INSERT ON public.emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_emergency_contacts();

-- 8. Row Level Security Policies for Payout Accounts & Trip Shares
ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_shares ENABLE ROW LEVEL SECURITY;

-- payout_accounts: driver has full access to own payout accounts
DROP POLICY IF EXISTS "payout_accounts_driver_select" ON public.payout_accounts;
CREATE POLICY "payout_accounts_driver_select" ON public.payout_accounts
  FOR SELECT
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "payout_accounts_driver_insert" ON public.payout_accounts;
CREATE POLICY "payout_accounts_driver_insert" ON public.payout_accounts
  FOR INSERT
  WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "payout_accounts_driver_update" ON public.payout_accounts;
CREATE POLICY "payout_accounts_driver_update" ON public.payout_accounts
  FOR UPDATE
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "payout_accounts_driver_delete" ON public.payout_accounts;
CREATE POLICY "payout_accounts_driver_delete" ON public.payout_accounts
  FOR DELETE
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR public.is_admin()
  );

-- trip_shares: driver can create/read own trip shares, public can select active tokens
DROP POLICY IF EXISTS "trip_shares_driver_all" ON public.trip_shares;
CREATE POLICY "trip_shares_driver_all" ON public.trip_shares
  FOR ALL
  USING (
    trip_id IN (
      SELECT id FROM public.trips WHERE driver_id IN (
        SELECT id FROM public.drivers WHERE user_id = auth.uid()
      )
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "trip_shares_public_select" ON public.trip_shares;
CREATE POLICY "trip_shares_public_select" ON public.trip_shares
  FOR SELECT
  USING (expires_at > now());



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: 017_phase6_security_dpdp_retention.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- 017_phase6_security_dpdp_retention.sql
-- Phase 6: Security Hardening, DPDP Act Readiness (Consent & Erasure), and Telemetry Retention Pruning

-- 1. Extend drivers table with account lifecycle and DPDP deletion flags
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_drivers_deletion_status
  ON public.drivers(is_deleted, deletion_scheduled_at)
  WHERE is_deleted = TRUE OR deletion_scheduled_at IS NOT NULL;

-- 2. Digital Personal Data Protection (DPDP) Act: Driver Consent Logs
CREATE TABLE IF NOT EXISTS public.driver_consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  ip_address TEXT,
  user_agent TEXT,
  is_granted BOOLEAN NOT NULL DEFAULT TRUE,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_consent_logs_driver ON public.driver_consent_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_consent_logs_purpose ON public.driver_consent_logs(purpose);

-- 3. Account Deletion Requests (Right to Erasure with statutory 30-day grace period)
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_deletion_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  status TEXT NOT NULL DEFAULT 'pending_grace_period' CHECK (status IN ('pending_grace_period', 'processed', 'cancelled')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_driver ON public.account_deletion_requests(driver_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status ON public.account_deletion_requests(status, scheduled_deletion_at);

DROP TRIGGER IF EXISTS trigger_account_deletion_requests_updated_at ON public.account_deletion_requests;
CREATE TRIGGER trigger_account_deletion_requests_updated_at
  BEFORE UPDATE ON public.account_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Stored Procedure: Telemetry Retention Pruning Job
-- Removes location breadcrumbs older than retention_days (default 30 days) to comply with data minimization
CREATE OR REPLACE FUNCTION public.prune_stale_telemetry(retention_days INTEGER DEFAULT 30)
RETURNS TABLE (
  pruned_trip_locations BIGINT,
  pruned_driver_locations BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ;
  v_trip_loc_count BIGINT;
  v_driver_loc_count BIGINT;
BEGIN
  v_cutoff := now() - (retention_days || ' days')::INTERVAL;

  -- 1. Delete trip breadcrumbs older than cutoff
  WITH deleted AS (
    DELETE FROM public.trip_locations
    WHERE recorded_at < v_cutoff
    RETURNING 1
  )
  SELECT count(*) INTO v_trip_loc_count FROM deleted;

  -- 2. Delete driver_locations that haven't been updated for > cutoff (inactive / orphaned)
  WITH deleted AS (
    DELETE FROM public.driver_locations
    WHERE updated_at < v_cutoff
    RETURNING 1
  )
  SELECT count(*) INTO v_driver_loc_count FROM deleted;

  RETURN QUERY SELECT v_trip_loc_count, v_driver_loc_count;
END;
$$;

-- Restrict execution to service_role and postgres
REVOKE ALL ON FUNCTION public.prune_stale_telemetry(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_stale_telemetry(INTEGER) TO service_role;

-- 5. Stored Procedure: Driver Anonymization (Right to Erasure compliance)
-- Scrub PII while retaining anonymized trip distances, durations, and financial ledgers for statutory audit
CREATE OR REPLACE FUNCTION public.anonymize_driver_account(p_driver_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_anon_code TEXT;
BEGIN
  -- Get user_id for the driver
  SELECT user_id INTO v_user_id
  FROM public.drivers
  WHERE id = p_driver_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  v_anon_code := 'ANON_' || substr(p_driver_id::text, 1, 8);

  -- 1. Anonymize driver record
  UPDATE public.drivers
  SET
    address_line = NULL,
    city = NULL,
    state = NULL,
    pincode = NULL,
    profile_photo_path = NULL,
    is_deleted = TRUE,
    availability_status = 'offline',
    anonymized_at = now(),
    updated_at = now()
  WHERE id = p_driver_id;

  -- 2. Anonymize user profile
  UPDATE public.profiles
  SET
    full_name = 'Anonymized Driver',
    phone_number = '+910000000000',
    email = NULL,
    account_status = 'suspended',
    updated_at = now()
  WHERE id = v_user_id;

  -- 3. Mask driving license document paths
  UPDATE public.driving_licenses
  SET
    license_number_masked = 'XXXX-XXXX-XXXX',
    front_file_path = 'anonymized/license_front.png',
    back_file_path = 'anonymized/license_back.png',
    updated_at = now()
  WHERE driver_id = p_driver_id;

  -- 4. Mask emergency contacts
  DELETE FROM public.emergency_contacts
  WHERE driver_id = p_driver_id;

  -- 5. Mask payout accounts details
  UPDATE public.payout_accounts
  SET
    upi_id = NULL,
    account_number_masked = 'XXXX-XXXX-XXXX',
    ifsc_code = 'XXXX0000000',
    beneficiary_name = 'Anonymized',
    provider_token = NULL,
    updated_at = now()
  WHERE driver_id = p_driver_id;

  -- 6. Mark deletion request as processed
  UPDATE public.account_deletion_requests
  SET
    status = 'processed',
    processed_at = now(),
    updated_at = now()
  WHERE driver_id = p_driver_id AND status = 'pending_grace_period';

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.anonymize_driver_account(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.anonymize_driver_account(UUID) TO service_role;

-- 6. Row Level Security Policies
ALTER TABLE public.driver_consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- driver_consent_logs RLS
CREATE POLICY "Drivers can view their own consent logs"
  ON public.driver_consent_logs
  FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can insert their own consent logs"
  ON public.driver_consent_logs
  FOR INSERT
  WITH CHECK (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to driver_consent_logs"
  ON public.driver_consent_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- account_deletion_requests RLS
CREATE POLICY "Drivers can view their own deletion requests"
  ON public.account_deletion_requests
  FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can request account deletion"
  ON public.account_deletion_requests
  FOR INSERT
  WITH CHECK (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can cancel pending deletion request"
  ON public.account_deletion_requests
  FOR UPDATE
  USING (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    status = 'cancelled'
  );

CREATE POLICY "Service role full access to account_deletion_requests"
  ON public.account_deletion_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- SEED DATA (Bangalore Pilot Sample Drivers, Vehicles, Profiles)
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- database/seed.sql
-- Seed script for Phase 1 local development and testing
-- Coordinates center point: Bangalore, Karnataka, India

DO $$
DECLARE
  -- ==========================================================================
  -- CONFIGURABLE CENTER POINT (Lat, Lng)
  -- Changing these two variables recalculates all sample coordinates
  -- ==========================================================================
  v_center_lat DOUBLE PRECISION := 12.971598;
  v_center_lng DOUBLE PRECISION := 77.594562;

  -- Fixed UUIDs for Auth Users & Profiles
  v_admin_user_id     UUID := '00000000-0000-0000-0000-000000000001';
  v_driver1_user_id   UUID := '00000000-0000-0000-0000-000000000002';
  v_driver2_user_id   UUID := '00000000-0000-0000-0000-000000000003';
  v_driver3_user_id   UUID := '00000000-0000-0000-0000-000000000004';
  v_cust1_user_id     UUID := '00000000-0000-0000-0000-000000000005';
  v_cust2_user_id     UUID := '00000000-0000-0000-0000-000000000006';

  -- Fixed UUIDs for Domain Entities
  v_driver1_id        UUID := '10000000-0000-0000-0000-000000000001';
  v_driver2_id        UUID := '10000000-0000-0000-0000-000000000002';
  v_driver3_id        UUID := '10000000-0000-0000-0000-000000000003';

  v_cust1_id          UUID := '20000000-0000-0000-0000-000000000001';
  v_cust2_id          UUID := '20000000-0000-0000-0000-000000000002';

  v_veh1_id           UUID := '30000000-0000-0000-0000-000000000001';
  v_veh2_id           UUID := '30000000-0000-0000-0000-000000000002';

  v_booking1_id       UUID := '40000000-0000-0000-0000-000000000001';
  v_booking2_id       UUID := '40000000-0000-0000-0000-000000000002';

BEGIN
  -- 1. Create auth.users records if in Supabase local environment
  INSERT INTO auth.users (id, aud, role, phone, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES
    (v_admin_user_id, 'authenticated', 'authenticated', '+919876543201', '{"provider":"phone","providers":["phone"],"role":"admin"}', '{"full_name":"Platform Admin"}', now(), now()),
    (v_driver1_user_id, 'authenticated', 'authenticated', '+919876543210', '{"provider":"phone","providers":["phone"],"role":"driver"}', '{"full_name":"Ramesh Kumar"}', now(), now()),
    (v_driver2_user_id, 'authenticated', 'authenticated', '+919876543211', '{"provider":"phone","providers":["phone"],"role":"driver"}', '{"full_name":"Suresh Raina"}', now(), now()),
    (v_driver3_user_id, 'authenticated', 'authenticated', '+919876543212', '{"provider":"phone","providers":["phone"],"role":"driver"}', '{"full_name":"Anand Patel"}', now(), now()),
    (v_cust1_user_id, 'authenticated', 'authenticated', '+919876543220', '{"provider":"phone","providers":["phone"],"role":"customer"}', '{"full_name":"Priya Sharma"}', now(), now()),
    (v_cust2_user_id, 'authenticated', 'authenticated', '+919876543221', '{"provider":"phone","providers":["phone"],"role":"customer"}', '{"full_name":"Vikram Verma"}', now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- 2. Seed profiles
  INSERT INTO public.profiles (id, phone, email, full_name, role, account_status, phone_verified)
  VALUES
    (v_admin_user_id, '+919876543201', 'admin@ryde.in', 'Platform Admin', 'admin', 'active', true),
    (v_driver1_user_id, '+919876543210', 'ramesh.kumar@driver.ryde.in', 'Ramesh Kumar', 'driver', 'active', true),
    (v_driver2_user_id, '+919876543211', 'suresh.raina@driver.ryde.in', 'Suresh Raina', 'driver', 'active', true),
    (v_driver3_user_id, '+919876543212', 'anand.patel@driver.ryde.in', 'Anand Patel', 'driver', 'active', true),
    (v_cust1_user_id, '+919876543220', 'priya.sharma@example.com', 'Priya Sharma', 'customer', 'active', true),
    (v_cust2_user_id, '+919876543221', 'vikram.verma@example.com', 'Vikram Verma', 'customer', 'active', true)
  ON CONFLICT (id) DO NOTHING;

  -- 3. Seed 3 Approved Drivers
  INSERT INTO public.drivers (id, user_id, driver_code, verification_status, availability_status, allowed_vehicle_types, rating_avg, rating_count, approved_by, approved_at)
  VALUES
    (v_driver1_id, v_driver1_user_id, 'DRV-1001', 'approved', 'online', ARRAY['four_wheeler'::public.vehicle_type, 'three_wheeler'::public.vehicle_type], 4.90, 42, v_admin_user_id, now() - INTERVAL '10 days'),
    (v_driver2_id, v_driver2_user_id, 'DRV-1002', 'approved', 'online', ARRAY['four_wheeler'::public.vehicle_type], 4.85, 28, v_admin_user_id, now() - INTERVAL '8 days'),
    (v_driver3_id, v_driver3_user_id, 'DRV-1003', 'approved', 'online', ARRAY['two_wheeler'::public.vehicle_type, 'four_wheeler'::public.vehicle_type], 4.75, 15, v_admin_user_id, now() - INTERVAL '5 days')
  ON CONFLICT (id) DO NOTHING;

  -- 4. Seed Driving Licenses for the Drivers
  INSERT INTO public.driving_licenses (driver_id, license_number_masked, license_classes, expiry_date, file_path, verification_status)
  VALUES
    (v_driver1_id, 'KA01-XXXX-9871', ARRAY['four_wheeler'::public.vehicle_type, 'three_wheeler'::public.vehicle_type], '2030-12-31', 'driver-docs/' || v_driver1_user_id || '/dl_front.jpg', 'approved'),
    (v_driver2_id, 'KA03-XXXX-4512', ARRAY['four_wheeler'::public.vehicle_type], '2032-06-30', 'driver-docs/' || v_driver2_user_id || '/dl_front.jpg', 'approved'),
    (v_driver3_id, 'KA05-XXXX-7823', ARRAY['two_wheeler'::public.vehicle_type, 'four_wheeler'::public.vehicle_type], '2029-09-15', 'driver-docs/' || v_driver3_user_id || '/dl_front.jpg', 'approved')
  ON CONFLICT (driver_id) DO NOTHING;

  -- 5. Seed Driver Locations (Offsets around center point ~ 500m to 2km)
  INSERT INTO public.driver_locations (driver_id, location, heading, speed, updated_at)
  VALUES
    (v_driver1_id, ST_SetSRID(ST_MakePoint(v_center_lng + 0.0035, v_center_lat + 0.0025), 4326)::geography, 90.0, 15.5, now()),
    (v_driver2_id, ST_SetSRID(ST_MakePoint(v_center_lng - 0.0040, v_center_lat + 0.0030), 4326)::geography, 180.0, 0.0, now()),
    (v_driver3_id, ST_SetSRID(ST_MakePoint(v_center_lng + 0.0020, v_center_lat - 0.0050), 4326)::geography, 270.0, 22.0, now())
  ON CONFLICT (driver_id) DO UPDATE SET
    location = EXCLUDED.location,
    heading = EXCLUDED.heading,
    speed = EXCLUDED.speed,
    updated_at = now();

  -- 6. Seed 2 Customers
  INSERT INTO public.customers (id, user_id, customer_code, verification_status)
  VALUES
    (v_cust1_id, v_cust1_user_id, 'CUST-2001', 'approved'),
    (v_cust2_id, v_cust2_user_id, 'CUST-2002', 'approved')
  ON CONFLICT (id) DO NOTHING;

  -- 7. Seed Vehicles for Customers
  INSERT INTO public.vehicles (id, customer_id, vehicle_code, registration_number, make, model, vehicle_type, verification_status)
  VALUES
    (v_veh1_id, v_cust1_id, 'VEH-3001', 'KA01AB1234', 'Hyundai', 'Creta', 'four_wheeler', 'approved'),
    (v_veh2_id, v_cust2_id, 'VEH-3002', 'KA03CD5678', 'Honda', 'City', 'four_wheeler', 'approved')
  ON CONFLICT (id) DO NOTHING;

  -- 8. Seed Sample Bookings
  INSERT INTO public.bookings (
    id, customer_id, vehicle_id,
    pickup_location, pickup_address,
    destination_location, destination_address,
    booking_status, estimated_fare, scheduled_at
  )
  VALUES
    (
      v_booking1_id, v_cust1_id, v_veh1_id,
      ST_SetSRID(ST_MakePoint(v_center_lng, v_center_lat), 4326)::geography,
      'MG Road Metro Station, Bangalore',
      ST_SetSRID(ST_MakePoint(v_center_lng + 0.0450, v_center_lat + 0.0320), 4326)::geography,
      'Indiranagar 100ft Road, Bangalore',
      'pending', 450.00, now() + INTERVAL '1 hour'
    ),
    (
      v_booking2_id, v_cust2_id, v_veh2_id,
      ST_SetSRID(ST_MakePoint(v_center_lng - 0.0200, v_center_lat - 0.0150), 4326)::geography,
      'Koramangala 4th Block, Bangalore',
      ST_SetSRID(ST_MakePoint(v_center_lng + 0.0800, v_center_lat + 0.0700), 4326)::geography,
      'Whitefield ITPL Main Road, Bangalore',
      'pending', 750.00, now() + INTERVAL '2 hours'
    )
  ON CONFLICT (id) DO NOTHING;

  -- 9. Initial Audit Log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES
    (v_admin_user_id, 'SYSTEM_SEED', 'seed', '0', '{"description":"Phase 1 seed data loaded successfully"}'::jsonb, now());

END
$$;

