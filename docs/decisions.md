# Architectural Decision Records (ADRs) & Assumptions

This document records the foundational technical and architectural decisions for the Ryde Platform.

---

## ADR 001: Monorepo Architecture with npm Workspaces

- **Status**: Accepted
- **Context**: Ryde consists of multiple applications (Driver App, Customer App, backends, shared utilities, and admin portal).
- **Decision**: Adopt an npm workspaces monorepo containing `shared`, `ryde-capital/backend`, `ryde/backend`, and mobile apps.
- **Rationale**: Single repository simplifies atomic versioning, shared TypeScript interfaces, synchronized database migrations, and continuous integration.

---

## ADR 002: Supabase (Managed Postgres + PostGIS) Instead of Self-Hosted Postgres

- **Status**: Accepted
- **Context**: Needs reliable PostgreSQL storage, PostGIS for geospatial indexing, real-time event broadcasting, and secure auth capabilities.
- **Decision**: Use Supabase managed platform with local Supabase CLI for development and schema migrations.
- **Rationale**: Eliminates DevOps burden for database clustering, provides built-in Auth (JWT verification), PostGIS support, and instantaneous Change Data Capture (CDC) via Supabase Realtime without requiring Kafka or Redis at MVP stage.

---

## ADR 003: Dedicated Express.js Backends Retained for Complex Business Logic

- **Status**: Accepted
- **Context**: Supabase offers client-direct Postgres access via PostgREST and Edge Functions.
- **Decision**: Maintain dedicated Express.js backends (`ryde-capital/backend` and `ryde/backend`) rather than routing everything directly through PostgREST.
- **Rationale**: Mobility platforms require layered transactional orchestration (e.g., driver vehicle handover verification, state-machine transitions, Razorpay webhooks, and OTP validations) that are best maintained in structured, testable service layers with strict Zod validation.

---

## ADR 004: Monolithic Database, Independent Service Domains (No Microservices for MVP)

- **Status**: Accepted
- **Context**: Microservices introduce distributed transactions, RPC maintenance overhead, and latency spikes.
- **Decision**: Two separate service backends sharing one PostgreSQL database partitioned cleanly into domain tables. Services communicate strictly via database mutations and Supabase Realtime CDC events, never by calling each other over HTTP.
- **Rationale**: Drastically reduces deployment complexity and latency while strictly separating driver and customer failure domains.

---

## ADR 005: Mobile Technology Stack (Expo + Expo Router)

- **Status**: Accepted
- **Context**: Cross-platform mobile apps for iOS and Android in the Indian market.
- **Decision**: React Native with Expo and Expo Router file-based routing.
- **Rationale**: High developer velocity, rapid iterative prototyping, seamless OTA updates, and first-class TypeScript support.

---

## ADR 006: Testing Strategy

- **Status**: Accepted
- **Decision**: Vitest + Supertest for backends and shared package; Jest + React Native Testing Library for mobile frontends; pgTAP for database RLS policies.
- **Rationale**: Vitest provides ultra-fast native ESM execution for modern Node.js and TypeScript; Jest with jest-expo is the standard testing setup for React Native components; pgTAP runs in-database RLS policy assertions directly inside Postgres transactions.

---

## ADR 007: Phase 1 Database Architecture & RLS-First Security

- **Status**: Accepted
- **Context**: 26 domain tables shared across Ryde and Ryde Capital backends, storing sensitive user data, driver locations, and booking records.
- **Decision**:
  1. All 26 tables have Row Level Security enabled with default deny.
  2. Anonymous users receive 0 rows everywhere.
  3. Client tampering is prevented at the database layer via trigger guards (clients cannot elevate their own role, account_status, or verification_status).
  4. Raw credentials (passwords, OTPs, full government IDs, payment cards) are strictly never stored. OTPs use `pgcrypto` cryptographic hashes; government IDs and cards are masked or stored as provider tokens.
  5. PostGIS `geography(Point, 4326)` columns are indexed with GiST.
  6. The `nearest_available_drivers` PostGIS function is callable exclusively by the `service_role`.
  7. Storage buckets (`identity-docs`, `driver-docs`, `vehicle-docs`, `handover-photos`) are private and restricted to `{auth.uid()}/...` folder paths.

---

## ADR 008: Phone OTP Auth & Driver Onboarding Flow

- **Status**: Accepted
- **Context**: Authentication in the Indian market (+91) uses phone OTP via Supabase Auth directly from the mobile app.
- **Decision**:
  1. The mobile app interacts directly with Supabase Auth for phone OTP request and verification.
  2. The backend validates the issued JWT and provides `POST /api/v1/auth/complete-signup`.
  3. The backend strictly enforces `role = 'driver'` on signup; any client-supplied role parameter is ignored.
  4. Signup sets `app_metadata.role = 'driver'` in Supabase Auth to enable RBAC route rejection for non-drivers on driver-facing endpoints.
  5. Signup is idempotent: subsequent calls return existing driver profiles without duplicating records.
  6. Every completed signup generates an audit log entry in `audit_logs`.

---

## Key Assumptions Made

### Phase 0 Assumptions

1. **Target Market**: India (INR currency, UPI / Razorpay payment gateways, phone OTP-based auth, Google Maps Indian road network).
2. **Vehicle Ownership**: Ryde is not a cab aggregator; customers supply their personal two, three, or four-wheelers. The driver app must support vehicle handover checklists and odometer tracking.
3. **Database Ownership**: Both backends share a single database, with Ryde Capital owning driver/trip/safety tables and Ryde owning customer/booking/payment tables.
4. **Mobile Workspace Isolation**: Expo mobile app operates in its own directory with dedicated scripts, coordinated by root scripts to avoid Metro bundler dependency hoist issues common in monorepos.

### Phase 1 Assumptions

1. **TRAI DLT SMS Regulation**: Commercial transactional SMS in India requires DLT entity registration, 6-character sender ID, and registered content templates. For local development, test phone numbers with fixed OTPs are configured under `[auth.sms.test_otp]`.
2. **Driver Role Exclusivity**: Ryde Capital backend endpoints serve drivers and reject customer tokens with 403 Forbidden via RBAC middleware.
3. **PostGIS Proximity Window**: Drivers are considered available for matching only if their location was updated within the last 10 minutes (`dl.updated_at >= now() - interval '10 minutes'`).
4. **Audit Log Immutability**: `audit_logs` is strictly append-only with no UPDATE or DELETE policies for any user, including admins.

---

## ADR 009: Driver Onboarding, Document Verification & KYC

- **Status**: Accepted
- **Context**: Ryde Capital requires driver identity, commercial/driving licenses, and background compliance verification before allowing drivers to accept customer vehicles.
- **Decision**:
  1. Drivers undergo a 5-step onboarding checklist: Personal Details (DOB 18+, address, 6-digit PIN code, experience), Vehicle Types, ID Proof (Aadhaar/PAN), Driving License (front, back, future expiry, class coverage), and Driver Selfie.
  2. Documents are uploaded directly from the mobile app to private Supabase storage buckets using short-lived signed upload URLs generated by `POST /drivers/me/documents/upload-url`, enforcing a 5 MB maximum size and strict MIME types (JPEG, PNG, PDF; PDF prohibited for selfies).
  3. Raw or unmasked government ID numbers and driving license numbers are strictly never stored in database tables; only masked values (e.g. `XXXX-1234`) and storage object paths are persisted.
  4. Drivers cannot mutate their own `onboarding_status`, `verification_status`, `rejection_reason`, or `submitted_at` directly in Postgres; this is enforced via database trigger guards (`guard_driver_updates()`).
  5. The transition from `in_progress` to `submitted` is allowed only through `POST /drivers/me/submit-for-review` after verifying that all 5 checklist steps are complete.
  6. Admin reviews occur through dedicated endpoints (`/api/v1/admin/drivers`), where document images are accessed via short-lived (60 seconds) signed URLs.
  7. Every admin document access, approval, and rejection writes an immutable `audit_logs` record, and driver approvals/rejections insert an in-app `notifications` row.
  8. A background cron job runs daily to flag drivers with expired licenses and transition their verification status to `expired` and availability to `offline`.

---

### Phase 2 Assumptions

1. **KYC Verification Provider**: Until an official third-party vendor (e.g., Setu, Karza, Surepass) is integrated, identity verification uses the `IdentityVerificationProvider` interface with a `MockIdentityVerificationProvider` that auto-passes unless configured otherwise.
2. **License Classes & MV Act Rules**: License classes map to platform vehicle types according to the Motor Vehicles Act (MCWG -> two_wheeler, 3W-CAB / AUTO -> three_wheeler, LMV -> four_wheeler).
3. **Signed URL TTL**: Admin document review URLs are strictly short-lived (60 seconds) to prevent leakage of sensitive KYC documents.
4. **Mobile Route Guarding**: Drivers with `onboarding_status !== 'approved'` are restricted to the `/(onboarding)` flow and prevented from entering the dashboard tabs.

---

## ADR 010: Availability, Live Telemetry, Matching Engine, Atomic Assignments & Maps Integration

- **Status**: Accepted
- **Context**: Phase 3 requires approved drivers to go online on a live map, stream high-frequency GPS telemetry, receive ride offers from the backend matching engine, and safely accept/reject offers with guaranteed atomic concurrency.
- **Decision**:
  1. **Availability Lifecycle**:
     - Only approved drivers (`onboarding_status = 'approved'`) can toggle availability.
     - Going online requires a recent location breadcrumb recorded in the DB within the last 10 minutes.
     - Drivers cannot go offline during an active trip (`status IN ('assigned', 'dispatched', 'arrived_at_pickup', 'started')`).
     - A background cron job (`staleDriverCheck`) sweeps every 30 seconds and automatically sets drivers offline if their location has not updated in the past 2 minutes.
  2. **Zero-Cost Telemetry Stream**:
     - Driver location updates stream directly to the application database via `POST /drivers/me/location` and `POST /drivers/me/location/batch` (up to 20 breadcrumbs for offline reconnections).
     - Location updates are written to `driver_locations` (upsert) and appended to `trip_locations` when the driver is on an active trip.
     - Location writes never invoke external Google Maps APIs, eliminating per-ping map telemetry costs.
     - Telemetry is validated against coordinate bounds (lat: -90 to 90, lng: -180 to 180), timestamp staleness (>10m rejected) or future drift (>1m rejected), impossible vehicular speeds (>200 km/h dropped), and poor accuracy (>100m dropped), with a per-driver rate limit (1 req/sec).
  3. **Maps Service Architecture & Fallbacks**:
     - Google Directions and Distance Matrix APIs are centralized in `@ryde/shared/services/maps` with a 15-minute in-memory LRU cache to minimize API billing.
     - Retries with exponential backoff and timeouts ensure resilience against transient network failures.
     - If Google APIs are unavailable, the service automatically falls back to an offline Haversine distance calculator with estimated urban traffic speeds and straight-line polyline encoding.
     - The mobile client is strictly forbidden from directly calling Google Maps APIs for routing, pricing, or ETA calculations.
  4. **Matching Engine Worker**:
     - A background matching worker polls for `bookings` with status `searching` using PostgreSQL `FOR UPDATE SKIP LOCKED` to allow multiple concurrent worker instances without duplicate offers.
     - For each eligible booking, the worker queries `nearest_available_drivers` within an expanding radius (3 km -> 5 km -> 8 km).
     - Offers are dispatched sequentially to ONE driver at a time, nearest first, with a configurable 20-second timeout.
     - Each offer inserts a `driver_assignments` row with precalculated distance and ETA to pickup, triggering an instant push to the driver's device via Supabase Realtime Change Data Capture (CDC).
     - Customer phone numbers are strictly stripped from assignment offers to preserve passenger privacy before trip confirmation.
     - If all candidate drivers reject or time out across all radius steps, the booking transitions to `no_driver_found`.
  5. **Atomic Assignment Concurrency**:
     - `POST /assignments/:id/accept` executes an atomic PostgreSQL transaction via `accept_driver_assignment(assignment_id, driver_id)`.
     - Uses row-level locks on `driver_assignments`, `bookings`, and `drivers` to verify that the offer is unexpired and still `offered`, the booking is still `searching`, and the driver has no active trip.
     - If two drivers race to accept the same booking, exactly one succeeds (creates the trip and updates booking to `driver_assigned`); the second receives a clean 409 Conflict (`BOOKING_ALREADY_ASSIGNED`).
  6. **Mobile Live Map & Route Preview**:
     - Mobile application uses Expo Dev Client (`expo-dev-client`) with separate restricted Google Maps API keys for Android and iOS.
     - Home screen features full-screen `react-native-maps` with custom vehicle markers, status banners (Offline, Online & Waiting, Weak GPS), and interactive toggle.
     - Adaptive location tracking via `expo-location` and `expo-task-manager` switches between 25-second idle intervals and 5-second active trip intervals, with an offline buffer queue.
     - Ride offers display an in-app modal with an optional "Preview Full Route" in-app modal (rendering pickup/destination pins and decoded polyline) without leaving the app or resetting the server-synchronized countdown timer.

---

### Phase 3 Assumptions

1. **Google Maps API Cost Optimization**: Google APIs are called strictly server-side for routing and ETAs with an aggressive 15-minute LRU cache. In-flight GPS breadcrumbs are persisted directly in Postgres PostGIS, keeping per-ping telemetry cost at $0.
2. **Realtime CDC Delivery**: Supabase Realtime broadcasts on `driver_assignments` filter events by `driver_id=eq.{driverId}`, relying on Row-Level Security to prevent cross-driver offer snooping.
3. **Offer Timeout Defaults**: The offer countdown defaults to 20 seconds. If neither accepted nor rejected, the matching engine marks the offer `expired` on its next tick and cascades to the next nearest candidate.
4. **Simulator-Driven Dispatch**: Because the customer app is not yet deployed, all booking generation is driven by the CLI booking simulator (`scripts/booking-simulator`), which provisions bookings with status `searching` in proximity to online drivers.

