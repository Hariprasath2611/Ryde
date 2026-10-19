# Ryde Capital: Beta Test Plan & Pilot Driver Checklist

## 1. Scope & Pilot Objective
The pilot testing phase validates the Ryde Capital driver mobile application on real hardware (Android and iOS) with a closed cohort of 25-50 pilot drivers in Bangalore. The objective is to verify end-to-end trip completion, edge-case survivability, and backend stability prior to public rollout.

---

## 2. Comprehensive Test Flow & Edge Cases

### Test Scenario Matrix:

| Test ID | Scenario | Edge Case Injected | Verification Checklist | Pass Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **Happy Path Trip** | Standard flow | • Accept offer within 15s countdown{'\n'}• Navigate to pickup{'\n'}• Arrive & enter customer OTP{'\n'}• Complete vehicle handover{'\n'}• Start trip & navigate to drop{'\n'}• End trip & check earnings | Trip status reaches `completed`; net earnings added to summary. |
| **TC-02** | **Killed App Mid-Trip** | Force kill app during `in_progress` state; restart after 60s | • Open app after kill{'\n'}• AuthGuard restores session{'\n'}• Route guard immediately restores active Trip screen in `in_progress` status | Zero state loss; trip continues without requiring driver re-login. |
| **TC-03** | **GPS Signal Loss** | Driver enters underground basement / tunnel (GPS disabled for 3 mins) | • App detects low location accuracy{'\n'}• Caches last known coordinate{'\n'}• Seamlessly resumes location streaming when satellite lock returns | No app crash; backend ignores low-accuracy jitter points. |
| **TC-04** | **Poor / Offline Network** | Airplane mode toggled during trip | • Red `OfflineBanner` displays ("No Internet Connection. Reconnecting..."){'\n'}• Telemetry pings queued locally{'\n'}• On network recovery, batch telemetry flushes | UI remains interactive; no unhandled promise rejections. |
| **TC-05** | **Incorrect OTP Entry** | Driver enters wrong 4-digit customer OTP 3 consecutive times | • 1st wrong attempt: "Invalid OTP. 2 attempts remaining."{'\n'}• 2nd wrong attempt: "Invalid OTP. 1 attempt remaining."{'\n'}• 3rd wrong attempt: Trip OTP locked; requires customer support override | Driver blocked from starting trip with fraudulent OTP. |
| **TC-06** | **Emergency SOS** | Driver taps Emergency SOS during active trip | • Confirmation countdown displays{'\n'}• Coordinates transmitted to backend{'\n'}• Emergency SMS sent to registered contacts{'\n'}• Reverse-geocoded landmark resolved | SOS event created in `< 1.5s`; contacts receive alert SMS. |
| **TC-07** | **Google Maps Handoff** | Driver taps "Navigate with Google Maps" | • Google Maps app launches with destination pin{'\n'}• Ryde background service keeps tracking telemetry{'\n'}• Driver returns to Ryde app via system back button | No background kill; battery drain normal. |

---

## 3. Pilot Onboarding & Distribution Architecture

1. **Android Distribution**:
   - Google Play Console -> **Internal Testing Track**.
   - Drivers invited via Gmail list (`ryde-pilot-drivers@googlegroups.com`).
   - One-tap install link via Google Play Store.
2. **iOS Distribution**:
   - Apple App Store Connect -> **TestFlight**.
   - Public TestFlight link shared with registered pilot drivers.
3. **Driver Feedback & Bug Channel**:
   - Dedicated WhatsApp Community: `Ryde Driver Beta Club`.
   - In-app "Report Issue" button transmitting crash logs and device state.
4. **Bug Triage Matrix**:
   - **P0 (Blocker)**: Crash on launch, failure to complete trip, incorrect fare deduction -> Hotfix within 12 hours via EAS Update or rapid build.
   - **P1 (High)**: GPS freeze, notification delay > 30s -> Patch within 48 hours.
   - **P2 (Normal)**: Minor UI alignment on small screens -> Next sprint release.
