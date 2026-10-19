# Ryde Database Architecture & Guidelines

This directory houses the shared Supabase (PostgreSQL + PostGIS) database configuration, migrations, policies, and seed data for the Ryde Platform.

Both **Ryde** (Customer App backend) and **Ryde Capital** (Driver App backend) share this single database instance.

---

## 1. Migration Naming Convention

All migrations live under [`database/migrations/`](file:///d:/work/Ryde/database/migrations).

Migrations must follow a strict three-digit sequential ordering prefix with descriptive snake_case:

```text
001_create_roles_and_enums.sql
002_create_driver_profiles.sql
003_create_bookings_and_trips.sql
```

- **Format**: `NNN_description.sql` (3 digits, zero-padded, starting at `001`).
- Migrations are strictly forward-only and managed via Supabase CLI (`npx supabase db diff`, `npx supabase migration new`).
- Each migration must be idempotent and transactional where possible.

---

## 2. RLS-First Rule (Row Level Security)

**Mandatory Rule**: Every single table created in this database MUST have Row Level Security enabled immediately upon creation:

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

- Direct table access via Supabase Client (using anon or authenticated keys) is restricted by RLS policies located in [`database/policies/`](file:///d:/work/Ryde/database/policies).
- Backend services use the Supabase `service_role` key strictly for authorized server-to-database operations, but service-role operations must still enforce domain boundaries in application logic.
- No public unrestricted access is permitted on any table.

---

## 3. Table Ownership & Boundaries

Tables are strictly partitioned by domain ownership between the two backends. Backends **never** mutate tables owned by the other backend directly.

### Ryde Backend (Customer App Domain)

Owns tables related to customers, vehicles, booking intents, payments, and ratings:

- `customers` / `customer_profiles`
- `vehicles` (customer-owned two, three, or four-wheelers)
- `bookings` (customer ride requests and booking intents)
- `payments` (UPI / Razorpay transactions, refunds, customer invoices)
- `ratings` (customer-submitted driver reviews & ratings)

### Ryde Capital Backend (Driver App Domain)

Owns tables related to drivers, availability, assignment dispatch, trip execution, telemetry, and safety:

- `driver_profiles` (KYC documents, license verification, vehicle capability)
- `driver_availability` (online/offline status, current shift state)
- `assignments` (driver dispatch offers, acceptance, rejection)
- `trips` (active driver trip lifecycle, odometer readings, vehicle handover, start/end OTPs)
- `driver_locations` (real-time driver coordinates via PostGIS)
- `driver_earnings` (payouts, incentives, platform commissions)
- `sos_events` / `emergency_contacts` (driver safety alerts and contacts)

### Inter-Service Communication

The backends communicate exclusively via:

1. PostgreSQL table state updates.
2. Supabase Realtime subscriptions (Postgres CDC replication).
3. Backends **never** perform direct HTTP calls to one another.

---

## 4. Auth & Phone OTP Configuration (+91 India Market)

Phone authentication is handled directly between the client mobile applications and Supabase Auth (`auth.signInWithOtp` / `auth.verifyOtp`):

- **Market**: India (`+91`).
- **OTP Length**: 6 digits.
- **OTP Expiry**: 5 minutes (300 seconds).
- **Resend Interval**: 30 seconds minimum cooldown.
- **Email & Anonymous Signups**: Disabled in project configuration.

### Regulatory Compliance: TRAI DLT Registration (India)

Under Telecom Regulatory Authority of India (TRAI) regulations, commercial transactional SMS in India must comply with **Distributed Ledger Technology (DLT)** requirements:

1. **Entity Registration**: The business entity must be registered as an Enterprise on a telecom DLT portal (e.g. Jio, Airtel, Vodafone Idea, BSNL).
2. **Sender ID (Header)**: A 6-character alpha Header (e.g. `RYDEIN`, `RYDECP`) must be approved on the DLT platform under the Service Implicit / Transactional category.
3. **SMS Content Template Registration**: Every transactional SMS template must be registered and approved. The OTP message template:
   ```text
   Your Ryde verification code is {#var#}. Valid for 5 minutes. Do not share this OTP with anyone. - Ryde
   ```
4. **Provider Configuration**:
   When connecting SMS providers (such as Twilio, Textlocal, or Gupshup) in production, the registered **Entity ID (Principal Entity ID)** and **Template ID** must be configured on the provider console; otherwise, Indian telecom operators will drop the SMS packets.
5. **Local Development**:
   For local testing without live SMS delivery, predefined test phone numbers (e.g. `+919876543210`) with fixed OTP `123456` are configured under `[auth.sms.test_otp]` in `database/supabase/config.toml`.

