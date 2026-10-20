# Ryde Capital Driver App — Design & Implementation Notes

## 1. Overview
The Ryde Capital Driver App frontend (`ryde-capital/mobile`) is built with React Native and Expo (TypeScript, Expo Router) matching the 33 reference designs (`01-Main.png` to `33-NoNet.png`, 824×1834 @ 2x, logical viewport 412×917).

- **Monorepo**: `ryde-platform/`
- **Theme**: Single source of truth in `src/theme/tokens.ts` (light theme only, high contrast ≥ 4.5:1, touch targets ≥ 48 dp).
- **Backend**: Zero real backend dependencies; talks strictly through a mock API layer with simulated latency, auto-arriving trip offers, and realistic Chennai routes/data.

---

## 2. 1-to-1 Screen Map (PNG → Route → File)

| # | Reference PNG | Route | Implementation File | Status | Notes / Logical Size (412×917) |
|---|---|---|---|---|---|
| 01 | `01-Main.png` | `app/index` | `app/index.tsx` | Matched | Splash logo fade-in & settle; routes to `(auth)/welcome` or `(tabs)` based on session & onboarding status. |
| 02 | `02-Welcome1.png` | `(auth)/welcome` | `app/(auth)/welcome.tsx` | Matched | Slide 1: "Move India forward. Earn on your terms." Teal illustration card, page dot 1 active, Next CTA. |
| 03 | `03-Welcome2.png` | `(auth)/welcome` | `app/(auth)/welcome.tsx` | Matched | Slide 2: "Transparent payouts every Tuesday." Daily tracking card, page dot 2 active, Next CTA. |
| 04 | `04-Welcome3.png` | `(auth)/welcome` | `app/(auth)/welcome.tsx` | Matched | Slide 3: "Verified, tracked and protected." Shield security card, page dot 3 active, Get started CTA. |
| 05 | `05-Login.png` | `(auth)/login` | `app/(auth)/login.tsx` | Matched | +91 country pill, 10-digit mobile field (validates starting with 6-9), amber "Send code" pill button. |
| 06 | `06-Otp.png` | `(auth)/otp` | `app/(auth)/otp.tsx` | Matched | 6-digit auto-advancing OTP boxes, 30s resend timer, lockout state after 3 failed attempts. |
| 07 | `07-Profile.png` | `(onboarding)/profile` | `app/(onboarding)/profile.tsx` | Matched | Full name text field, read-only mobile pill, face photo upload card (camera/gallery pickers), Step 1 dots. |
| 08 | `08-Verify.png` | `(onboarding)/verification` | `app/(onboarding)/verification.tsx` | Matched | Aadhaar number (zero-persistence, wiped on unmount), Aadhaar OTP, driving licence card, consent checkbox. |
| 09 | `09-Vehicles.png` | `(onboarding)/vehicles` | `app/(onboarding)/vehicles.tsx` | Matched | Two-wheeler, Three-wheeler, and Four-wheeler multi-select tiles with amber highlights and check icons. |
| 10 | `10-Review.png` | `(onboarding)/status` | `app/(onboarding)/status.tsx` | Matched | "Application under review" state with verified checklist badges and "Typically takes 2–4 hours" notice. |
| 11 | `11-Rejected.png` | `(onboarding)/status` | `app/(onboarding)/status.tsx` | Matched | Rejected state showing specific rejection reason banner with amber "Re-upload documents" button. |
| 12 | `12-Home.png` | `(tabs)/home` | `app/(tabs)/home.tsx` | Matched | Offline state: 4-stat grid (₹1,240, 4 trips, 3h 12m, 4.9★), recent bookings list, amber "Go online" pill. |
| 13 | `13-HomeOnline.png` | `(tabs)/home` | `app/(tabs)/home.tsx` | Matched | Online state: Live map view with dark styling, driver vehicle marker, floating "Finding bookings..." radar panel. |
| 14 | `14-Offer.png` | `trip/offer` | `app/trip/offer.tsx` | Matched | Incoming booking card: countdown ring (driven by `expiresAt`), customer Venkat, ₹190, pickup/drop, Reject/Accept. |
| 15 | `15-Preview.png` | `trip/offer-preview` | `app/trip/offer-preview.tsx` | Matched | Full-screen in-app route map with live countdown header, pickup & drop pins, Accept button. |
| 16 | `16-Navigate.png` | `trip/[id]/to-pickup` | `app/trip/[id]/to-pickup.tsx` | Matched | Route to pickup, customer call & message (SMS) buttons, "Navigate in Google Maps", "I've arrived" CTA. |
| 17 | `17-TripOtp.png` | `trip/[id]/arrival` | `app/trip/[id]/arrival.tsx` | Matched | Customer arrival: 4-digit start code input boxes, waiting timer, attempts remaining counter, "Verify code". |
| 18 | `18-VehicleCheck.png` | `trip/[id]/vehicle-check` | `app/trip/[id]/vehicle-check.tsx` | Matched | Handover check: 4-level fuel selector (E, ¼, ½, ¾, Full), odometer input, 6 photo slots (4 corners, interior, boot). |
| 19 | `19-Active.png` | `trip/[id]/active` | `app/trip/[id]/active.tsx` | Matched | In-progress live trip: destination map, "Navigate to drop in Google Maps", SOS button, share trip, "Reached". |
| 20 | `20-FinalCheck.png` | `trip/[id]/final-check` | `app/trip/[id]/final-check.tsx` | Matched | Return vehicle inspection: fuel level, end odometer, 4 return photos (front, rear, fuel gauge, odometer). |
| 21 | `21-Summary.png` | `trip/[id]/summary` | `app/trip/[id]/summary.tsx` | Matched | Completed trip fare card: ₹480 total, breakdown (base, distance, platform fee), ₹432 you earn, ₹1,720 today. |
| 22 | `22-Rate.png` | `trip/[id]/rate` | `app/trip/[id]/rate.tsx` | Matched | Rate customer: 5 interactive stars, quick-feedback chips ("Polite", "On time"), optional comments, "Skip", "Done". |
| 23 | `23-Sos.png` | `trip/[id]/sos` | `app/trip/[id]/sos.tsx` | Matched | Emergency screen: Hold for 3 seconds animated sweeping progress ring with haptics, "Cancel" text. |
| 24 | `24-SosSent.png` | `trip/[id]/sos` | `app/trip/[id]/sos.tsx` | Matched | Alert sent confirmation: "Help is on the way", red "Call 112" emergency button, "I'm safe · cancel alert". |
| 25 | `25-Cancel.png` | `trip/[id]/cancel` | `app/trip/[id]/cancel.tsx` | Matched | Cancellation modal: radio options list for reasons, danger pill "Confirm cancellation", outline "Keep trip". |
| 26 | `26-Earnings.png` | `(tabs)/earnings` | `app/(tabs)/earnings.tsx` | Matched | Today/Week/Month segmented pills, ₹1,240 large figure, 7-day bar chart (Sunday highlighted), trip rows card. |
| 27 | `27-Trips.png` | `(tabs)/trips` | `app/(tabs)/trips.tsx` | Matched | Trip history: All/Completed/Cancelled filter chips, detailed trip cards with timestamps, addresses, and fares. |
| 28 | `28-Notifs.png` | `notifications` | `app/notifications/index.tsx` | Matched | Notifications list: unread indicators, categories (payout, verification, booking, safety), timestamp relative time. |
| 29 | `29-Account.png` | `(tabs)/profile` | `app/(tabs)/profile.tsx` | Matched | Profile header: avatar initial, 4.9★ rating badge, navigation rows to Documents, Vehicles, Payout, SOS Contacts, Log out. |
| 30 | `30-Payout.png` | `payout` | `app/payout/index.tsx` | Matched | Payout account settings: UPI ID (`arun@okaxis`) or Bank account selector, verified badge, "Save changes". |
| 31 | `31-Contacts.png` | `emergency-contacts` | `app/emergency-contacts/index.tsx` | Matched | Emergency contacts list (max 5 counter), delete/edit actions, "+ Add contact" modal with name, relation, phone. |
| 32 | `32-Location.png` | `permissions/location` | `app/permissions/location.tsx` | Matched | Location permissions rationale: background tracking explanation, "Allow all the time", "Not now". |
| 33 | `33-NoNet.png` | `offline` | `app/offline.tsx` | Matched | Global offline screen: disconnected cloud illustration, network retry button, and top floating offline banner. |

---

## 3. Component System (`src/components/`)

All reusable components adhere to design tokens in `src/theme/tokens.ts`:

- `ScreenBackground.tsx`: Consistent layout container featuring decorative mid-teal corner circles with amber rings. The `deco={false}` prop cleanly suppresses decorations on full-screen map views.
- `Header.tsx`: Context-aware header supporting back arrow navigation, Ryde Capital logo (`Ryde` teal, `Capital` amber), unread notifications bell with badge, and driver profile initial.
- `Button.tsx`: Pill buttons (height 54, radius 27) with variants: `amber` (primary CTAs), `darkTeal` (secondary), `outline` (teal border), `danger` (cancellations/SOS), and `text`. Touch targets ≥ 48 dp.
- `TextField.tsx`: 52 dp height, 2 px dark-teal border, 14 radius, white background.
- `PhoneField.tsx`: 🇮🇳 +91 country pill with 10-digit input validating Indian mobile prefixes (6, 7, 8, 9).
- `OtpInput.tsx`: Configurable digit length (6 for auth, 4 for trip arrival). Features paste distribution, auto-advance, backspace navigation, and error highlights.
- `CountdownRing.tsx`: SVG animated progress ring driven strictly by an `expiresAt` timestamp (independent of local counter state, isolated to prevent unnecessary re-renders).
- `HoldToConfirm.tsx`: 3-second hold confirmation component for SOS with animated SVG sweeping ring, haptic pulses, and cancel on early release.
- `FuelSelector.tsx`: Segmented fuel gauge selector (`E`, `1/4`, `1/2`, `3/4`, `Full`) with visual indicators matching vehicle check screens.
- `PhotoSlot.tsx`: Grid photo capture slots supporting empty, uploading with progress, uploaded preview, and error states.
- `BarChart.tsx`: 7-day bar chart with animated bars, value scaling, and amber highlighting for Sunday / active days.
- `StarRating.tsx`: 5-star interactive rating component with half-star support and accessibility labels.
- `BottomTabs.tsx`: Persistent 4-tab bar (`Home`, `Trips`, `Earnings`, `Profile`) with active amber 4 px underline indicator.
- `Card.tsx`, `Row.tsx`, `Chip.tsx`, `StepDots.tsx`: Consistent surfaces, dividers, selection chips, and 4-step onboarding dots.
- `Banner.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `Skeleton.tsx`: System feedback, offline banners, and loading skeleton placeholders.

---

## 4. Mock API & Switching (`EXPO_PUBLIC_USE_MOCKS`)

The app communicates with an abstracted API client in `src/services/api/index.ts`:

- **Environment Flag**:
  Set `EXPO_PUBLIC_USE_MOCKS=true` (enabled by default in `.env`) to run completely offline without a backend.
- **Modules Covered**:
  - `auth`: `sendOtp`, `verifyOtp`, `refreshSession`
  - `driver`: `getProfile`, `updateProfile`, `uploadDocument`, `getOnboardingStatus`
  - `availability`: `getStatus`, `toggleOnline`
  - `assignments` & `trips`: `getPendingOffer`, `acceptOffer`, `rejectOffer`, `getTripDetails`, `updateTripState`, `verifyArrivalOtp`, `submitVehicleCheck`, `completeTrip`
  - `earnings`: `getEarningsSummary`, `getEarningsBreakdown`
  - `safety`: `triggerSos`, `cancelSos`, `getEmergencyContacts`, `addEmergencyContact`
  - `notifications`: `getNotifications`, `markAsRead`
- **Timer-Driven Offers**:
  When going online, an incoming ride offer from "Venkat" (₹190, Two-wheeler, T. Nagar to Puzhal) automatically arrives after 2.5 seconds to permit realistic physical device demos.

---

## 5. Security & Privacy

1. **Aadhaar Zero-Persistence**:
   - The Aadhaar number is accepted only in `app/(onboarding)/verification.tsx`.
   - Never stored in global Zustand store.
   - Never written to `expo-secure-store`.
   - Never logged to console (`console.log`, `console.warn`, `console.error`).
   - Cleared from component state immediately upon unmount.
2. **Google Maps Navigation Handoff (ADR 014)**:
   - Implemented in `src/services/maps-handoff.ts`.
   - Strictly permitted only for active, accepted trips.
   - Universal Google Maps intent URLs:
     - Android: `google.navigation:q=LAT,LNG&mode=l` (two-wheeler) or `mode=d` (cars).
     - iOS: `comgooglemaps://?daddr=LAT,LNG&directionsmode=two-wheeler` (or driving fallback).
   - Universal web URL fallback: `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&travelmode=two-wheeler`.
3. **No In-App Chat**:
   - Tapping "Message" on the active trip screen opens the native SMS app with the customer's phone number (`sms:+919876543210`).

---

## 6. Visual Fidelity Details & Minor Adaptations

- **Corner Motifs**: Reference designs `01-Main.png` to `12-Home.png` feature decorative mid-teal circles in the top-left and bottom-right corners. We created `ScreenBackground` which conditionally renders these SVG elements via the `deco` prop. Map-heavy screens (`13-HomeOnline`, `15-Preview`, `16-Navigate`, `19-Active`) set `deco={false}` to allow full map visibility.
- **Font Availability**: Typography utilizes `Plus Jakarta Sans` weights (500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold) loaded via `expo-font`, with system sans-serif fallbacks on initial load.
- **Contrast**: All card texts utilize `#07383E` (dark ink) on `#ACCDD1` (card) and `#FFFFFF` (white card), comfortably exceeding WCAG 4.5:1. Amber `#F2B441` is used exclusively for fills and active indicators, never for text on light backgrounds.
