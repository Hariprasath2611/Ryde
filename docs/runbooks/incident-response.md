# Runbook: Engineering Incident Response Procedure

## 1. Incident Severity Definitions

| Severity | Definition | Response SLA | Paging Channel |
| :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Core outage: drivers cannot accept trips, active trip tracking down, SOS alerts failing, widespread auth errors. | **< 15 minutes** | PagerDuty / On-Call Phone Call + `#war-room-sev1` |
| **SEV-2 (High)** | Major degradation: document uploads failing, matching engine delayed > 30s, payout settling job failed, elevated 5xx error rate > 2%. | **< 30 minutes** | Slack `@oncall-backend` + `#incidents` |
| **SEV-3 (Medium)** | Minor feature failure: non-critical notifications delayed, rating submission retry loop, non-blocking UI glitches. | **< 4 hours** | Slack `#engineering-support` |
| **SEV-4 (Low)** | Cosmetic bugs, minor edge-case documentation errors, minor latency blips. | Next business day | Jira ticket |

---

## 2. Active Incident Protocol

### Step 1: Mobilize & Assign Roles
- **Incident Commander (IC)**: Leads triage, coordinates remediation, and owns executive communications.
- **Operations Lead**: Inspects logs, monitors metrics, executes infrastructure changes and database rollback drills.
- **Communications Lead**: Posts driver app notifications, status page updates, and coordinates customer care.

### Step 2: Diagnostic & Triage Checklist
1. **Check System Health Probes**:
   ```bash
   curl -i https://api.ryde.capital/api/v1/health/readiness
   ```
2. **Review Centralized Logs**:
   - Filter by request ID: `req.id = "..."`
   - Check error spikes: `level >= error`
   - Check circuit breaker states: `GoogleMapsBreaker`, `SMSProviderBreaker`
3. **Inspect Database Load & Connections**:
   - Verify Supavisor pooler connection count (`active_connections < pool_limit`).
   - Run `SELECT * FROM pg_stat_activity WHERE state != 'idle';` to detect locking contention.

### Step 3: Mitigation Strategies
- If backend deployment introduced regression: Execute [Rollback Procedure](./rollback-procedure.md).
- If external API (Google Maps / SMS) is degraded: Confirm circuit breaker tripped and fallback mode is active (Haversine distance).
- If database is corrupted: Execute [Disaster Recovery Drill](./disaster-recovery.md).

---

## 3. Post-Mortem & Incident Review
Within 48 hours of any SEV-1 or SEV-2 incident, the Incident Commander must publish a Post-Mortem document including:
1. Incident Summary & Timeline (detection, response, resolution).
2. Root Cause Analysis (5 Whys).
3. Preventive & Remedial Action Items with assigned owners and deadlines.
