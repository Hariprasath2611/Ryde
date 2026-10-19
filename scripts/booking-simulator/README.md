# Ryde Platform - Booking Simulator CLI (Phase 3)

The Booking Simulator CLI allows development and QA teams to emulate customer booking requests, test proximity-based driver matching, and verify realtime ride offers in the Ryde Capital driver mobile app without requiring real customers or live vehicles.

## Prerequisites

Ensure `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` are set in `ryde-capital/backend/.env` or root `.env`.

## Commands & Usage

Run the simulator using `npx tsx`:

### 1. Create a Booking Near a Specific Driver
Places a booking ~200m from the specified driver's latest GPS position:
```bash
npx tsx scripts/booking-simulator/index.ts create --near-driver DRV-1001
```

### 2. Create a Booking at Coordinates
```bash
npx tsx scripts/booking-simulator/index.ts create --lat 12.9716 --lng 77.5946 --vehicle four_wheeler --fare 450
```

Supported vehicles:
- `four_wheeler` (default)
- `two_wheeler`
- `three_wheeler`

### 3. Generate a Random Booking
Creates a booking with randomized coordinates and vehicle type around the metro center:
```bash
npx tsx scripts/booking-simulator/index.ts random
```

### 4. Continuous Mode (Repeat every N seconds)
Simulates continuous incoming passenger demand for stress testing the matching engine:
```bash
npx tsx scripts/booking-simulator/index.ts repeat --interval 15 --count 10
```

### 5. Check System Matching & Assignment Status
Inspects the last 10 bookings and their assignment status:
```bash
npx tsx scripts/booking-simulator/index.ts status
```

Output format:
```text
=== RECENT BOOKINGS & MATCHING STATUS ===

ID                                   | STATUS          | FARE    | PICKUP
-------------------------------------+-----------------+---------+--------------------------
40000000-0000-0000-0000-000000000001 | searching       | ₹450    | Indiranagar 100ft Rd
   └─ Offer -> Driver: 10000000... | Status: OFFERED | Expires: 6:45:20 PM
```

### 6. Cancel a Booking
```bash
npx tsx scripts/booking-simulator/index.ts cancel <booking_id>
```
