# Runbook: Production Release Checklist

## 1. Pre-Flight Verification (T-24 Hours)

- [ ] **Typecheck**: `npm run typecheck` succeeds across all workspaces (`shared`, `capital-backend`, `capital-mobile`) with 0 errors.
- [ ] **Unit & Integration Tests**: `npm test` passes 100% of tests.
- [ ] **Database Migrations Tested**: All migrations applied and verified on staging with `pgTAP` test suite.
- [ ] **Secrets & Keys**: No unencrypted secrets or credentials committed in git repository.
- [ ] **OWASP Top 10 Audit**: All High and Medium security findings remediated; CORS and rate limits tuned.
- [ ] **Dependency Audit**: `npm audit` reviewed and clean of critical vulnerabilities.
- [ ] **DPDP Privacy Readiness**: Consent capture active, data export endpoint verified, retention pruning tested.

---

## 2. Deployment Sequence (Staging First, Then Production)

### Step 1: Staging Deployment
- [ ] Merge release branch into `main` via PR with required CI checks passing.
- [ ] GitHub Actions deploys migrations to Staging Supabase project.
- [ ] GitHub Actions builds and deploys `ryde-capital-backend` Docker container to Render Staging.
- [ ] Verify staging readiness probe: `https://staging-api.ryde.capital/api/v1/health/readiness`.
- [ ] Run Maestro E2E test suite against staging environment.

### Step 2: Production Approval Gate
- [ ] Lead Engineer reviews staging Maestro run and performance metrics.
- [ ] Trigger manual production deployment approval in GitHub Actions.
- [ ] Apply migrations to Production Supabase project.
- [ ] Deploy backend to Render Production.
- [ ] Verify production health probe: `https://api.ryde.capital/api/v1/health/readiness`.

---

## 3. Mobile App Store Release (EAS Build)

- [ ] **Version Bump**: Increment `version` and `buildNumber` / `versionCode` in `app.json`.
- [ ] **Google Maps Scheme**: Confirm `ios.infoPlist.LSApplicationQueriesSchemes: ["comgooglemaps"]` in `app.json`.
- [ ] **Store Metadata**:
  - [ ] Google Play Store Data Safety Form submitted.
  - [ ] Background location access video justification submitted.
  - [ ] iOS Privacy Manifest (`PrivacyInfo.xcprivacy`) included.
- [ ] **EAS Build**:
  - [ ] Android AAB built with profile `production`: `eas build --platform android --profile production`
  - [ ] iOS IPA built with profile `production`: `eas build --platform ios --profile production`
- [ ] **Internal Testing Track**:
  - [ ] Deploy signed beta build to Google Play Internal Testing track.
  - [ ] Deploy signed beta build to Apple TestFlight.
  - [ ] Verify pilot driver completes full simulated trip on real physical device.

---

## 4. Post-Deployment Monitoring (T+0 to T+2 Hours)

- [ ] Monitor Sentry dashboard for novel unhandled exceptions.
- [ ] Check Datadog / Grafana error rate alert threshold (< 1.0%).
- [ ] Verify background jobs are running: `staleDriverCheck`, `telemetryPruningJob`, `settlementJob`.
- [ ] Perform live test SOS alert trigger and confirm SMS delivery to test contacts.
- [ ] Document release status in engineering changelog.
