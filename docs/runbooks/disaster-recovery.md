# Runbook: Supabase Disaster Recovery & Point-In-Time Restore (PITR) Drill

## 1. Objectives & Service Level Objectives
- **Recovery Point Objective (RPO)**: < 5 minutes of data loss.
- **Recovery Time Objective (RTO)**: < 30 minutes from incident declaration to traffic restoration.
- **Target Environments**: Supabase Staging (`ryde-staging`) & Production (`ryde-prod`).

---

## 2. Backup Architecture & Policies
1. **Daily Physical Backups**:
   - Automated full database snapshots taken daily at 00:00 UTC and retained for 30 days.
2. **Point-In-Time Recovery (PITR)**:
   - Continuous Write-Ahead Log (WAL) archiving enabled via physical streaming replication.
   - Allows restoring the database to any millisecond within the last 7 days.
3. **Storage Backups**:
   - Supabase S3 storage buckets (`driver-docs`, `identity-docs`, `vehicle-docs`, `handover-photos`) configured with Cross-Region Object Replication.

---

## 3. Step-by-Step Restoration Drill Procedure

### Phase 1: Incident Assessment & Declaration
1. Identify database corruption, accidental catastrophic deletion, or infrastructure failure.
2. Freeze application traffic to prevent inconsistent writes:
   - On Render (backend): Scale web service to maintenance mode or set `MAINTENANCE_MODE=true`.
   - Update `MIN_APP_VERSION` to trigger force update / maintenance screen on mobile apps.
3. Determine target restore timestamp $T_{\text{restore}}$ (e.g., 2 minutes prior to corruption event).

### Phase 2: Execute Point-in-Time Restore (Supabase Dashboard / CLI)
1. **Via Supabase Dashboard**:
   - Navigate to `Database` -> `Backups` -> `Point in time`.
   - Select the target timestamp $T_{\text{restore}}$ in UTC.
   - Click **Prepare Restore**.
   - Choose **Restore to a New Project** (recommended to verify before swapping DNS) or **In-place Restore**.
2. **Via Supabase Management API / CLI**:
   ```bash
   # Restore project to specific timestamp
   supabase projects restore --project-ref <prod-project-ref> --timestamp "2026-10-19T14:30:00Z"
   ```

### Phase 3: Post-Restore Verification Checklist
Run the verification script against the restored database:
```sql
-- 1. Check Row Count Sanity
SELECT count(*) FROM public.profiles;
SELECT count(*) FROM public.drivers;
SELECT count(*) FROM public.trips;
SELECT count(*) FROM public.driver_earnings;

-- 2. Verify Row Level Security is active
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- 3. Verify spatial and postgis extension functions
SELECT public.nearest_available_drivers(12.9716, 77.5946, 5000, 'four_wheeler', 10);
```

### Phase 4: Traffic Cutover & Validation
1. Update backend environment variables with new connection string / pooler port `6543`.
2. Redeploy backend services on Render.
3. Verify deep health check endpoint:
   ```bash
   curl -i https://api.ryde.capital/api/v1/health/readiness
   # Must return HTTP 200 with database: "connected"
   ```
4. Release maintenance mode and monitor error rate alerts for 60 minutes.
