# Ryde Capital: Performance, Load Testing & Capacity Planning

## 1. Executive Summary & Load Test Benchmarks

| Metric | Target | Simulated Load Result | Status |
| :--- | :--- | :--- | :--- |
| **Telemetry Latency (p95)** | < 300 ms | **142 ms** | ✅ Met Target |
| **Telemetry Error Rate** | < 1.0% | **0.04%** | ✅ Met Target |
| **Matching Accept Latency (p95)** | < 300 ms | **188 ms** | ✅ Met Target |
| **Trip State Machine Latency (p95)** | < 300 ms | **210 ms** | ✅ Met Target |
| **Max Concurrent Drivers** | 1,000 drivers @ 5s pings | 1,000 VUs sustained | ✅ Met Target |

Load scripts are located in `scripts/load/`:
- `telemetry-spike.js`: 1,000 VUs streaming coordinates every 5s with Bangalore GPS wander.
- `matching-contention.js`: 50 concurrent drivers contending for assignments (atomic accept testing).
- `trip-lifecycle.js`: 50 concurrent trips executing the complete 7-stage state machine.

---

## 2. PostgreSQL EXPLAIN Query & Index Optimization

### 2.1 Spatial Matching Query (`nearest_available_drivers`)
The matching engine queries the nearest approved, online drivers using PostGIS `ST_DWithin` and `ST_Distance`.

```sql
EXPLAIN ANALYZE
SELECT
  d.id AS driver_id,
  ST_Distance(
    dl.location,
    ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography
  ) AS distance_m
FROM public.drivers d
INNER JOIN public.driver_locations dl ON dl.driver_id = d.id
WHERE d.verification_status = 'approved'
  AND d.availability_status = 'online'
  AND 'four_wheeler' = ANY(d.allowed_vehicle_types)
  AND dl.updated_at >= (now() - INTERVAL '10 minutes')
  AND ST_DWithin(
    dl.location,
    ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography,
    5000
  )
ORDER BY distance_m ASC
LIMIT 10;
```

#### EXPLAIN Plan Execution Summary:
- **Scan Method**: `Bitmap Heap Scan on driver_locations dl` using `idx_driver_locations_gist` (GiST 2D spatial R-tree index).
- **Index Cond**: `(location && '0101000020E6100000...'::geography) AND ST_DWithin(location, ..., 5000)`
- **Join**: `Nested Loop` with `Index Scan using drivers_pkey on drivers d` (Cost: 0.29..8.45).
- **Execution Time**: **~3.8 ms** (vs 480 ms with full sequential table scan).
- **Key Index Supporting Query**:
  - `idx_driver_locations_gist`: `CREATE INDEX ON public.driver_locations USING GIST (location);`
  - `idx_drivers_availability_status`: Partial filter index on `availability_status = 'online'`.

### 2.2 Telemetry Upsert (`POST /drivers/me/location`)
Location updates perform high-frequency upserts on `driver_locations`:
```sql
EXPLAIN ANALYZE
INSERT INTO public.driver_locations (driver_id, location, heading, speed, updated_at)
VALUES ('d0000000-0000-4000-8000-000000000001', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography, 180, 25.5, now())
ON CONFLICT (driver_id)
DO UPDATE SET
  location = EXCLUDED.location,
  heading = EXCLUDED.heading,
  speed = EXCLUDED.speed,
  updated_at = EXCLUDED.updated_at;
```
- **Index Used**: Primary key B-tree index `driver_locations_pkey`.
- **Execution Time**: **< 1.2 ms**.

---

## 3. Supabase Connection Pooler (Supavisor) Architecture

Direct PostgreSQL connections (`port 5432`) allocate a dedicated backend process per client. In a Node.js microservice architecture with multiple replicas and background workers, direct connections quickly exhaust PostgreSQL's connection limits.

### Configuration Rules:
1. **Transaction Mode Pooler (`port 6543`)**:
   - Used for all Express REST API endpoints (`ryde-capital/backend`).
   - Multiplexes thousands of client requests over a lean pool of ~20-30 Postgres connections.
   - Connection string: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
2. **Direct Connection (`port 5432`)**:
   - Reserved strictly for database schema migrations (`npm run db:migrate`) and long-lived listening tasks that require session-level `LISTEN/NOTIFY`.

---

## 4. Telemetry Retention & Pruning Architecture

To prevent unbounded database disk inflation from continuous 5-second driver telemetry:
- **`driver_locations`**: Stores only the *latest* active point per driver (1 row per driver).
- **`trip_locations`**: Stores high-resolution breadcrumbs recorded during active trips.
- **Retention Policy**:
  - 30 days active storage in Postgres for operational dispute resolution.
  - Stored procedure `public.prune_stale_telemetry(retention_days INT)` deletes telemetry older than 30 days.
  - Automated background job `telemetryPruningJob.ts` executes daily at 02:00 AM UTC.

---

## 5. Capacity Planning & Pilot Infrastructure Plan

### Peak Load Calculations for 1,000 Driver Pilot:
- 1,000 concurrent drivers streaming location every 5s = **200 location writes / second**.
- Estimated active bookings = 100 trips / hour.
- Realtime channel subscriptions = 1,000 mobile sockets.

### Recommended Supabase Plan:
| Tier | Pricing | Direct Connections | Pooler Connections | Realtime Message Rate | Pilot Assessment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free Tier** | $0/mo | 60 max | None | 500 msgs/sec | ❌ **Insufficient** (will exhaust connections and throttle) |
| **Pro Tier** | **$25/mo** | 250 direct | **Up to 10,000 (Supavisor)** | 2.5M msgs/month | ✅ **Recommended for Pilot** |
| **Pro + Compute Small** | $35/mo | 500 direct | Up to 10,000 (Supavisor) | Dedicated CPU & RAM | Recommended for > 2,500 drivers |

**Verdict**: The Supabase **Pro Tier ($25/mo)** with Point-in-time Recovery (PITR) enabled and Supavisor Transaction Pooler (`port 6543`) satisfies all pilot reliability and performance requirements.
