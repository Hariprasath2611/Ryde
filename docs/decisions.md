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

