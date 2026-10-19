# Ryde Platform

> On-demand professional driver platform for personal vehicles (India).

Ryde connects customer vehicle owners (two-, three-, and four-wheelers) with vetted, professional drivers on demand. Ryde is **not** a taxi/cab aggregator; drivers operate the customer's personal vehicle.

---

## Architecture & Monorepo Overview

The platform is structured as an npm workspaces monorepo containing two distinct application domains sharing a single Supabase database:

- **Ryde Capital**: Professional Driver mobile app (Expo) and backend (Express + TypeScript).
- **Ryde**: Customer mobile app (Expo) and backend (Express + TypeScript) [Placeholder for Phase 3].
- **Shared**: Common TypeScript types, domain constants, Supabase client factories, logging, and error primitives (`@ryde/shared`).

```
ryde-platform/
├── database/
│   ├── supabase/config.toml # Local Supabase configuration
│   ├── migrations/          # Forward-only SQL migrations (001_name.sql)
│   ├── policies/            # Row Level Security (RLS) definitions
│   ├── functions/           # Database triggers and PostGIS functions
│   ├── seed.sql             # Development and testing seed data
│   └── README.md            # Naming conventions & domain ownership rules
├── shared/                  # npm workspace package: @ryde/shared
│   ├── src/
│   │   ├── constants/       # Roles, booking/trip/assignment statuses, vehicle types
│   │   ├── lib/             # Supabase service client, pino logger, AppError classes
│   │   ├── services/        # Empty interface stubs (otp, maps, notifications)
│   │   └── types/           # Supabase DB types placeholder
│   ├── tests/
│   └── package.json
├── ryde-capital/
│   ├── backend/             # @ryde/capital-backend (Express + TypeScript)
│   │   ├── src/
│   │   │   ├── config/      # Zod-validated environment config & Supabase client
│   │   │   ├── middleware/  # auth (Supabase JWT), rbac, validate, rateLimit, errorHandler
│   │   │   ├── modules/     # auth, driver, availability, assignments, trips, location, earnings, safety
│   │   │   ├── realtime/    # Supabase Realtime subscriptions placeholder
│   │   │   ├── jobs/        # Background jobs placeholder
│   │   │   ├── app.ts       # Express app and route mounting under /api/v1
│   │   │   └── server.ts    # HTTP server with graceful shutdown
│   │   ├── tests/           # Vitest + Supertest integration tests
│   │   └── package.json
│   └── mobile/              # Expo TypeScript Driver App with Expo Router
│       ├── app/             # Expo Router file-based routes ((auth), (onboarding), (tabs), trip)
│       ├── src/
│       │   ├── components/  # Reusable UI components
│       │   ├── features/    # Driver feature modules
│       │   ├── services/    # API client with automatic Supabase JWT attachment
│       │   ├── store/       # State management
│       │   ├── hooks/       # Custom hooks
│       │   ├── theme/       # Design tokens (colors, spacing, typography)
│       │   └── utils/       # Utility helpers
│       ├── tests/           # Jest + React Native Testing Library tests
│       └── package.json
├── ryde/
│   ├── backend/             # Placeholder @ryde/customer-backend (README + package.json)
│   └── mobile/              # Placeholder customer Expo app (README)
├── admin-dashboard/         # Placeholder operations & admin dashboard (README)
├── docs/
│   ├── architecture.md      # Dual-app single-DB architecture & communication rules
│   ├── decisions.md         # Architectural Decision Records (ADRs) & assumptions
│   └── api/
│       └── ryde-capital.openapi.yaml # OpenAPI 3.0 specification for Driver API
├── scripts/
│   └── booking-simulator/   # Placeholder trip lifecycle simulator (README)
├── .github/workflows/
│   └── ci.yml               # GitHub Actions CI workflow (lint, typecheck, test)
├── .editorconfig
├── .gitignore               # Ignores all .env* except .env.example
├── .prettierrc
├── .eslintrc
├── tsconfig.base.json       # Base strict TypeScript config extended by all packages
└── README.md
```

---

## Prerequisites

- **Node.js**: v20.x or higher (`node -v`)
- **npm**: v10.x or higher (`npm -v`)
- **Supabase CLI** (optional for local DB emulation): `npx supabase`

---

## Getting Started

### 1. Installation

Install all workspace and mobile dependencies with a single command from the root directory:

```bash
npm install
```

### 2. Environment Variables

Generate local `.env` files automatically across all packages using the pre-configured team dev templates:

```bash
npm run setup:env
```

_(This automatically generates `.env` files for `ryde-capital/backend`, `ryde-capital/mobile`, and `shared` with development Supabase credentials)._

---

## Available Commands

### Root Workspace Commands

| Command                | Description                                                   |
| :--------------------- | :------------------------------------------------------------ |
| `npm run setup:env`    | Generates all local `.env` files from templates for your team |
| `npm run lint`         | Runs ESLint across all workspaces and mobile app              |
| `npm run typecheck`    | Runs strict TypeScript compiler check across all packages     |
| `npm test`             | Executes test suites across backend, shared, and mobile       |
| `npm run format`       | Automatically formats all code using Prettier                 |
| `npm run format:check` | Verifies code conforms to Prettier formatting                 |

### Ryde Capital Backend

```bash
# Start backend in watch/development mode
npm run dev -w ryde-capital/backend

# Run Vitest test suite
npm test -w ryde-capital/backend

# Build production bundle
npm run build -w ryde-capital/backend
```

### Ryde Capital Mobile App

```bash
# Start Expo Metro bundler
npm run start --prefix ryde-capital/mobile

# Run Jest tests
npm test --prefix ryde-capital/mobile
```

---

## API Endpoints (Ryde Capital v1)

Base URL: `http://localhost:4000/api/v1`

- `GET /health` - Operational health check (status, uptime, version)
- `GET /auth/me` - Validates Supabase JWT and returns user identity & role
- _All other domain endpoints (driver, availability, assignments, trips, location, earnings, safety) return `501 Not Implemented` stubs conforming to `{ "error": { "code", "message", "requestId" } }`._

Refer to [`docs/api/ryde-capital.openapi.yaml`](file:///d:/work/Ryde/docs/api/ryde-capital.openapi.yaml) for full OpenAPI 3.0 documentation.
