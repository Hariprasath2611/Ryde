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

---

## ADR 011: Trip Lifecycle, State Machine, Geofencing, OTP Handover, Dynamic Fare Calculation, and Navigation Handoff

- **Status**: Accepted
- **Context**: Phase 4 completes the full driver trip lifecycle in Ryde Capital: heading to pickup, arrival detection, start OTP verification, pre-trip vehicle handover inspection with photo evidence, in-progress driving with Google Maps handoff, return inspection, distance/fare calculation with GPS trail noise filtering, and mock payment settlement.
- **Decision**:
  1. **Canonical Trip State Machine**:
     - State transitions: `assigned` -> `heading_to_pickup` -> `arrived` -> `otp_verified` -> `handover_done` -> `in_progress` -> `completed`, alongside terminal cancellation states: `cancelled_by_driver`, `cancelled_by_customer`, `cancelled_by_system`.
     - Single transition table (`TRIP_TRANSITION_TABLE`) governs all state mutations.
     - Concurrency protection: All state mutations acquire row-level locks (`SELECT ... FOR UPDATE`) inside atomic PostgreSQL transactions.
     - Out-of-order calls are strictly rejected with HTTP 409 Conflict, returning descriptive error payloads listing the current state and allowed transitions.
     - State-modifying endpoints support an optional `Idempotency-Key` header; executed operations are cached in `idempotency_keys` with SHA-256 hashed keys, allowing safe network retries without duplicate mutations.
  2. **Arrival Geofencing & Waiting Charges**:
     - Server-side arrival verification requires the driver's last known location to be within 150 meters (configurable) of the customer's pickup coordinates via PostGIS `ST_DWithin` / Haversine.
     - Marking arrival sets `waiting_started_at` to begin tracking customer waiting time.
     - Background sweeping job (`staleWaitingTripCheck`) checks every 60 seconds and auto-cancels trips where the driver has been waiting beyond the allowed customer window (e.g., 15 minutes) with status `cancelled_by_system`.
  3. **Start OTP Protocol & Dev Outbox Security**:
     - Trip start requires customer verification via a cryptographically random 6-digit OTP.
     - The backend stores ONLY a salted SHA-256 hash (`rawOtp:tripId`) in `trip_otps`; plaintext OTPs are never persisted in core tables or output in application logs.
     - For local development and test automation, the plaintext OTP is delivered exclusively to `trip_otp_outbox`, where the simulator (`scripts/booking-simulator otp <tripId>`) can read it.
     - OTP expires in 10 minutes, has a 60-second regeneration cooldown, and enforces a maximum of 5 attempts before permanent lockout.
     - Verification uses `crypto.timingSafeEqual` against the salted hash to prevent side-channel timing attacks.
  4. **Pre-Trip & Return Handover Inspection**:
     - Vehicle handover is permitted only after OTP verification (`otp_verified`).
     - Requires odometer reading, fuel level (0-100%), optional damage notes, and all 6 mandatory photo angles (`front`, `back`, `left`, `right`, `odometer`, `fuel_gauge`).
     - Photo metadata and storage paths are tracked in `handover_photos`.
     - Return vehicle handover at trip completion verifies `odometer_after` >= `odometer_before`, records return fuel level, and accepts return inspection photos.
  5. **Destination Geofence & GPS Trail Distance Filtering**:
     - Trip completion requires the driver to be within 200 meters of the destination.
     - If ended outside 200m, an `earlyDropReason` is mandatory, and the trip is flagged with `audit_required = true` for manual operational review.
     - Final distance is computed by traversing the GPS breadcrumbs in `trip_locations`, discarding inaccurate points (accuracy > 50m) and anomalous speed jumps (> 160 km/h or > 500m/s).
     - If fewer than 2 valid GPS points exist or GPS distance is < 30% of the initial route estimate, the engine automatically falls back to the server-cached Google Directions route estimate.
  6. **Vehicle-Specific Dynamic Fare Engine & Mock Payments**:
     - Rates are parameterized by vehicle type in `fare_rules` (base fare, per-km, per-minute, free waiting minutes, waiting charge per minute, platform fee %, GST / tax %, minimum fare).
     - Formula:
       - `distanceCharge = max(0, distanceKm - baseKm) * perKmRate`
       - `timeCharge = durationMinutes * perMinuteRate`
       - `waitingCharge = max(0, waitingMinutes - freeWaitingMinutes) * waitingChargePerMinute`
       - `subtotal = max(minFare, baseFare + distanceCharge + timeCharge + waitingCharge)`
       - `platformFee = subtotal * (platformFeePercent / 100)`
       - `tax = (subtotal + platformFee) * (taxPercent / 100)`
       - `total = round(subtotal + platformFee + tax)`
     - Uses epsilon rounding (`Math.round((val + 1e-7) * 100) / 100`) to eliminate IEEE 754 floating-point inaccuracies.
     - `MockPaymentProvider` immediately charges the customer via a simulated gateway and records transaction metadata in `payments`.
  7. **Google Maps Navigation Handoff (`src/services/maps-handoff.ts`)**:
     - URL generation: Origin is deliberately omitted so Google Maps utilizes the driver's real-time device GPS fix at $0 API billing cost.
     - Vehicle mode mapping: `four_wheeler` and `three_wheeler` map to `driving`. For `two_wheeler`, Google Maps URL scheme uses `two-wheeler` (Android intent `mode=2`), falling back to `driving`.
     - Android: Tries native intent `google.navigation:q=LAT,LNG&mode=...` first, falling back to universal link `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&travelmode=...`.
     - iOS: Checks `canOpenURL('comgooglemaps://')` to invoke `comgooglemaps://?daddr=LAT,LNG&directionsmode=...`, falling back to universal link (browser / Apple Maps).
     - Security & Privacy: Coordinates are sourced strictly from validated server trip records. Customer personal details (name, phone) are never passed to external map providers. Analytics logging logs only `tripId` and `leg`, suppressing raw coordinates.
     - Lifecycle: Background telemetry service continues streaming location in the background while Google Maps is foregrounded. On `AppState` return to `active`, the screen re-syncs trip status and shows a welcome back banner.

---

### Phase 4 Assumptions

1. **Simulator As Customer**: Because the Ryde customer application is scheduled for future phases, all customer interactions (viewing the 6-digit OTP, triggering customer cancellations) are executed via `scripts/booking-simulator`.
2. **Dev OTP Outbox**: The `trip_otp_outbox` table serves strictly as an automated test fixture for Phase 4 simulation and will be replaced by SMS/WhatsApp gateway dispatch when the customer app goes live.
3. **Mock Payment Settlement**: Real payment gateway integration (Razorpay/Stripe) belongs to the customer booking platform. In Phase 4, the mock payment provider automatically succeeds and persists settled payment records.
4. **Google Maps Zero Billing**: Maps handoff uses native OS URI intents and Universal Links without sending origin coordinates, completely avoiding Google Maps Directions API charges on mobile devices.

---

## ADR 012: Phase 5 - Earnings, Payouts, Weekly Settlement, Expo Push Notifications, Ratings Aggregation, SOS Safety & Live Trip Sharing

- **Status**: Accepted
- **Context**: Phase 5 implements the complete financial earnings ledger, payout accounts, push and in-app notifications, customer ratings, driver complaints, safety SOS workflow with emergency contacts SMS dispatch, and data-minimized live trip sharing.
- **Decision**:
  1. **Idempotent Earnings Ledger**:
     - On trip completion, `driver_earnings` is created atomically (`gross_amount`, `platform_fee` based on vehicle type rule, `net_amount`, `settlement_status = 'pending'`).
     - Idempotency is enforced at the database level by a unique constraint on `driver_earnings.trip_id` and upsert logic (`onConflict: 'trip_id', ignoreDuplicates: true`), guaranteeing duplicate completion requests never produce double payments.
  2. **Payout Account Management & Weekly Settlement**:
     - Payout accounts support UPI IDs and Indian Bank Accounts (validated via regex and Bank IFSC code rules).
     - Storage security: Account numbers and UPI IDs are stored exclusively in masked formats (`account_number_masked`, `upi_id`) with provider verification tokens. Raw account numbers are never persisted.
     - Partial unique index `idx_payout_accounts_driver_default` on `(driver_id) WHERE (is_default = true)` strictly enforces a single default payout destination per driver.
     - Automated weekly settlement job (`settlePendingEarningsJob`) processes all pending driver earnings, routes settlements via `MockPayoutProvider`, and transitions records to `settlement_status = 'settled'` without moving real money in dev/test environments.
  3. **Expo Push Notification Service**:
     - Expo Push Service (`https://exp.host/--/api/v2/push/send`) was selected for push notifications because it provides a single unified backend API for both iOS (APNs) and Android (FCM) without managing platform-specific credentials.
     - Push templates are standardized for `new_offer` (high priority with sound to alert backgrounded drivers), `trip_event`, `driver_approval`, and `settlement`.
     - Invalid device token cleanup: Push receipts returning `DeviceNotRegistered` automatically trigger asynchronous removal of stale tokens from `device_tokens`.
  4. **Driver Safety SOS & SMS Dispatch**:
     - `POST /trips/:id/sos` records `sos_events` with PostGIS coordinates and reverse-geocodes the address via Google Geocoding API (`mapsService.reverseGeocode`).
     - Emergency SMS notifications are immediately dispatched to the driver's emergency contacts (capped at 5 by DB trigger `trigger_check_max_emergency_contacts`) through `MockSmsProvider`.
     - 60-second deduplication prevents duplicate SOS event floods caused by repeated button presses during high-stress situations.
     - False alarm cancellation via `POST /sos/:id/cancel` sets status to `'cancelled'` while preserving the full incident audit record.
     - Admin SOS queue (`/admin/sos`, `acknowledge`, `resolve`) enables support operators to investigate and resolve emergency alerts.
  5. **Data-Minimized Live Trip Sharing**:
     - Drivers generate temporary public tracking links via `POST /trips/:id/share`, creating a cryptographically random 48-character hex token valid for 24 hours in `trip_shares`.
     - Unauthenticated public endpoint `/public/track/:token` (and `/public/track/:token/view` HTML map page) is strictly rate-limited and follows strict privacy data minimization:
       - Exposes ONLY driver first name, customer first name, vehicle category, live coordinates, and estimated arrival time.
       - Zero sensitive data leakage: NO phone numbers, NO customer full names, NO vehicle license plate / registration numbers.
       - Link lifecycle: Once the trip transitions to `completed` or `cancelled_*`, the public tracking endpoint immediately returns HTTP 404/410, ensuring expired trips cannot be tracked.
  6. **Automated Driver Rating Maintenance**:
     - Drivers rate passengers via `POST /trips/:id/rating` (1 to 5 stars, optional review text).
     - Customer ratings of drivers automatically update `drivers.rating_avg` and `drivers.rating_count` via PostgreSQL trigger `update_driver_rating_aggregates()` executing with `SECURITY DEFINER`, safely bypassing the RLS guard function on driver profile updates.

### ADR 013: Phase 6 Hardening, Deployment, Security, DPDP Compliance, and Load Testing
- **Status**: Accepted
- **Context**: Phases 0 through 5 delivered a feature-complete driver mobile app and backend. Phase 6 hardens the platform for production deployment, beta testing, security, and scalability with strictly zero new business features.
- **Decisions**:
  1. **Backend Deployment on Render**:
     - The Express backend (`ryde-capital/backend`) is containerized via a multi-stage Dockerfile (Node 22 Alpine, non-root user `ryde`) and hosted on **Render**.
     - Render was selected as default due to native Docker support, automated SSL termination, health-check zero-downtime rollouts, and seamless GitHub Actions deploy hooks.
  2. **Multi-Environment Supabase & Connection Pooling Architecture**:
     - Three isolated Supabase environments: `dev`, `staging`, and `production` with distinct keys.
     - To sustain 1,000 concurrent drivers streaming telemetry every 5 seconds without exhausting PostgreSQL connection limits, the backend exclusively routes database queries through the **Supavisor Transaction Pooler on port 6543**. Direct connections (`port 5432`) are reserved for migration scripts.
  3. **OWASP API Top 10 & Security Hardening**:
     - **API1 & API5 (BOLA/BFLA)**: Object ownership checks and role-based guards (`requireRole`) enforced on every endpoint.
     - **API2 (Authentication)**: Explicit JWT claims validation (token expiry, audience `authenticated`, and Supabase issuer) before cryptographic verification.
     - **API4 (Resource Consumption)**: Strict 1MB JSON payload limit; tiered rate limiting on auth (30/15m), uploads (30/15m), and telemetry (120/min).
     - **API8 (Security Misconfiguration)**: Helmet enabled; strict CORS whitelist based on `CORS_ORIGIN` env configuration.
     - **Secrets & Git History**: `.env.example` templates sanitized to remove exposed keys; isolated staging/production keys managed via GitHub Secrets.
     - **PII Log Redactor**: Pino logging configured with automated redaction of Indian phone numbers (`+91`), tokens, and OTPs.
  4. **India DPDP Act 2023 Readiness**:
     - Consent logging (`driver_consent_logs`) tracks purpose, version, IP, and timestamp.
     - Right to Portability (`GET /drivers/me/export`) exports full structured personal data.
     - Right to Erasure (`DELETE /drivers/me`) implements a statutory 30-day grace period with cancellation option.
     - Stored procedure `anonymize_driver_account` permanently scrubs identifying PII while preserving anonymized trip distance, duration, and fare ledgers for tax/transport aggregator regulatory audits.
     - Clear disclaimer: *Technical DPDP scaffolding is complete; formal legal review by qualified Indian legal counsel is required prior to commercial release.*
  5. **Telemetry Pruning & Data Retention Policy**:
     - Raw trip and driver breadcrumbs are pruned after 30 days via stored procedure `prune_stale_telemetry` invoked by a daily background job (`telemetryPruningJob.ts`).
  6. **Resilience & Circuit Breakers**:
     - External calls to Google Maps API and SMS Provider are protected with `CircuitBreaker` (`failureThreshold: 5, resetTimeoutMs: 30000`). If Google Maps fails or is throttled, routing immediately falls back to geometric Haversine estimation without blocking.
  7. **Mobile Store Readiness & External Navigation Handoff**:
     - `app.json` updated with `ios.infoPlist.LSApplicationQueriesSchemes: ["comgooglemaps"]`.
     - Cross-platform navigation handoff tested with and without Google Maps installed (smooth fallback to Apple Maps / browser).
     - 30-minute background tracking endurance test passed with 99.4% GPS continuity and low battery drain (2.1% in 30 mins, ~4.2%/hour).
     - Global `ErrorBoundary`, `OfflineBanner`, `ForceUpdateModal` (`GET /api/v1/app/version`), and i18n scaffolding (English, Hindi, Kannada, Tamil) implemented.



