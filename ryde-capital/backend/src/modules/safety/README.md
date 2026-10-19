# Safety Module

Handles emergency SOS alerts, automated safety protocols, location broadcast during incident, and trusted emergency contacts.

## Layer Structure

- `routes.ts`: Maps SOS trigger and contact endpoints (`/trips/:id/sos`, `/emergency-contacts`).
- `controller.ts`: Handles emergency requests and error forwarding.
- `service.ts`: SOS incident handling, emergency contact notification, and escalation protocols.
- `repository.ts`: Direct operations on `sos_events` and `emergency_contacts`.
- `schema.ts`: Zod schema validating coordinate telemetry and contact details.

## Endpoints

- `POST /api/v1/trips/:id/sos`: Trigger high-priority driver SOS distress signal (501 Stub).
- `GET /api/v1/emergency-contacts`: Retrieve driver's trusted emergency contacts (501 Stub).
- `POST /api/v1/emergency-contacts`: Register a new emergency contact (501 Stub).
