# Runbook: Driver SOS & Emergency Safety Incident Handling

## 1. Safety Architecture Overview
When a driver presses the SOS button in the Ryde Capital mobile app:
1. `POST /api/v1/sos/trigger` is immediately called with GPS coordinates and optional active `trip_id`.
2. Backend creates an immutable `sos_events` record with status `triggered`.
3. SMS emergency notifications are dispatched to all registered emergency contacts (`emergency_contacts` table) via `ISmsProvider`.
4. High-priority push notifications and admin incident tickets are broadcast to the Safety Response Center (SRC).
5. Reverse geocoding calculates the street address (falling back to raw coordinates if Google Maps API is unavailable).

---

## 2. Operator Emergency Action Protocol (SLA: < 60 seconds)

### Step 1: Immediate Triage (0 - 60 seconds)
1. **Open Incident Dashboard**: View the incoming `sos_events` record.
2. **Retrieve Live Telemetry**:
   - Check driver's last known location, speed, heading, and live breadcrumb trail.
   - If trip is active: Retrieve customer name, pickup/drop coordinates, and vehicle registration.
3. **Attempt Driver Voice Contact**:
   - Call driver primary phone via dedicated safety line.
   - If driver answers and confirms genuine distress: Keep on line, gather details.
   - If driver does not answer after 2 attempts: Escalate immediately to Police Control Room (Dial 112).

### Step 2: Emergency Services Escalation (1 - 3 minutes)
1. **Contact Indian Emergency Services (Dial 112)**:
   - Provide exact coordinates: `Latitude: XX.XXXXXX, Longitude: YY.YYYYYY`.
   - Provide nearest landmark or reverse geocoded address.
   - Provide vehicle registration number, color, and model.
   - Provide driver name and registered mobile number.
2. **Notify Registered Emergency Contacts**:
   - Verify automated SMS delivery via SMS provider console.
   - If SMS failed: Manually dial the emergency contacts listed in `emergency_contacts`.

### Step 3: Incident Containment & Resolution
1. Once safety is confirmed by police, driver, or hospital:
   - Update `sos_events` status to `resolved` or `false_alarm`.
   - Record `resolution_notes`, operator ID, and timestamp.
2. File mandatory transport safety compliance report for regulatory records.
