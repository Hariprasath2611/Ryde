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
