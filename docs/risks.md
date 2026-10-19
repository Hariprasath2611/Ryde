# Ryde Platform: Known Risks & Mitigation Log

## Risk Assessment Matrix

| Risk ID | Category | Severity | Likelihood | Mitigation Strategy | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RISK-01** | **Security / Secrets** | High | Low | Initial dev project keys in git history were committed in early scaffolding. All `.env.example` templates sanitized with placeholders. Dev project keys rotated. Staging and Production utilize separate, isolated Supabase projects with zero shared secrets. | ✅ Remediated |
| **RISK-02** | **Legal & DPDP Compliance** | Medium | Medium | Digital Personal Data Protection Act 2023 readiness requires formal legal counsel review before commercial operations. Full technical scaffolding (consent capture, machine-readable export, 30-day erasure grace period) implemented. Formal legal review scheduled. | 🟡 Scaffolding Complete (Awaiting Legal Sign-off) |
| **RISK-03** | **Scalability & Connection Exhaustion** | High | Low | Direct PostgreSQL connections (`port 5432`) would exhaust under 1,000 drivers streaming location every 5 seconds. All backend traffic routes through Supabase Supavisor Transaction Pooler (`port 6543`) multiplexing 10,000+ queries over warm connections. | ✅ Remediated |
| **RISK-04** | **Third-Party API Outages (Maps & SMS)** | Medium | Low | Outages in Google Maps or SMS gateways could cause cascading failures. Circuit breakers (`shared/src/lib/circuitBreaker.ts`) implemented with Haversine geometric fallback and automatic circuit half-open probing. | ✅ Remediated |
| **RISK-05** | **OEM Background OS App Kills** | Medium | Medium | Aggressive Android OEM battery managers (MIUI, OneUI) kill background location tracking. Handled via persistent Android Foreground Service notification and iOS continuous location background mode. Tested with 30-minute endurance session. | ✅ Tested & Controlled |
| **RISK-06** | **Financial Data Retention vs Right to Erasure** | Medium | Low | India Income Tax Act and Motor Vehicle Aggregator rules require 7-year audit retention, conflicting with DPDP right to erasure. Implemented selective anonymization: scrubs all identifying PII (name, phone, photo, license) while preserving anonymized financial ledger entries. | ✅ Remediated |
