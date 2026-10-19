# Runbook: Production Rollback Procedure

## 1. Rollback Scenarios & Strategies

This runbook covers rollbacks across three distinct layers:
1. **Backend API Service (Render / Docker)**
2. **Database Migrations (Supabase PostgreSQL)**
3. **Mobile Application (EAS Build / EAS Update)**

---

## 2. Layer 1: Backend API Service Rollback

### Step-by-Step Procedure:
1. **Identify Last Known Good Commit**:
   - Locate the previous green deployment SHA in GitHub Actions or Render dashboard.
2. **Execute Immediate Redeployment**:
   - Via Render Dashboard: Navigate to `ryde-capital-backend` -> `Deploys` -> Select previous stable deployment -> Click **Rollback to this deploy**.
   - Via GitHub Actions: Re-run the previous successful deployment workflow for production.
3. **Verify API Health Probes**:
   ```bash
   curl -i https://api.ryde.capital/api/v1/health/readiness
   ```
4. **Invalidate Stale Caches**:
   - Purge Cloudflare / CDN edge caches for API endpoints if caching is enabled.

---

## 3. Layer 2: Database Migration Reversal / Rollback

> [!CAUTION]
> In production, Ryde follows **backward-compatible migrations** (expand-and-contract pattern). Schema migrations should NEVER break old backend versions.

### Rollback Process:
1. **Non-Breaking Migrations (Additive columns, new tables)**:
   - Do NOT immediately drop tables or columns if rolling back backend code. The older backend code will simply ignore the new columns.
2. **Destructive / Faulty Migration Reversal**:
   - If a constraint or index causes lock contention or performance degradation:
     ```sql
     -- Drop faulty index concurrently without table locks
     DROP INDEX CONCURRENTLY IF EXISTS public.<faulty_index_name>;

     -- Drop offending trigger or constraint
     ALTER TABLE public.<table_name> DROP CONSTRAINT IF EXISTS <constraint_name>;
     ```
3. **Write and Apply Remediation Migration**:
   - Never edit past migration files (`NNN_*.sql`). Always create a new forward migration (e.g. `018_revert_*.sql`) and apply to staging first, then production.

---

## 4. Layer 3: Mobile Client Rollback & Force-Update

### 4.1 EAS Over-The-Air (OTA) Update Rollback:
If a bad JS bundle was published via EAS Update:
```bash
# Re-publish previous known good update to production channel
eas update --channel production --message "Rollback to stable release"
```

### 4.2 Critical Native Binary Bug (Force-Update Activation):
If the native binary crashes or has a security vulnerability that cannot be fixed via OTA:
1. Update `MIN_APP_VERSION` in backend environment or configuration:
   ```env
   # Increment MIN_APP_VERSION to force older clients to update
   MIN_APP_VERSION=1.0.2
   ```
2. The mobile client queries `GET /api/v1/app/version` on launch and resume.
3. Drivers running `< 1.0.2` will receive a non-dismissible Force Update modal redirecting them to the Google Play Store or Apple App Store.
