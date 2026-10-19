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
