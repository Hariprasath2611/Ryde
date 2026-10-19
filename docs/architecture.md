# Ryde Platform Architecture

## Executive Overview
Ryde is an on-demand mobility platform operating in India that pairs vehicle owners with professional drivers to operate the **customer's personal vehicle** (two-wheelers, three-wheelers, and four-wheelers). Ryde is strictly a driver-on-demand service, not a taxi/cab fleet.

```
+-----------------------------------------------------------------------------------+
|                                  RYDE PLATFORM                                    |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   +--------------------------+                  +-----------------------------+   |
|   |  Ryde Capital (Driver)   |                  |       Ryde (Customer)       |   |
|   |  Expo App (React Native) |                  |   Expo App (React Native)   |   |
|   +------------+-------------+                  +--------------+--------------+   |
|                | (HTTP / REST)                                 | (HTTP / REST)    |
|                v                                               v                  |
|   +--------------------------+                  +-----------------------------+   |
|   |   Ryde Capital Backend   |                  |        Ryde Backend         |   |
|   |   (Express + TypeScript) |                  |    (Express + TypeScript)   |   |
|   +------------+-------------+                  +--------------+--------------+   |
|                |                                               |                  |
|                | (Service-Role Connection)                     |                  |
|                v                                               v                  |
|   +---------------------------------------------------------------------------+   |
|   |                       SUPABASE (PostgreSQL + PostGIS)                     |   |
|   |                                                                           |   |
|   |   +---------------------------+       +-------------------------------+   |   |
|   |   |   Driver Domain Tables    |       |    Customer Domain Tables     |   |   |
|   |   |  - driver_profiles        |       |   - customer_profiles         |   |   |
|   |   |  - driver_availability    |       |   - vehicles                  |   |   |
|   |   |  - assignments            |       |   - bookings                  |   |   |
|   |   |  - trips                  |       |   - payments                  |   |   |
|   |   |  - driver_locations (GIS) |       |   - ratings                   |   |   |
|   |   |  - driver_earnings        |       |                               |   |   |
|   |   |  - sos_events             |       |                               |   |   |
|   |   +---------------------------+       +-------------------------------+   |   |
|   |                                                                           |   |
|   |                    Realtime Change Data Capture (CDC)                     |   |
|   +-------------------------------------+-------------------------------------+   |
|                                         |                                         |
|                                         v                                         |
|                         Realtime Broadcast / Event Bus                            |
+-----------------------------------------------------------------------------------+
```

---

## Core Tenets

### 1. Dual Independent Applications
- **Ryde Capital**: Driver-facing application and dedicated backend managing driver onboarding, KYC documents, availability states, trip assignment dispatch, turn-by-turn vehicle handover inspection, location telemetry, and safety/SOS.
- **Ryde**: Customer-facing application and backend managing customer profiles, registered personal vehicle records, booking requests, fare calculations, and payment settlements.

### 2. Single Shared PostgreSQL + PostGIS Database
Both backends point to the **same** underlying Supabase instance.
- Avoids distributed database dual-writes and distributed 2PC transactions.
- PostGIS provides spatial calculations (driver-to-customer proximity indexing, geo-fencing).

### 3. Strict Inter-Service Communication via Database & Supabase Realtime
- **Golden Rule**: Backends **NEVER** call each other directly via HTTP or RPC.
- All cross-domain workflows happen through state transitions in database tables:
  1. A customer requests a driver in Ryde Backend -> row inserted into `bookings`.
  2. Matching engine creates rows in `assignments` table.
  3. Ryde Capital listens via Supabase Realtime CDC to dispatch notifications to nearby drivers.
  4. Driver accepts -> assignment status updated to `accepted`, which triggers `trips` record creation.

### 4. Row Level Security (RLS) First
- Every table has RLS explicitly enabled from inception.
- Backends connect using Supabase `service_role` keys with strict domain boundary checks.
- Direct mobile client queries adhere strictly to RLS policies.
