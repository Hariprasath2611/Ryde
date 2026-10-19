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
- **Decision**: Vitest + Supertest for backends and shared package; Jest + React Native Testing Library for mobile frontends.
- **Rationale**: Vitest provides ultra-fast native ESM execution for modern Node.js and TypeScript, while Jest with jest-expo is the standard testing setup for React Native components.

---

## Key Assumptions Made in Phase 0

1. **Target Market**: India (INR currency, UPI / Razorpay payment gateways, phone OTP-based auth, Google Maps Indian road network).
2. **Vehicle Ownership**: Ryde is not a cab aggregator; customers supply their personal two, three, or four-wheelers. The driver app must support vehicle handover checklists and odometer tracking.
3. **Database Ownership**: Both backends share a single database, with Ryde Capital owning driver/trip/safety tables and Ryde owning customer/booking/payment tables.
4. **Mobile Workspace Isolation**: Expo mobile app operates in its own directory with dedicated scripts, coordinated by root scripts to avoid Metro bundler dependency hoist issues common in monorepos.
